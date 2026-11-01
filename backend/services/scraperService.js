const fs = require('fs');
const path = require('path');
let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  puppeteer = null;
}

// Active verification sessions map (sessionId -> { browser, page, examType, board, year, roll, reg, createdAt })
const activeSessions = new Map();

// Clean up expired sessions periodically (older than 3 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [id, sess] of activeSessions.entries()) {
    if (now - sess.createdAt > 180000) {
      activeSessions.delete(id);
      try {
        sess.browser.close();
      } catch (e) {}
    }
  }
}, 60000);

/**
 * Searches local verified board result registry and SQLite database.
 */
async function findInLocalRegistry(examType, board, year, roll, reg) {
  const normExam = (examType || '').toLowerCase().trim();
  const normBoard = (board || '').toLowerCase().trim();
  const normYear = parseInt(year, 10);
  const normRoll = String(roll || '').trim();
  const normReg = String(reg || '').trim();

  // 1. Check registry JSON file
  try {
    const registryPath = path.join(__dirname, '..', 'data', 'boardResultsRegistry.json');
    if (fs.existsSync(registryPath)) {
      const registryData = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      if (Array.isArray(registryData)) {
        const found = registryData.find((item) => {
          const matchExam = (item.exam || '').toLowerCase().trim() === normExam;
          const matchBoard = (item.board || '').toLowerCase().trim() === normBoard;
          const matchYear = parseInt(item.year, 10) === normYear;
          const matchRoll = String(item.roll || '').trim() === normRoll;
          const matchReg = !normReg || String(item.reg || '').trim() === normReg;
          return matchExam && matchBoard && matchYear && matchRoll && matchReg;
        });

        if (found) {
          console.log(`[Scraper] Found verified record in board registry for Roll ${normRoll}`);
          return {
            name: found.name,
            fathersName: found.fathersName,
            mothersName: found.mothersName,
            gpa: found.gpa,
            institute: found.institute || found.school || found.college,
            group: found.group || 'Science'
          };
        }
      }
    }
  } catch (err) {
    console.warn('[Scraper] Registry check warning:', err.message);
  }

  // 2. Check SQLite students table
  try {
    const { getDb } = require('../config/db');
    const db = getDb();
    if (db) {
      let query = '';
      let params = [];
      if (normExam === 'ssc') {
        query = `SELECT * FROM students WHERE sscRoll = ? AND (sscReg = ? OR ? = '')`;
        params = [normRoll, normReg, normReg];
      } else {
        query = `SELECT * FROM students WHERE hscRoll = ? AND (hscReg = ? OR ? = '')`;
        params = [normRoll, normReg, normReg];
      }
      const row = await db.get(query, params);
      if (row) {
        console.log(`[Scraper] Found verified record in SQLite for Roll ${normRoll}`);
        return {
          name: row.name,
          fathersName: row.fathersName,
          mothersName: row.mothersName,
          gpa: normExam === 'ssc' ? (row.sscGpa || 5.0) : (row.hscGpa || 5.0),
          institute: normExam === 'ssc' ? (row.sscSchool || 'A.K High School And College') : (row.hscCollege || 'College'),
          group: row.academicGroup || 'Science'
        };
      }
    }
  } catch (err) {}

  return null;
}

/**
 * Saves or updates a verified result in the local registry JSON.
 */
function saveToLocalRegistry(examType, board, year, roll, reg, data) {
  try {
    const registryPath = path.join(__dirname, '..', 'data', 'boardResultsRegistry.json');
    let records = [];
    if (fs.existsSync(registryPath)) {
      records = JSON.parse(fs.readFileSync(registryPath, 'utf8') || '[]');
    }

    const normExam = (examType || '').toLowerCase().trim();
    const normBoard = (board || '').toLowerCase().trim();
    const normYear = parseInt(year, 10);
    const normRoll = String(roll || '').trim();
    const normReg = String(reg || '').trim();

    const existingIdx = records.findIndex(
      (r) =>
        (r.exam || '').toLowerCase() === normExam &&
        (r.board || '').toLowerCase() === normBoard &&
        parseInt(r.year, 10) === normYear &&
        String(r.roll) === normRoll
    );

    const recordPayload = {
      exam: normExam,
      board: normBoard,
      year: normYear,
      roll: normRoll,
      reg: normReg,
      name: data.name,
      fathersName: data.fathersName,
      mothersName: data.mothersName,
      gpa: data.gpa,
      institute: data.institute,
      group: data.group || 'Science'
    };

    if (existingIdx !== -1) {
      records[existingIdx] = recordPayload;
    } else {
      records.push(recordPayload);
    }

    fs.writeFileSync(registryPath, JSON.stringify(records, null, 2), 'utf8');
    console.log(`[Scraper] Successfully cached verified result for Roll ${normRoll} in board registry.`);
  } catch (err) {
    console.warn('[Scraper] Failed to cache verified result:', err.message);
  }
}

/**
 * Detects local Chrome installation.
 */
function getChromeExecutablePath() {
  const potentialPaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.CHROME_BIN,
    process.env.PUPPETEER_EXECUTABLE_PATH
  ].filter(Boolean);

  return potentialPaths.find((p) => {
    try {
      return fs.existsSync(p);
    } catch {
      return false;
    }
  });
}

/**
 * Initializes a real-time live session on educationboardresults.gov.bd/v2/home
 * Returns the session ID and live CAPTCHA image (data:image/png;base64,...).
 */
async function startVerificationSession(examType, board, year, roll, reg) {
  if (!puppeteer) {
    throw new Error('Puppeteer is not installed on the server.');
  }

  const executablePath = getChromeExecutablePath();
  const sessionId = 'board_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  console.log(`[Live Board Scraper] Starting session ${sessionId} for Roll ${roll}, Board: ${board}, Year: ${year}...`);

  const browser = await puppeteer.launch({
    executablePath: executablePath || undefined,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate to government portal
    console.log(`[Session ${sessionId}] Navigating to https://educationboardresults.gov.bd/v2/home ...`);
    await page.goto('https://educationboardresults.gov.bd/v2/home', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait 5 seconds for BPanel challenge redirection to complete
    await new Promise((r) => setTimeout(r, 5000));

    // Map board name
    const rawBoard = (board || '').toLowerCase().trim();
    const boardMap = {
      dhaka: 'dhaka',
      chittagong: 'chittagong',
      chattogram: 'chittagong',
      rajshahi: 'rajshahi',
      comilla: 'comilla',
      barisal: 'barisal',
      barishal: 'barisal',
      jessore: 'jessore',
      jashore: 'jessore',
      sylhet: 'sylhet',
      dinajpur: 'dinajpur',
      mymensingh: 'mymensingh',
      madrasah: 'madrasah',
      technical: 'tec',
      tec: 'tec'
    };
    const mappedBoard = boardMap[rawBoard] || rawBoard;

    // Fill form dropdowns
    await page.select('#exam', (examType || 'ssc').toLowerCase());
    await page.select('#year', String(year));
    await page.select('#board', mappedBoard);
    await page.select('#result_type', '1'); // 1 = Individual/Detailed Result

    // Wait for dynamic inputs to unlock
    await new Promise((r) => setTimeout(r, 2000));

    // Type Roll and Registration
    await page.type('#roll', String(roll));
    if (reg) {
      await page.type('#reg', String(reg));
    }

    // Capture the official live captcha image
    const captchaEl = await page.$('#captcha_img');
    if (!captchaEl) {
      throw new Error('Could not find captcha image on education board portal.');
    }

    const buffer = await captchaEl.screenshot();
    const base64Data = buffer.toString('base64');
    const captchaImage = `data:image/png;base64,${base64Data}`;

    // Store active session in memory
    activeSessions.set(sessionId, {
      browser,
      page,
      examType,
      board: mappedBoard,
      year,
      roll,
      reg,
      createdAt: Date.now()
    });

    console.log(`[Session ${sessionId}] Live captcha captured successfully.`);
    return {
      success: true,
      sessionId,
      captchaImage
    };
  } catch (err) {
    try {
      await browser.close();
    } catch (closeErr) {}
    console.error(`[Session ${sessionId}] Failed to initialize:`, err.message);
    throw err;
  }
}

/**
 * Reloads the live captcha image for an active session.
 */
async function reloadSessionCaptcha(sessionId) {
  const sess = activeSessions.get(sessionId);
  if (!sess) {
    throw new Error('Verification session expired. Please start a new verification.');
  }

  const { page } = sess;
  try {
    const reloadBtn = await page.$('#captcha_reload');
    if (reloadBtn) {
      await reloadBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
    }

    const captchaEl = await page.$('#captcha_img');
    const buffer = await captchaEl.screenshot();
    const base64Data = buffer.toString('base64');
    return {
      success: true,
      captchaImage: `data:image/png;base64,${base64Data}`
    };
  } catch (err) {
    throw new Error('Failed to reload captcha image: ' + err.message);
  }
}

/**
 * Submits the user-provided 4-digit captcha and intercepts the official /v2/getres response.
 */
async function submitCaptchaAndGetResult(sessionId, captchaDigits) {
  const sess = activeSessions.get(sessionId);
  if (!sess) {
    throw new Error('Verification session has expired. Please try again.');
  }

  const { browser, page, examType, board, year, roll, reg } = sess;
  activeSessions.delete(sessionId);

  try {
    const cleanDigits = String(captchaDigits || '').trim().replace(/\D/g, '');
    if (cleanDigits.length !== 4) {
      throw new Error('Captcha must be exactly 4 digits.');
    }

    console.log(`[Session ${sessionId}] Typing captcha ${cleanDigits} and submitting...`);
    await page.focus('#captcha');
    await page.type('#captcha', cleanDigits);

    // Set up AJAX interception for /v2/getres
    const resultPromise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Government server response timed out after 18 seconds.'));
      }, 18000);

      page.on('response', async (res) => {
        if (res.url().includes('getres')) {
          clearTimeout(timer);
          try {
            const json = await res.json();
            resolve(json);
          } catch (e) {
            reject(new Error('Failed to parse education board response.'));
          }
        }
      });
    });

    // Click submit
    await page.click('#submit');

    // Wait for the AJAX response
    const resp = await resultPromise;
    console.log(`[Session ${sessionId}] Official Board Response received:`, JSON.stringify(resp));

    if (resp.status === 0 && resp.res) {
      const r = resp.res;
      console.log(`[Session ${sessionId}] Full raw result object:`, JSON.stringify(r, null, 2));

      // 1. Parse GPA from all potential government fields
      let gpa = null;
      if (typeof r.gpa === 'number' && r.gpa > 0) {
        gpa = r.gpa;
      } else if (typeof r.gpa === 'string' && !isNaN(parseFloat(r.gpa)) && parseFloat(r.gpa) > 0) {
        gpa = parseFloat(r.gpa);
      }

      // Check res_detail or result (e.g. "PASSED (GPA=5.00)" or "GPA 4.67" or "GPA=4.67" or "5.00")
      if (!gpa) {
        const rawResText = String(r.res_detail || r.result || '');
        const match = rawResText.match(/(?:GPA\s*[=:]*\s*|GRADE\s*[=:]*\s*)?([1-5]\.\d{1,2}|5(?:\.0{1,2})?)/i);
        if (match && match[1]) {
          gpa = parseFloat(match[1]);
        }
      }

      // Fallback: Check if any float between 1.00 and 5.00 appears in response JSON
      if (!gpa) {
        const anyMatch = JSON.stringify(r).match(/(?:gpa|result|grade)[^0-9]*([1-5]\.\d{1,2}|5(?:\.0{1,2})?)/i);
        if (anyMatch && anyMatch[1]) {
          gpa = parseFloat(anyMatch[1]);
        }
      }

      // 2. Parse Institute / College / School Name
      const institute = r.inst_name || r.i_name || r.institute || r.college || r.school || (r.eiin ? `EIIN: ${r.eiin}` : '');

      // 3. Parse Father's & Mother's Names
      const fathersName = r.fname || r.fn || r.fathers_name || '';
      const mothersName = r.mname || r.mn || r.mothers_name || '';

      const resultData = {
        name: r.name || '',
        fathersName,
        mothersName,
        gpa: gpa || 0.0,
        institute: institute || '',
        group: r.stud_group || 'Science',
        roll: r.roll_no || roll,
        reg: r.regno || reg,
        dob: r.dob || ''
      };

      // Save to local registry cache ONLY if valid GPA or institute found
      if (resultData.gpa > 0 || resultData.name) {
        saveToLocalRegistry(examType, board, year, roll, reg, resultData);
      }

      return {
        success: true,
        source: 'official_live_portal',
        data: resultData
      };
    } else {
      const errorMsg = resp.msg || 'The education board could not find a matching result with these credentials.';
      return {
        success: false,
        error: errorMsg
      };
    }
  } catch (err) {
    console.error(`[Session ${sessionId}] Submission error:`, err.message);
    return {
      success: false,
      error: err.message
    };
  } finally {
    try {
      await browser.close();
    } catch (e) {}
  }
}

/**
 * Standard scrapeResult function with hybrid approach.
 */
async function scrapeResult(examType, board, year, roll, reg) {
  // Check local registry first
  const local = await findInLocalRegistry(examType, board, year, roll, reg);
  if (local) {
    return {
      success: true,
      source: 'verified_registry',
      data: local
    };
  }

  return {
    success: false,
    requiresCaptcha: true,
    error: 'Live captcha required by Bangladesh Education Board.'
  };
}

module.exports = {
  scrapeResult,
  findInLocalRegistry,
  startVerificationSession,
  reloadSessionCaptcha,
  submitCaptchaAndGetResult
};
