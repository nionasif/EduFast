const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// Helper to safely load JSON files
const loadJsonData = (filename) => {
  try {
    const filePath = path.join(__dirname, '..', 'data', filename);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]');
    }
  } catch (err) {
    console.error(`Error loading data/${filename}:`, err.message);
  }
  return [];
};

// Check if Google Gemini is configured
const isGeminiConfigured = () => {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(
    key &&
    typeof key === 'string' &&
    key.trim().length > 10 &&
    !key.includes('YOUR_GEMINI_API_KEY')
  );
};

// Check if OpenAI is configured with a valid non-placeholder key
const isOpenAiConfigured = () => {
  const key = process.env.OPENAI_API_KEY;
  return Boolean(
    key &&
    typeof key === 'string' &&
    key.trim().length > 10 &&
    !key.includes('YOUR_OPENAI_API_KEY')
  );
};

// Singleton OpenAI client
let openaiClient = null;
const getOpenAiClient = () => {
  if (!isOpenAiConfigured()) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openaiClient;
};

// Helper to sanitize AI text: cleans raw LaTeX, fractions, and repetitive robotic endings
function sanitizeAiOutput(text) {
  if (!text || typeof text !== 'string') return '';

  let cleaned = text
    // Replace raw LaTeX wrappers
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\\textbf\{([^}]+)\}/g, '$1')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
    .replace(/\$\$([^\$]+)\$\$/g, '$1')
    .replace(/\$([^\$]+)\$/g, '$1')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\approx/g, '≈')
    .replace(/\\le/g, '≤')
    .replace(/\\ge/g, '≥')
    .replace(/\\implies/g, '⇒')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\theta/g, 'θ')
    .replace(/\\pi/g, 'π');

  // Strip robotic repetitive boilerplate at the end if the model appends it
  const repetitiveClosings = [
    /\n*(?:if you need help with math|i am edufast ai always by your side|i am always by your side|always by your side)[^\n]*/gi,
    /\n*(?:পড়াশোনা,?\s*বিশ্ববিদ্যালয় ভর্তি পরীক্ষা বা যেকোনো একাডেমিক বিষয়ে সাহায্যের প্রয়োজন হলে আমাকে নির্দ্বিধায় জানাতে পারেন।?\s*আমি আপনার সহায়তায় সবসময় আছি!?[^\n]*)/gi,
    /\n*(?:আপনার পড়াশোনা বা পরীক্ষা নিয়ে কোনো প্রশ্ন থাকলে নির্দ্বিধায় আমাকে বলুন!?[^\n]*)/gi,
    /\n*(?:যেকোনো প্রয়োজনে EduFast AI সবসময় আপনার পাশে আছে।?[^\n]*)/gi,
    /\n*(?:EduFast AI সর্বদা আপনার পাশে আছে।?[^\n]*)/gi
  ];

  for (const regex of repetitiveClosings) {
    cleaned = cleaned.replace(regex, '');
  }

  return cleaned.trim();
}

// Google Gemini API caller with automatic fallback models & robust history normalization
async function generateGeminiReply(messages, systemInstruction = '') {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) return null;

  // Blazing-fast, stable Google Gemini production models in optimal order
  const candidateModels = [
    (process.env.GEMINI_MODEL || 'gemini-3.5-flash').trim(),
    'gemini-3.5-flash',
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-flash-latest'
  ];
  const uniqueModels = [...new Set(candidateModels.filter(Boolean))];

  // Extract the latest user query
  const latestUserMsg = [...messages].reverse().find(m => (m.role === 'user' || m.sender === 'user'));
  const userQuery = latestUserMsg?.content || latestUserMsg?.text || '';

  // 1. Normalize multi-turn contents for Gemini API:
  // Must start with role: 'user', and alternate strictly ('user' -> 'model' -> 'user')
  const normalizedContents = [];
  for (const m of messages) {
    const role = (m.role === 'user' || m.sender === 'user') ? 'user' : 'model';
    const text = (m.content || m.text || '').trim();
    if (!text) continue;

    // Discard leading 'model' turn (e.g. initial greeting)
    if (normalizedContents.length === 0 && role === 'model') {
      continue;
    }

    // Merge consecutive same-role turns to avoid 400 Alternating Role error
    if (normalizedContents.length > 0 && normalizedContents[normalizedContents.length - 1].role === role) {
      normalizedContents[normalizedContents.length - 1].parts[0].text += '\n\n' + text;
    } else {
      normalizedContents.push({
        role,
        parts: [{ text }]
      });
    }
  }

  // Ensure conversation ends on the user's latest query
  if (normalizedContents.length === 0 || normalizedContents[normalizedContents.length - 1].role !== 'user') {
    normalizedContents.push({
      role: 'user',
      parts: [{ text: userQuery }]
    });
  }

  const basePayload = {
    generationConfig: {
      temperature: 0.35,
      maxOutputTokens: 2048
    }
  };

  if (systemInstruction) {
    basePayload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  for (const model of uniqueModels) {
    // Attempt 1: Full normalized conversation history
    // Attempt 2: Direct single-turn prompt (if multi-turn rejected)
    const attempts = [
      { contents: normalizedContents },
      { contents: [{ role: 'user', parts: [{ text: userQuery }] }] }
    ];

    for (const attempt of attempts) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9000);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...basePayload, ...attempt })
        });
        clearTimeout(timeoutId);

        const data = await response.json();
        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          return {
            reply: sanitizeAiOutput(data.candidates[0].content.parts[0].text),
            model
          };
        }
      } catch (err) {
        // Fall through to next attempt/model
      }
    }
  }
  return null;
}

// Build comprehensive system prompt with EduFast context & Academic tutoring capability
const buildSystemPrompt = (userContext = {}) => {
  const admissions = loadJsonData('admissions.json');
  const courses = loadJsonData('courses.json');

  const admissionsSummary = admissions.map(univ => {
    const unitsStr = (univ.units || []).map(u => `${u.name} (Min GPA: ${u.minGpa || 'N/A'}, Group: ${u.group || 'All'})`).join(', ');
    return `- ${univ.name} (${univ.id || ''}): Exam Date: ${univ.examDate || 'TBA'}, Deadline: ${univ.deadline || 'TBA'}, Fee: ৳${univ.applicationFee || 0}. Units: [${unitsStr}]`;
  }).join('\n');

  const coursesSummary = courses.map(c => {
    return `- ${c.title} (By ${c.instructor}): ৳${c.discountedPrice || c.price} (Original: ৳${c.price}). Duration: ${c.duration || 'N/A'}, Group: ${c.academicGroup || 'All'}. Description: ${c.description || ''}`;
  }).join('\n');

  const userInfo = userContext?.name 
    ? `Student Info: Name: ${userContext.name}, Group: ${userContext.group || 'Science'}, SSC GPA: ${userContext.ssc?.gpa || 'N/A'}, HSC GPA: ${userContext.hsc?.gpa || 'N/A'}`
    : 'User is currently browsing as a guest (not logged in yet).';

  return `You are "EduFast AI" (এডুফাস্ট এআই), the expert academic tutor, problem solver, and admission advisor for EduFast (https://edufast.com) in Bangladesh.

### CRITICAL RULES FOR HIGH INTELLIGENCE, ACCURACY & STUDENT UNDERSTANDING:
1. **শিক্ষার্থীর মনের ভাব ও কথ্য বাংলা বোঝা (Colloquial & Typo Tolerance)**:
   - শিক্ষার্থীরা প্রায়ই দ্রুত টাইপ করার সময় অনানুষ্ঠানিক বাংলায়, টাইপো বা বানান ভুল করে প্রশ্ন করে।
   - যেমন:
     * "ডালে" বা "ডাল" বললে বুঝতে হবে "ঢালে" বা "ঢালু রাস্তা (inclined plane/slope)"।
     * "পাওয়া" বা "পাওয়ার" বললে বুঝতে হবে "ক্ষমতা বা পাওয়ার (Power / Watt / HP)"।
     * "উচু" = "উঁচু (height)", "বেগ ১৫ কিমি" = "বেগ ১৫ কিমি/ঘণ্টা (15 km/h)", "বল" = "Force", "ত্বরণ" = "Acceleration"।
   - একজন অভিজ্ঞ ও আন্তরিক প্রাইভেট টিউটরের মতো তাদের মনের ভাব ও গাণিতিক প্রশ্নটি অবিলম্বে বুঝে নিয়ে ১০০% সঠিক সমাধান দিতে হবে। কখনো বানান নিয়ে প্রশ্ন তুলবেন না বা বলবেন না যে বুঝতে পারেননি।

2. **নিখুঁত অ্যাকাডেমিক সমাধান পদ্ধতি (Physics, Chemistry, Math, Biology, ICT)**:
   - যখনই কোনো গাণিতিক বা বিজ্ঞানের অঙ্ক আসবে:
     * **১. প্রদত্ত তথ্যসমূহ (Given Data):** প্রশ্নে দেওয়া তথ্যগুলো একক রূপান্তর সহ পরিষ্কারভাবে তুলে ধরুন (যেমন: গাড়ির ভর m = ৫০০ কেজি, বেগ v = ১৫ কিমি/ঘণ্টা = ৪.১৬৭ মি/সে, কোণ θ = ৩০°)।
     * **২. প্রয়োজনীয় সূত্র ও ধাপসমূহ (Step-by-Step):** কোন সূত্র ব্যবহার হচ্ছে (যেমন: অভিকর্ষের বিপরীতে বল F = mg sin θ, ক্ষমতা P = F × v) তা স্পষ্ট করে মান বসিয়ে সঠিক ফলাফল বের করুন।
     * **৩. চূড়ান্ত উত্তর (Final Answer):** পরিষ্কার বোল্ড আকারে মূল উত্তর দিন। বিকল্প একক থাকলে তাও উল্লেখ করুন (যেমন: ওয়াট ও হর্সপাওয়ার HP)।

3. **সরাসরি ও টু-দ্য-পয়েন্ট উত্তর (Direct & Focused)**:
   - যে প্রশ্ন করা হয়েছে, ঠিক সেই প্রশ্নের সরাসরি ও স্পষ্ট সমাধান দিন। কোনো অপ্রয়োজনীয় লম্বা ভূমিকা ছাড়া সরাসরি মূল উত্তরে প্রবেশ করুন।
   - **উত্তরের শেষে কখনোই কোনো রোবোটিক ক্লোজিং বা চর্বিতচর্বণ ডায়লগ যোগ করবেন না** (যেমন: "I am EduFast AI always by your side", "যেকোনো প্রয়োজনে পাশে আছি", "যদি আপনার আরো সাহায্যের প্রয়োজন হয়..." ইত্যাদি বাক্য পরিহার করুন)। উত্তর সম্পূর্ণ হলে সেখানেই থামুন।

4. **কাঁচা ল্যাটেক্স কোড সম্পূর্ণ বর্জন (NO Raw LaTeX)**:
   - কখনোই \`$ ... $\`, \`$$ ... $$\`, \`\\mathbf{...}\`, \`\\frac{...}{...}\`, \`\\text{...}\` কোড লিখবেন না।
   - ফ্রন্টএন্ডে যাতে কোনো কোড টোকেন ভেসে না ওঠে, তাই সাধারণ মানুষের পাঠযোগ্য সুন্দর প্রতীক ব্যবহার করুন (যেমন: \`৪\`, \`x²\`, \`a / b\`, \`H = (u² sin² α) / 2g\`, \`P = F × v\`)।

5. **ভাষা ও অ্যাকাডেমিক মান (Language & Demeanor)**:
   - সহজ, সুন্দর, আন্তরিক ও প্রমিত বাংলা ভাষায় উত্তর দিন।
   - ব্যবহারকারী ইংরেজিতে প্রশ্ন করলে প্রফেশনাল ইংরেজিতে উত্তর দিন।

### REAL-TIME PLATFORM DATA:
#### Active University Circulars & Deadlines:
${admissionsSummary || 'Circular data loading...'}

#### Top Active Courses:
${coursesSummary || 'Courses data loading...'}

#### Current User Context:
${userInfo}`;
};

// GET /api/ai/status - Check if AI is active and configured
router.get('/api/ai/status', (req, res) => {
  const geminiActive = isGeminiConfigured();
  const openAiActive = isOpenAiConfigured();
  const configured = geminiActive || openAiActive;

  let provider = 'EduFast AI Engine';
  let model = 'edufast-ai';

  if (geminiActive) {
    provider = 'Google Gemini (Free)';
    model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
  } else if (openAiActive) {
    provider = 'OpenAI';
    model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  res.json({
    success: true,
    configured,
    provider,
    model,
    geminiActive,
    openAiActive
  });
});

// POST /api/ai/set-key - Set or update Gemini or OpenAI API Key dynamically
router.post('/api/ai/set-key', async (req, res) => {
  try {
    const { apiKey, model, provider: chosenProvider } = req.body;

    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return res.status(400).json({
        success: false,
        error: 'অনুগ্রহ করে একটি সঠিক API Key প্রদান করুন।'
      });
    }

    const cleanKey = apiKey.trim();
    const isGeminiKey = cleanKey.startsWith('AQ.') || cleanKey.startsWith('AIza') || chosenProvider === 'gemini';

    if (isGeminiKey) {
      const cleanModel = (model && model.trim()) || 'gemini-3-flash-preview';
      process.env.GEMINI_API_KEY = cleanKey;
      process.env.GEMINI_MODEL = cleanModel;

      try {
        const envPath = path.join(__dirname, '..', '.env');
        let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
        if (envContent.includes('GEMINI_API_KEY=')) {
          envContent = envContent.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${cleanKey}`);
        } else {
          envContent += `\nGEMINI_API_KEY=${cleanKey}`;
        }
        if (envContent.includes('GEMINI_MODEL=')) {
          envContent = envContent.replace(/GEMINI_MODEL=.*/g, `GEMINI_MODEL=${cleanModel}`);
        } else {
          envContent += `\nGEMINI_MODEL=${cleanModel}`;
        }
        fs.writeFileSync(envPath, envContent, 'utf8');
      } catch (e) {
        console.warn('Could not save GEMINI_API_KEY to .env:', e.message);
      }

      return res.json({
        success: true,
        message: '🎉 Google Gemini Free API Key সফলভাবে যুক্ত হয়েছে! এখন EduFast AI সক্রিয়।',
        provider: 'Google Gemini (Free)',
        model: cleanModel
      });
    }

    const cleanModel = (model && model.trim()) || 'gpt-4o-mini';
    process.env.OPENAI_API_KEY = cleanKey;
    process.env.OPENAI_MODEL = cleanModel;
    openaiClient = new OpenAI({ apiKey: cleanKey });

    try {
      const envPath = path.join(__dirname, '..', '.env');
      let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
      if (envContent.includes('OPENAI_API_KEY=')) {
        envContent = envContent.replace(/OPENAI_API_KEY=.*/g, `OPENAI_API_KEY=${cleanKey}`);
      } else {
        envContent += `\nOPENAI_API_KEY=${cleanKey}`;
      }
      if (envContent.includes('OPENAI_MODEL=')) {
        envContent = envContent.replace(/OPENAI_MODEL=.*/g, `OPENAI_MODEL=${cleanModel}`);
      } else {
        envContent += `\nOPENAI_MODEL=${cleanModel}`;
      }
      fs.writeFileSync(envPath, envContent, 'utf8');
    } catch (e) {
      console.warn('Could not save OPENAI_API_KEY to .env:', e.message);
    }

    return res.json({
      success: true,
      message: '🎉 OpenAI API Key সফলভাবে যুক্ত হয়েছে! এখন EduFast AI সক্রিয়।',
      provider: 'OpenAI',
      model: cleanModel
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Server error setting API key'
    });
  }
});

// Comprehensive Built-in EduFast Academic & Platform Engine
function generateEduFastSmartAnswer(query, userContext = {}) {
  const q = query.trim().toLowerCase();
  const admissions = loadJsonData('admissions.json');
  const courses = loadJsonData('courses.json');

  const toBengaliNumber = (num) => {
    const bengaliDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
    return String(num).replace(/[0-9]/g, d => bengaliDigits[d]);
  };

  // 0. Smart Arithmetic & Math Evaluator
  const cleanExpr = query.trim().replace(/=$/, '').trim();
  if (/^[0-9\s\+\-\*\/\(\)\.\%]+$/.test(cleanExpr) && /[\+\-\*\/]/.test(cleanExpr)) {
    try {
      const sanitized = cleanExpr.replace(/[^0-9\+\-\*\/\(\)\.]/g, '');
      const calcResult = Function(`'use strict'; return (${sanitized})`)();
      if (typeof calcResult === 'number' && !isNaN(calcResult) && isFinite(calcResult)) {
        const rounded = Number.isInteger(calcResult) ? calcResult : Number(calcResult.toFixed(4));
        const formattedDisplay = cleanExpr
          .replace(/\*/g, ' × ')
          .replace(/\//g, ' ÷ ')
          .replace(/\+/g, ' + ')
          .replace(/\-/g, ' - ')
          .replace(/\s+/g, ' ');

        return `🎯 **উত্তর:** **${toBengaliNumber(rounded)}** (${rounded})\n\n📋 **সমাধানের ধাপ:**\n• প্রদত্ত রাশি: ${toBengaliNumber(formattedDisplay)}\n• হিসাবের ফলাফল: **${toBengaliNumber(rounded)}**`;
      }
    } catch {
      // Pass through
    }
  }

  // 1. Casual Chat & Greetings
  if (
    q.includes('কি করছ') || q.includes('কী করছ') || q.includes('কি করতেছ') ||
    q.includes('কি কর') || q.includes('কী কর') || q.includes('what are you doing')
  ) {
    return `👋 **হ্যালো! আমি EduFast AI Assistant!**\n\nআমি শিক্ষার্থী বন্ধুদের পড়াশোনা, জটিল বিষয়ের সমাধান এবং বিশ্ববিদ্যালয় ভর্তি প্রস্তুতির প্রশ্নের উত্তর দিতে প্রস্তুত। 📚✨\n\n**আমি যেভাবে সাহায্য করতে পারি:**\n1. 🏛️ **এডমিশন গাইডেন্স:** বুয়েট, ঢাবি, মেডিকেল, গুচ্ছ সহ সকল বিশ্ববিদ্যালয়ের যোগ্যতা ও সার্কুলার।\n2. 📐 **পড়াশোনা সমাধান:** পদার্থবিজ্ঞান, রসায়ন, গণিত, জীববিজ্ঞান ও ইংরেজির নির্ভুল সমাধান।\n3. 🎯 **EduFast প্ল্যাটফর্ম:** কোর্স এনরোলমেন্ট, লাইভ ক্লাস, প্রশ্ন ব্যাংক ও মক টেস্টের তথ্য।`;
  }

  if (
    q.includes('কেমন আছ') || q.includes('how are you') || q.includes('ভাল আছ') || q.includes('ভালো আছ')
  ) {
    return `আলহামদুলিল্লাহ, আমি খুব ভালো আছি! 😊 আশা করি আপনার পড়াশোনাও খুব সুন্দরভাবে এগিয়ে চলছে। আজ আপনাকে পড়াশোনা বা বিশ্ববিদ্যালয় ভর্তি নিয়ে কীভাবে সাহায্য করতে পারি?`;
  }

  if (
    q.includes('তুমি কে') || q.includes('কে তুমি') || q.includes('who are you') || q.includes('your name')
  ) {
    return `আমি **EduFast AI**—EduFast প্ল্যাটফর্মের সার্বক্ষণিক ডিজিটাল স্টাডি অ্যাসিস্ট্যান্ট ও একাডেমিক গাইড! 🎓\n\nআমার কাজ হলো আপনার পড়াশোনা সহজ করা, যেকোনো বিষয়ের কনসেপ্ট ক্লিয়ার করা, বিশ্ববিদ্যালয় ভর্তির যোগ্যতা যাচাই ও EduFast-এর কোর্স ও লাইভ ক্লাসে সাহায্য করা।`;
  }

  if (q.includes('ধন্যবাদ') || q.includes('thanks') || q.includes('thank you')) {
    return `আপনাকে অসংখ্য ধন্যবাদ! 😊 শুভকামনা আপনার পড়াশোনার জন্য! 🌟`;
  }

  // 2. University Eligibility & Circulars
  const matchedUniv = admissions.find(u => 
    q.includes(u.name.toLowerCase()) || 
    (u.id && q.includes(u.id.toLowerCase()))
  );

  if (matchedUniv) {
    const unitsInfo = (matchedUniv.units || []).map(u => 
      `• **${u.name}**: ন্যূনতম জিপিএ **${u.minGpa || 'শর্ত প্রযোজ্য'}** (${u.group || 'সকল গ্রুপ'})`
    ).join('\n');

    let gpaCheckStr = '';
    if (userContext?.ssc?.gpa && userContext?.hsc?.gpa) {
      const sscG = Number(userContext.ssc.gpa);
      const hscG = Number(userContext.hsc.gpa);
      const total = sscG + hscG;
      const grp = userContext.group || 'Science';
      const eligible = (matchedUniv.units || []).filter(u => (!u.group || u.group === grp) && total >= (u.minGpa || 0));
      gpaCheckStr = `\n\n📊 **আপনার প্রোফাইল অনুযায়ী যোগ্যতা (${userContext.name || 'শিক্ষার্থী'}):**\n- মোট জিপিএ: **${total.toFixed(2)}** (গ্রুপ: ${grp})\n- আবেদনযোগ্য ইউনিট: **${eligible.length > 0 ? eligible.map(u => u.name).join(', ') : 'বর্তমান জিপিএতে শর্ত পূরণ হয়নি'}**`;
    }

    return `🏛️ **${matchedUniv.name} (${matchedUniv.id || 'Admission'}) ভর্তি নির্দেশিকা:**\n\n📅 **গুরুত্বপূর্ণ তারিখসমূহ:**\n- 📝 আবেদন শেষ সময়: **${matchedUniv.deadline || 'শীঘ্রই ঘোষণা করা হবে'}**\n- 🎯 ভর্তি পরীক্ষার তারিখ: **${matchedUniv.examDate || 'শীঘ্রই ঘোষণা করা হবে'}**\n- 💳 আবেদন ফি: **৳${matchedUniv.applicationFee || '০'}**\n\n📋 **ইউনিট ও ন্যূনতম জিপিএ শর্তাবলী:**\n${unitsInfo}${gpaCheckStr}`;
  }

  // General BUET lookup
  if (q.includes('buet') || q.includes('বুয়েট') || q.includes('ইঞ্জিনিয়ারিং')) {
    return `🏛️ **বুয়েট (BUET) ভর্তি পরীক্ষার মূল যোগ্যতা ও নির্দেশিকা:**\n\n1. **শিক্ষাগত যোগ্যতা:**\n   - প্রার্থীকে অবশ্যই বিজ্ঞান বিভাগ থেকে এসএসসি ও এইচএসসি উভয় পরীক্ষায় উত্তীর্ণ হতে হবে।\n   - এসএসসি ও এইচএসসি উভয়েই **ন্যূনতম জিপিএ ৫.০০** থাকতে হয়।\n   - এইচএসসি পরীক্ষায় পদার্থবিজ্ঞান, রসায়ন ও উচ্চতর গণিত—এই তিন বিষয়ে মোট নির্ধারিত গ্রেড পয়েন্ট (সাধারণত প্রতিটিতে A+ বা মোট নম্বর ৪০০+ এর মধ্যে ৩৭৫+) থাকা আবশ্যক।\n2. **পরীক্ষা পদ্ধতি:**\n   - **ধাপ ১ (প্রিলিমিনারি):** ১০০ নম্বরের বহুনির্বাচনী (MCQ) পরীক্ষা (পদার্থ, রসায়ন ও গণিত)।\n   - **ধাপ ২ (চূড়ান্ত লিখিত পরীক্ষা):** প্রিলিমিনারিতে উত্তীর্ণ শীর্ষ প্রার্থীদের নিয়ে ৪০০ নম্বরের বর্ণনামূলক লিখিত পরীক্ষা।\n3. **আসন সংখ্যা:** প্রকৌশল ও নগর পরিকল্পনা অনুষদে প্রায় ১,৩০০+ আসন।`;
  }

  // General DU lookup
  if (q.includes('du') || q.includes('ঢাবি') || q.includes('ঢাকা বিশ্ববিদ্যালয়') || q.includes('varsity')) {
    return `🏛️ **ঢাকা বিশ্ববিদ্যালয় (DU) ভর্তি পরীক্ষার যোগ্যতা ও ইউনিটসমূহ:**\n\n1. **ক ইউনিট (বিজ্ঞান অনুষদ):**\n   - এসএসসি ও এইচএসসি বিজ্ঞান বিভাগ। চতুর্থ বিষয়সহ মোট জিপিএ ন্যূনতম **৮.০০** (উভয় পরীক্ষায় আলাদাভাবে ৩.৫ থাকতে হয়)।\n2. **খ ইউনিট (কলা, আইন ও সামাজিক বিজ্ঞান অনুষদ):**\n   - মানবিক শাখার জন্য ন্যূনতম জিপিএ **৭.৫** (উভয়ে আলাদাভাবে ৩.০)।\n3. **গ ইউনিট (ব্যবসায় শিক্ষা অনুষদ):**\n   - ব্যবসায় শিক্ষা শাখা থেকে মোট জিপিএ ন্যূনতম **৭.৫** আবশ্যক।\n4. **পরীক্ষার মানবণ্টন:**\n   - ৬০ নম্বরের MCQ + ৪০ নম্বরের লিখিত পরীক্ষা + ২০ নম্বর জিপিএ মূল্যায়ন (মোট ১২০ নম্বর)।`;
  }

  // Medical lookup
  if (q.includes('medical') || q.includes('মেডিকেল') || q.includes('dmc') || q.includes('ডাক্তার')) {
    return `🩺 **মেডিকেল (MBBS/BDS) ভর্তি পরীক্ষার যোগ্যতা:**\n\n1. **জিপিএ শর্ত:**\n   - এসএসসি ও এইচএসসি মিলিয়ে মোট জিপিএ ন্যূনতম **৯.০০** হতে হবে।\n   - কোনো একক পরীক্ষায় জিপিএ ৪.০০ এর নিচে থাকা যাবে না।\n   - এইচএসসিতে জীববিজ্ঞানে ন্যূনতম গ্রেড পয়েন্ট **৪.০০ (A)** থাকতে হবে।\n2. **ভর্তি পরীক্ষার মানবণ্টন (১০০ নম্বর MCQ):**\n   - জীববিজ্ঞান: ৩০ | রসায়ন: ২৫ | পদার্থবিজ্ঞান: ২০ | ইংরেজি: ১৫ | সাধারণ জ্ঞান: ১০\n   - প্রতিটি ভুল উত্তরের জন্য ০.২৫ নম্বর কাটা যাবে (নেগেটিভ মার্কিং)।\n3. **একাডেমিক স্কোর:** এসএসসি জিপিএ × ১৫ = ৭৫, এইচএসসি জিপিএ × ২৫ = ১২৫ (মোট ২০০ নম্বর)।`;
  }

  // 3. Courses queries
  if (q.includes('course') || q.includes('কোর্স') || q.includes('class') || q.includes('ক্লাস')) {
    const courseList = courses.slice(0, 4).map(c => 
      `• **${c.title}** (ইন্সট্রাক্টর: ${c.instructor}) - ফি: ৳${c.discountedPrice || c.price} (মূল ফি: ৳${c.price})`
    ).join('\n');
    return `📚 **EduFast-এর শীর্ষ কোর্সসমূহ:**\n\n${courseList}\n\n✨ **কোর্স সুবিধাসমূহ:**\n- লাইভ ইন্টারঅ্যাক্টিভ ক্লাস ও রেকর্ডেড ব্যাকআপ\n- চ্যাপ্টারভিত্তিক প্রশ্ন ব্যাংক ও ডেইলি মক টেস্ট\n- ২৪/৭ বুয়েট ও মেডিকেল মেন্টরদের ডাউট সলভ প্যানেল`;
  }

  // 4. Platform Features (EduCoins, Mock Test, Live Class)
  if (q.includes('coin') || q.includes('কয়েন') || q.includes('educoin')) {
    return `🪙 **EduCoins কি এবং কীভাবে কাজ করে?**\n\nEduCoins হলো EduFast-এর শিক্ষার্থী রিওয়ার্ড সিস্টেম!\n- 📝 প্রতিটি মক টেস্ট সম্পন্ন করলে কয়েন পাওয়া যায়।\n- 🏆 কুইজে সঠিক উত্তরের ভিত্তিতে বোনাস কয়েন যোগ হয়।\n- 🎁 অর্জিত কয়েন দিয়ে পেইড কোর্স ডিসকাউন্ট ও প্রিমিয়াম প্র্যাকটিস সেট আনলক করা যায়!`;
  }

  if (q.includes('mock') || q.includes('মক') || q.includes('টেস্ট') || q.includes('test') || q.includes('exam')) {
    return `📝 **EduFast Mock Test & Question Bank সিস্টেম:**\n\n- **টাইমড এক্সাম:** ভর্তি পরীক্ষার হুবহু টাইমার ও নেগেটিভ মার্কিং সহ রিয়েল-টাইম টেস্ট।\n- **ইনস্ট্যান্ট অ্যানালাইসিস:** সাবমিটের সাথে সাথে সঠিক উত্তর, বিস্তারিত ব্যাখ্যা ও পারফরম্যান্স বিশ্লেষণ।\n- **লিডারবোর্ড:** সারাদেশে সহপাঠীদের সাথে নিজের পজিশন দেখার সুবিধা।`;
  }

  // 5. Academic Subjects (Physics, Math, Chemistry)
  if (q.includes('গতিবিদ্যা') || q.includes('প্রাস') || q.includes('projectile') || q.includes('motion')) {
    return `🚀 **গতিবিদ্যা ও প্রাসের মূল সূত্রসমূহ:**\n\n1. **প্রাসের গতি সমীকরণ:**\n   - সর্বোচ্চ উচ্চতা: H = (u² sin² α) / (2g)\n   - বিচরণ কাল: T = (2u sin α) / g\n   - আনুভূমিক পাল্লা: R = (u² sin 2α) / g\n   - সর্বোচ্চ পাল্লা (α = 45°): R_max = u² / g\n2. **শর্টকাট হ্যাক:**\n   - পাল্লা R সর্বোচ্চ উচ্চতা H এর ৪ গুণ হলে (R = 4H), নিক্ষেপণ কোণ α = 45°।`;
  }

  if (q.includes('ক্যালকুলাস') || q.includes('integration') || q.includes('ইন্টিগ্রেশন') || q.includes('অন্তরীকরণ') || q.includes('differentiation')) {
    return `📐 **উচ্চতর গণিত: ক্যালকুলাস ও ইন্টিগ্রেশন শর্টকাট:**\n\n1. **প্রয়োজনীয় সূত্রাবলী:**\n   - ∫ eˣ [f(x) + f'(x)] dx = eˣ f(x) + C\n   - ∫ [f'(x) / f(x)] dx = ln |f(x)| + C\n   - ∫ [f'(x) / √f(x)] dx = 2√f(x) + C\n2. **এডমিশন হ্যাক:**\n   - ∫(0 to π/2) [sinⁿ(x) / (sinⁿ(x) + cosⁿ(x))] dx = π/4 (যেকোনো ঘাত n এর জন্য উত্তর সর্বদা π/4)।\n   - lim(x → 0) [sin(ax) / sin(bx)] = a / b।`;
  }

  if (q.includes('জারণ') || q.includes('oxidation') || q.includes('বাফার') || q.includes('buffer') || q.includes('ph')) {
    return `🧪 **রসায়ন: গুরুত্বপূর্ণ সূত্র ও কনসেপ্ট:**\n\n1. **বাফার দ্রবণের pH (হেন্ডারসন-হ্যাসেলবাল্ক সমীকরণ):**\n   - অম্লীয় বাফার: pH = pKa + log([Salt] / [Acid])\n   - ক্ষারীয় বাফার: pOH = pKb + log([Salt] / [Base])\n2. **জারণ সংখ্যা নির্ণয়:**\n   - KMnO₄ এ Mn: +1 + x + 4(-2) = 0 ⇒ x = +7\n   - K₂Cr₂O₇ এ Cr: 2(+1) + 2x + 7(-2) = 0 ⇒ 2x = 12 ⇒ x = +6।`;
  }

  // Default fallback response
  return `💡 **EduFast AI উত্তর:**\n\nআপনার প্রশ্নটি পেয়েছি: *"**${query.trim()}**"*\n\nআমি আপনার যেকোনো অ্যাকাডেমিক সমস্যা (গণিত, পদার্থ, রসায়ন, জীববিজ্ঞান) বা ভর্তি পরীক্ষা ও সার্কুলার সম্পর্কিত প্রশ্নের সুনির্দিষ্ট সমাধান দিতে প্রস্তুত। নির্দিষ্ট কোনো অঙ্ক বা অধ্যায় নিয়ে জানতে প্রশ্নটি লিখে পাঠান!`;
}

// POST /api/ai/chat - Main chat completion endpoint
router.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history = [], userContext = {} } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required.'
      });
    }

    const systemPrompt = buildSystemPrompt(userContext);

    // Format chat history for OpenAI (keep last 6 messages)
    const formattedHistory = (Array.isArray(history) ? history.slice(-6) : []).map(h => ({
      role: h.sender === 'user' || h.role === 'user' ? 'user' : 'assistant',
      content: h.text || h.content || ''
    })).filter(h => h.content.trim().length > 0);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory,
      { role: 'user', content: message.trim() }
    ];

    let reply = null;
    let source = 'edufast-ai';
    let modelName = 'edufast-ai';

    // 1. First priority: Google Gemini Free API (Ultra-capable and free)
    if (isGeminiConfigured()) {
      try {
        const geminiResult = await generateGeminiReply(
          [...formattedHistory, { role: 'user', content: message.trim() }],
          systemPrompt
        );
        if (geminiResult?.reply) {
          reply = geminiResult.reply;
          source = 'gemini';
          modelName = geminiResult.model;
        }
      } catch (geminiError) {
        console.warn('Gemini chat notice (' + (geminiError?.message || '') + ')');
      }
    }

    // 2. Second priority: OpenAI (if Gemini not active or had an issue)
    if (!reply && isOpenAiConfigured()) {
      const client = getOpenAiClient();
      if (client) {
        try {
          const completion = await client.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages,
            temperature: 0.7,
            max_tokens: 1000
          });
          const rawOpenAiReply = completion.choices?.[0]?.message?.content?.trim();
          if (rawOpenAiReply) {
            reply = sanitizeAiOutput(rawOpenAiReply);
            source = 'openai';
            modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
          }
        } catch (openAiError) {
          console.warn('OpenAI API Notice (' + (openAiError?.message || '') + ') - Engaging EduFast Live AI engine...');
        }
      }
    }

    // 3. Fallback: EduFast Smart Academic & Platform Engine
    if (!reply) {
      reply = sanitizeAiOutput(generateEduFastSmartAnswer(message, userContext));
      source = 'edufast-ai';
      modelName = 'edufast-smart';
    }

    return res.json({
      success: true,
      configured: true,
      reply,
      source,
      model: modelName
    });

  } catch (error) {
    console.error('AI Chat Error:', error?.message || error);
    const fallbackReply = generateEduFastSmartAnswer(req.body?.message || '', req.body?.userContext || {});
    return res.json({
      success: true,
      configured: true,
      reply: fallbackReply,
      source: 'edufast-ai',
      model: 'edufast-smart'
    });
  }
});

module.exports = router;
