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

// Google Gemini API caller with automatic fallback models
async function generateGeminiReply(messages, systemInstruction = '') {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) return null;

  const candidateModels = [
    (process.env.GEMINI_MODEL || 'gemini-3-flash-preview').trim(),
    'gemini-3-flash-preview',
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest'
  ];

  // Prepare Gemini contents (role: 'user' | 'model')
  const contents = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content || '' }]
  }));

  const payload = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1200
    }
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  for (const model of candidateModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return {
          reply: data.candidates[0].content.parts[0].text.trim(),
          model
        };
      }
    } catch (err) {
      console.warn(`Gemini [${model}] notice:`, err.message);
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

  return `You are "EduFast AI" (এডুফাস্ট এআই অ্যাডভাইজর ও একাডেমি টিউটর), the premier educational AI assistant of EduFast (https://edufast.com) in Bangladesh.

### YOUR ROLES & OBJECTIVES:
1. **Friendly Conversational & Helpful Companion**:
   - Greet warmly and naturally when user says hello, "কি করছো", "কেমন আছো", etc.
   - Reply in natural, friendly, polite Bengali.
   - Introduce yourself as EduFast AI Assistant ready to help with studies, university admissions, and website guidance.

2. **EduFast Platform Expert**:
   - Answer any question about EduFast features, courses, admission circulars, university eligibility, GPA calculations, mock tests, question bank, and live classes.
   - Guide students on how to use EduFast:
     * **University Eligibility Check**: Matches SSC & HSC GPA with top universities (BUET, DU, Medical, GST/Cluster, RU, CU, JU, etc.).
     * **Mock Tests & Question Bank**: Students can practice chapter-wise MCQs, timed mock tests with negative marking, and view instant performance analytics.
     * **Live Classes & Interactive Classroom**: Real-time classes with top instructors, audio/video interaction, live polls, and interactive whiteboard.
     * **24/7 Live Mentor Squad**: Round-the-clock doubt solving panel from BUET, DMC, and DU.
     * **EduCoins Reward System**: Earn coins by taking tests and participating; coins can be used for platform perks.
     * **GPA Calculator**: Real-time calculation of combined SSC & HSC GPA for admission unit requirements.

3. **Master Academic Tutor (পড়াশোনা ও এডমিশন সলভার)**:
   - Answer ANY study/academic question across Science, Arts, and Commerce for SSC, HSC, and University Admission test levels.
   - Subjects covered: Physics (পদার্থবিজ্ঞান), Chemistry (রসায়ন), Higher Mathematics (উচ্চতর গণিত), Biology (জীববিজ্ঞান), English, ICT, and General Knowledge (সাধারণ জ্ঞান).
   - When solving academic questions:
     * Give accurate, step-by-step explanations with relevant formulas and derivations.
     * Provide problem-solving shortcuts and admission exam hacks.
     * Highlight common pitfalls where students lose marks.

### REAL-TIME PLATFORM DATA:
#### Active University Circulars & Deadlines:
${admissionsSummary || 'Circular data loading...'}

#### Top Active Courses:
${coursesSummary || 'Courses data loading...'}

#### Current User Context:
${userInfo}

### TONE & LANGUAGE GUIDELINES:
- **Tone**: Friendly, respectful, polite, encouraging, and academically authoritative.
- **Language**: Respond primarily in natural, clear Bengali (incorporating standard English terms like "Integration", "Projectile Motion", "Titration", "Buffer Solution"). If the user asks in English, reply in English.
- **Formatting**: Use Markdown formatting (bolding key terms, numbered steps, bullet points) to make answers clean and easy to read.`;
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

  // 1. Casual Chat & Greetings
  if (
    q.includes('কি করছ') || q.includes('কী করছ') || q.includes('কি করতেছ') ||
    q.includes('কি কর') || q.includes('কী কর') || q.includes('what are you doing')
  ) {
    return `👋 **হ্যালো! আমি EduFast AI Assistant!**\n\nআমি এই মুহূর্তে শিক্ষার্থী বন্ধুদের পড়াশোনা, জটিল বিষয়ের সমাধান এবং বিশ্ববিদ্যালয় ভর্তি প্রস্তুতির প্রশ্নের উত্তর দিতে প্রস্তুত হয়ে বসে আছি! 📚✨\n\n**আমি যেভাবে আপনাকে সাহায্য করতে পারি:**\n1. 🏛️ **এডমিশন গাইডেন্স:** বুয়েট, ঢাবি, মেডিকেল, গুচ্ছ সহ সকল বিশ্ববিদ্যালয়ের সার্কুলার ও জিপিএ যোগ্যতা যাচাই।\n2. 📐 **পড়াশোনা ও ডাউট সলভ:** পদার্থবিজ্ঞান, রসায়ন, গণিত, জীববিজ্ঞান ও ইংরেজির যেকোনো জটিল সূত্র বা অঙ্ক সমাধান।\n3. 🎯 **EduFast প্ল্যাটফর্ম:** কোর্স এনরোলমেন্ট, লাইভ ক্লাস, প্রশ্ন ব্যাংক ও মক টেস্টের তথ্য।\n\nআপনার পড়াশোনা বা পরীক্ষা নিয়ে কোনো প্রশ্ন থাকলে নির্দ্বিধায় আমাকে বলুন!`;
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
    return `আপনাকে অসংখ্য ধন্যবাদ! 😊 আপনার যেকোনো প্রয়োজনে EduFast AI সবসময় আপনার পাশে আছে। শুভকামনা আপনার পড়াশোনার জন্য! 🌟`;
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

    return `🏛️ **${matchedUniv.name} (${matchedUniv.id || 'Admission'}) ভর্তি নির্দেশিকা:**\n\n📅 **গুরুত্বপূর্ণ তারিখসমূহ:**\n- 📝 আবেদন শেষ সময়: **${matchedUniv.deadline || 'শীঘ্রই ঘোষণা করা হবে'}**\n- 🎯 ভর্তি পরীক্ষার তারিখ: **${matchedUniv.examDate || 'শীঘ্রই ঘোষণা করা হবে'}**\n- 💳 আবেদন ফি: **৳${matchedUniv.applicationFee || '০'}**\n\n📋 **ইউনিট ও ন্যূনতম জিপিএ শর্তাবলী:**\n${unitsInfo}${gpaCheckStr}\n\n💡 *বিস্তারিত সার্কুলার দেখতে আমাদের Circulars মেন্যু ভিজিট করুন।*`;
  }

  // General BUET lookup
  if (q.includes('buet') || q.includes('বুয়েট') || q.includes('ইঞ্জিনিয়ারিং')) {
    return `🏛️ **বুয়েট (BUET) ভর্তি পরীক্ষার মূল যোগ্যতা ও নির্দেশিকা:**\n\n1. **শিক্ষাগত যোগ্যতা:**\n   - প্রার্থীকে অবশ্যই বিজ্ঞান বিভাগ থেকে এসএসসি ও এইচএসসি উভয় পরীক্ষায় উত্তীর্ণ হতে হবে।\n   - এসএসসি ও এইচএসসি উভয়েই **ন্যূনতম জিপিএ ৫.০০** থাকতে হয়।\n   - এইচএসসি পরীক্ষায় পদার্থবিজ্ঞান, রসায়ন ও উচ্চতর গণিত—এই তিন বিষয়ে মোট নির্ধারিত গ্রেড পয়েন্ট (সাধারণত প্রতিটিতে A+ বা মোট নম্বর ৪০০+ এর মধ্যে ৩৭৫+) থাকা আবশ্যক।\n2. **পরীক্ষা পদ্ধতি:**\n   - **ধাপ ১ (প্রাক-নির্বাচনী / প্রিলিমিনারি):** ১০০ নম্বরের বহুনির্বাচনী (MCQ) পরীক্ষা (পদার্থ, রসায়ন ও গণিত)।\n   - **ধাপ ২ (চূড়ান্ত লিখিত পরীক্ষা):** প্রিলিমিনারিতে উত্তীর্ণ শীর্ষ প্রার্থীদের নিয়ে ৪০০ নম্বরের বর্ণনামূলক লিখিত পরীক্ষা অনুষ্ঠিত হয়।\n3. **আসন সংখ্যা:** প্রকৌশল ও নগর পরিকল্পনা অনুষদে প্রায় ১,৩০০+ আসন।\n\n💡 *EduFast-এ রয়েছে বুয়েটের টপ ইঞ্জিনিয়ারদের দ্বারা পরিচালিত **Engineering Admission Masterclass** ও আনলিমিটেড মক টেস্ট!*`;
  }

  // General DU lookup
  if (q.includes('du') || q.includes('ঢাবি') || q.includes('ঢাকা বিশ্ববিদ্যালয়') || q.includes('varsity')) {
    return `🏛️ **ঢাকা বিশ্ববিদ্যালয় (DU) ভর্তি পরীক্ষার যোগ্যতা ও ইউনিটসমূহ:**\n\n1. **ক ইউনিট (বিজ্ঞান অনুষদ):**\n   - এসএসসি ও এইচএসসি বিজ্ঞান বিভাগ। চতুর্থ বিষয়সহ মোট জিপিএ ন্যূনতম **৮.০০** (উভয় পরীক্ষায় আলাদাভাবে ৩.৫ থাকতে হয়)।\n2. **খ ইউনিট (কলা, আইন ও সামাজিক বিজ্ঞান অনুষদ):**\n   - মানবিক, বিজ্ঞান ও ব্যবসায় শিক্ষা সকল বিভাগের শিক্ষার্থীরা আবেদন করতে পারে। মানবিক শাখার জন্য ন্যূনতম জিপিএ **৭.৫**।\n3. **গ ইউনিট (ব্যবসায় শিক্ষা অনুষদ):**\n   - ব্যবসায় শিক্ষা শাখা থেকে মোট জিপিএ ন্যূনতম **৭.৫** আবশ্যক।\n4. **পরীক্ষার মানবণ্টন:**\n   - ৬০ নম্বরের MCQ + ৪০ নম্বরের লিখিত পরীক্ষা + ২০ নম্বর জিপিএ মূল্যায়ন (মোট ১২০ নম্বর)।\n\n💡 *EduFast-এর **Varsity 'Ka' Unit Crack Course**-এ ঢাবির বিগত ১০ বছরের প্রশ্ন ব্যাংক ব্যাখ্যাসহ পাওয়া যাবে।*`;
  }

  // Medical lookup
  if (q.includes('medical') || q.includes('মেডিকেল') || q.includes('dmc') || q.includes('ডাক্তার')) {
    return `🩺 **মেডিকেল (MBBS/BDS) ভর্তি পরীক্ষার যোগ্যতা:**\n\n1. **জিপিএ শর্ত:**\n   - এসএসসি ও এইচএসসি মিলিয়ে মোট জিপিএ ন্যূনতম **৯.০০** হতে হবে (উপজাতীয়দের জন্য ৮.০০)।\n   - কোনো একক পরীক্ষায় জিপিএ ৪.০০ এর নিচে থাকা যাবে না।\n   - এইচএসসিতে জীববিজ্ঞানে (Biology) ন্যূনতম গ্রেড পয়েন্ট **৪.০০ (A)** থাকতে হবে।\n2. **ভর্তি পরীক্ষার মানবণ্টন (১০০ নম্বর MCQ):**\n   - জীববিজ্ঞান: ৩০\n   - রসায়ন: ২৫\n   - পদার্থবিজ্ঞান: ২০\n   - ইংরেজি: ১৫\n   - সাধারণ জ্ঞান (বাংলাদেশ ও আন্তর্জাতিক): ১০\n   - *প্রতিটি ভুল উত্তরের জন্য ০.২৫ নম্বর কাটা যাবে (নেগেটিভ মার্কিং)।*\n3. **একাডেমিক স্কোর:** এসএসসি জিপিএ × ১৫ = ৭৫, এইচএসসি জিপিএ × ২৫ = ১২৫ (মোট ২০০ নম্বর যোগ হয়)।`;
  }

  // 3. Courses queries
  if (q.includes('course') || q.includes('কোর্স') || q.includes('class') || q.includes('ক্লাস')) {
    const courseList = courses.slice(0, 4).map(c => 
      `• **${c.title}** (ইন্সট্রাক্টর: ${c.instructor}) - ফি: ৳${c.discountedPrice || c.price} (মূল ফি: ৳${c.price})`
    ).join('\n');
    return `📚 **EduFast-এর জনপ্রিয় কোর্সসমূহ:**\n\n${courseList}\n\n✨ **কোর্স সুবিধাসমূহ:**\n- লাইভ ইন্টারঅ্যাক্টিভ ক্লাস ও রেকর্ডেড ব্যাকআপ\n- চ্যাপ্টারভিত্তিক প্রশ্ন ব্যাংক ও ডেইলি মক টেস্ট\n- ২৪/৭ বুয়েট ও মেডিকেল মেন্টরদের ডাউট সলভ প্যানেল\n\n💡 বিস্তারিত জানতে আমাদের **Courses** মেন্যুতে যান!`;
  }

  // 4. Platform Features (EduCoins, Mock Test, Live Class)
  if (q.includes('coin') || q.includes('কয়েন') || q.includes('educoin')) {
    return `🪙 **EduCoins কি এবং কীভাবে কাজ করে?**\n\nEduCoins হলো EduFast-এর শিক্ষার্থী রিওয়ার্ড সিস্টেম!\n- 📝 প্রতিটি মক টেস্ট সম্পন্ন করলে কয়েন পাওয়া যায়।\n- 🏆 কুইজে সঠিক উত্তরের ভিত্তিতে বোনাস কয়েন যোগ হয়।\n- 🎁 অর্জিত কয়েন দিয়ে পেইড কোর্স ডিসকাউন্ট, এক্সক্লুসিভ নোট ও প্রিমিয়াম প্র্যাকটিস সেট আনলক করা যায়!`;
  }

  if (q.includes('mock') || q.includes('মক') || q.includes('টেস্ট') || q.includes('test') || q.includes('exam')) {
    return `📝 **EduFast Mock Test & Question Bank সিস্টেম:**\n\n- **টাইমড এক্সাম:** ভর্তি পরীক্ষার হুবহু টাইমার ও নেগেটিভ মার্কিং সহ রিয়েল-টাইম টেস্ট।\n- **ইনস্ট্যান্ট অ্যানালাইসিস:** সাবমিটের সাথে সাথে সঠিক উত্তর, বিস্তারিত ব্যাখ্যা ও আপনার দুর্বল অধ্যায়গুলো হাইলাইট করা হয়।\n- **লিডারবোর্ড:** সারাদেশে সহপাঠীদের সাথে নিজের পজিশন ও পার্সেন্টাইল দেখার সুবিধা।`;
  }

  // 5. Academic Subjects (Physics, Math, Chemistry)
  if (q.includes('গতিবিদ্যা') || q.includes('প্রাস') || q.includes('projectile') || q.includes('motion')) {
    return `🚀 **গতিবিদ্যা (Dynamics) ও প্রাস (Projectile Motion) এর মূল সূত্রসমূহ:**\n\n1. **প্রাসের গতি সমীকরণ:**\n   - সর্বোচ্চ উচ্চতা: $$H = \\frac{u^2 \\sin^2 \\alpha}{2g}$$\n   - বিচরণ কাল / উড্ডয়ন কাল: $$T = \\frac{2u \\sin \\alpha}{g}$$\n   - আনুভূমিক পাল্লা: $$R = \\frac{u^2 \\sin 2\\alpha}{g}$$\n   - সর্বোচ্চ পাল্লা ($$\\alpha = 45^\\circ$$): $$R_{\\max} = \\frac{u^2}{g}$$\n2. **গুরুত্বপূর্ণ শর্টকাট:**\n   - যদি পাল্লা $R$ সর্বোচ্চ উচ্চতা $H$ এর ৪ গুণ হয় ($R = 4H$), তবে নিক্ষেপণ কোণ $\\alpha = 45^\\circ$।\n   - পরিপূরক কোণ $\\alpha$ এবং $(90^\\circ - \\alpha)$ এর জন্য আনুভূমিক পাল্লা সমান হয় ($R_1 = R_2$)।`;
  }

  if (q.includes('ক্যালকুলাস') || q.includes('integration') || q.includes('ইন্টিগ্রেশন') || q.includes('অন্তরীকরণ') || q.includes('differentiation')) {
    return `📐 **উচ্চতর গণিত: ক্যালকুলাস ও ইন্টিগ্রেশন শর্টকাট:**\n\n1. **গুরুত্বপূর্ণ সূত্রাবলী:**\n   - $\\int e^x [f(x) + f'(x)]\\, dx = e^x f(x) + C$\n   - $\\int \\frac{f'(x)}{f(x)}\\, dx = \\ln |f(x)| + C$\n   - $\\int \\frac{f'(x)}{\\sqrt{f(x)}}\\, dx = 2\\sqrt{f(x)} + C$\n2. **এডমিশন স্পেশাল হ্যাক:**\n   - $\\int_0^{\\pi/2} \\frac{\\sin^n x}{\\sin^n x + \\cos^n x}\\, dx = \\frac{\\pi}{4}$ (যেকোনো ঘাত $n$ এর জন্য উত্তর সর্বদা $\\frac{\\pi}{4}$)।\n   - $\\lim_{x \\to 0} \\frac{\\sin ax}{\\sin bx} = \\frac{a}{b}$।`;
  }

  if (q.includes('জারণ') || q.includes('oxidation') || q.includes('বাফার') || q.includes('buffer') || q.includes('ph')) {
    return `🧪 **রসায়ন: গুরুত্বপূর্ণ সূত্র ও কনসেপ্ট:**\n\n1. **বাফার দ্রবণের pH (হেন্ডারসন-হ্যাসেলবাল্ক সমীকরণ):**\n   - অম্লীয় বাফার: $$\\text{pH} = \\text{pK}_a + \\log \\frac{[\\text{Salt}]}{[\\text{Acid}]}$$\n   - ক্ষারীয় বাফার: $$\\text{pOH} = \\text{pK}_b + \\log \\frac{[\\text{Salt}]}{[\\text{Base}]}$$\n2. **জারণ সংখ্যা বের করার নিয়ম:**\n   - $\\text{KMnO}_4$ এ $\\text{Mn}$: $+1 + x + 4(-2) = 0 \\implies x = +7$\n   - $\\text{K}_2\\text{Cr}_2\\text{O}_7$ এ $\\text{Cr}$: $2(+1) + 2x + 7(-2) = 0 \\implies 2x = 12 \\implies x = +6$।`;
  }

  // Default fallback response
  return `💡 **EduFast AI উত্তর:**\n\nআপনার প্রশ্নটি পেয়েছি: *"**${query.trim()}**"*\n\nআমি EduFast AI Assistant হিসেবে আপনার পড়াশোনা ও এডমিশন সম্পর্কিত যেকোনো বিষয় সমাধান করতে পারি।\n\n📌 **প্রয়োজনীয় লিংক ও ফিচারসমূহ:**\n- 🏛️ **ভর্তি বিজ্ঞপ্তি ও যোগ্যতা:** Circulars পেজ থেকে বুয়েট, ঢাবি, মেডিকেল ও গুচ্ছের শর্ত দেখুন।\n- 📚 **কোর্স ও লাইভ ক্লাস:** Courses মেন্যু থেকে পছন্দের বিষয়ে এনরোল করুন।\n- 📝 **ফ্রি প্র্যাকটিস:** Question Bank ও Mock Test দিয়ে নিজের প্রস্তুতি যাচাই করুন।\n\nনির্দিষ্ট কোনো অধ্যায়, অঙ্ক বা নিয়মের সমাধান জানতে প্রশ্নটি আরেকটু বিস্তারিত লিখে জানান!`;
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
          reply = completion.choices?.[0]?.message?.content?.trim();
          if (reply) {
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
      reply = generateEduFastSmartAnswer(message, userContext);
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
