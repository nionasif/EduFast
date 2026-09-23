const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

/**
 * Scrapes board examination results using Puppeteer to bypass WAF challenges & solve math captchas.
 *
 * @param {string} examType - 'ssc' | 'hsc' | 'jsc'
 * @param {string} board - Board name (e.g. 'dhaka', 'chittagong')
 * @param {number|string} year - Exam year
 * @param {string} roll - Roll number
 * @param {string} reg - Registration number
 */
async function scrapeResult(examType, board, year, roll, reg) {
  // Mapping exam type
  let boardResultExamType = 'ssc'; // default
  if (examType === 'hsc') {
    boardResultExamType = 'hsc';
  } else if (examType === 'jsc') {
    boardResultExamType = 'jsc';
  }

  // Board mapping from frontend select value to portal board option value
  const rawBoard = board.toLowerCase();
  const boardMap = {
    'dhaka': 'dhaka',
    'chittagong': 'chittagong',
    'chattogram': 'chittagong',
    'rajshahi': 'rajshahi',
    'comilla': 'comilla',
    'barisal': 'barisal',
    'barishal': 'barisal',
    'jessore': 'jessore',
    'jashore': 'jessore',
    'sylhet': 'sylhet',
    'dinajpur': 'dinajpur',
    'mymensingh': 'mymensingh',
    'madrasah': 'madrasah',
    'technical': 'technical'
  };

  const mappedBoard = boardMap[rawBoard] || rawBoard;

  console.log(`[Scraper] Launching browser to fetch ${examType.toUpperCase()} result...`);
  const browser = await puppeteer.launch({
    headless: process.env.HEADLESS === 'true', // Headless ONLY if explicitly requested
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  try {
    const page = await browser.newPage();
    // Mask Puppeteer automated indicators
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });

    console.log(`[Scraper] Navigating to http://www.educationboardresults.gov.bd/`);
    await page.goto('http://www.educationboardresults.gov.bd/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Handle WAF challenge
    console.log('[Scraper] Resolving WAF challenge if present...');
    for (let attempt = 1; attempt <= 10; attempt++) {
      const hasForm = await page.evaluate(() => !!document.querySelector('select[name="exam"]'));
      if (hasForm) {
        console.log('[Scraper] Portal form is active.');
        break;
      }

      const promptText = await page.evaluate(() => {
        const el = document.querySelector('.challenge-prompt');
        return el ? el.textContent.trim() : null;
      });

      if (!promptText) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      console.log(`[Scraper WAF] Attempt ${attempt} Prompt: "${promptText}"`);

      if (promptText.includes('=')) {
        const match = promptText.match(/(\d+)\s*\+\s*(\d+)/);
        if (match) {
          const sum = parseInt(match[1], 10) + parseInt(match[2], 10);
          await page.click(`.choice-button[data-value="${sum}"]`);
          await new Promise(resolve => setTimeout(resolve, 2500));
          continue;
        }
      }

      if (promptText.toLowerCase().includes('select the')) {
        const match = promptText.match(/select the (\w+) color/i);
        if (match) {
          const colorName = match[1].toLowerCase();
          await page.click(`.choice-button[data-value="${colorName}"]`);
          await new Promise(resolve => setTimeout(resolve, 2500));
          continue;
        }
      }

      // Reload unsupported challenge
      const reloadBtn = await page.$('.challenge-reload-button');
      if (reloadBtn) {
        await reloadBtn.click();
      } else {
        await page.reload({ waitUntil: 'load' });
      }
      await new Promise(resolve => setTimeout(resolve, 2500));
    }

    // Wait for the page form elements to display
    console.log('[Scraper] Waiting for form controls...');
    await page.waitForSelector('select[name="exam"]', { timeout: 20000 });

    console.log('[Scraper] Selecting parameters...');
    // Select Exam Type
    await page.select('select[name="exam"]', boardResultExamType);
    
    // Select Board
    await page.select('select[name="board"]', mappedBoard);
    
    // Select Year
    await page.select('select[name="year"]', year.toString());
    
    // Enter Roll
    await page.focus('input[name="roll"]');
    await page.keyboard.press('Backspace');
    await page.type('input[name="roll"]', roll);
    
    // Enter Reg
    await page.focus('input[name="reg"]');
    await page.keyboard.press('Backspace');
    await page.type('input[name="reg"]', reg);

    // Extract Math challenge from the cell containing '+' symbol
    console.log('[Scraper] Finding math captcha...');
    const captchaText = await page.evaluate(() => {
      const tds = Array.from(document.querySelectorAll('td'));
      const mathTd = tds.find(td => td.textContent.includes('+'));
      return mathTd ? mathTd.textContent : null;
    });

    if (!captchaText) {
      throw new Error('Could not find math captcha equation on page.');
    }

    const match = captchaText.match(/(\d+)\s*\+\s*(\d+)/);
    if (!match) {
      throw new Error(`Could not parse captcha formula from: "${captchaText}"`);
    }

    const sum = parseInt(match[1], 10) + parseInt(match[2], 10);
    console.log(`[Scraper] Resolved captcha: ${match[1]} + ${match[2]} = ${sum}`);

    // Enter Captcha Answer
    await page.type('input[name="value_s"]', sum.toString());

    // Submit and wait for result page
    console.log('[Scraper] Submitting form...');
    await Promise.all([
      page.click('input[type="submit"][name="button2"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 25000 })
    ]);

    const html = await page.content();
    const $ = cheerio.load(html);

    // Dynamic cheerio parser to locate values next to their respective labels
    function parseValueForLabel(labelText) {
      let val = '';
      $('td').each((i, el) => {
        const text = $(el).text().trim().toLowerCase();
        if (text.includes(labelText.toLowerCase())) {
          const nextTd = $(el).next('td');
          if (nextTd.length > 0) {
            val = nextTd.text().trim();
            // Skip helper colons, grab actual data
            if (val === ':' || val === '') {
              const nextNextTd = nextTd.next('td');
              if (nextNextTd.length > 0) {
                val = nextNextTd.text().trim();
              }
            }
          }
        }
      });
      return val;
    }

    const name = parseValueForLabel('Name');

    if (!name) {
      // Look for WAF or generic portal validation error blocks
      let errorMsg = 'Failed to fetch result. Check roll, registration, board, and year.';
      $('font, div, p, span').each((i, el) => {
        const text = $(el).text().trim();
        if (text.toLowerCase().includes('not found') || 
            text.toLowerCase().includes('invalid') || 
            text.toLowerCase().includes('error') || 
            text.toLowerCase().includes('incorrect')) {
          errorMsg = text;
        }
      });
      throw new Error(errorMsg);
    }

    const fathersName = parseValueForLabel("Father's Name") || parseValueForLabel("Father Name");
    const mothersName = parseValueForLabel("Mother's Name") || parseValueForLabel("Mother Name");
    const group = parseValueForLabel('Group');
    const resultText = parseValueForLabel('Result');
    const institute = parseValueForLabel('Institute') || parseValueForLabel('School') || parseValueForLabel('College');

    // Parse GPA from response string, e.g., "PASSED (GPA=5.00)"
    let gpa = null;
    const gpaMatch = resultText.match(/GPA\s*=\s*([0-9.]+)/i);
    if (gpaMatch) {
      gpa = parseFloat(gpaMatch[1]);
    } else if (resultText.match(/^[0-9.]+$/)) {
      gpa = parseFloat(resultText);
    }

    console.log('[Scraper] Successfully parsed result:', { name, gpa, institute, group });

    return {
      success: true,
      data: {
        name,
        fathersName,
        mothersName,
        gpa: gpa || 0.0,
        institute,
        group
      }
    };

  } catch (err) {
    console.error('[Scraper] Scraping process failed:', err.message);
    return {
      success: false,
      error: err.message
    };
  } finally {
    await browser.close();
  }
}

module.exports = {
  scrapeResult
};
