const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Helper to load admissions data
const loadAdmissions = () => {
  try {
    const filePath = path.join(__dirname, '..', 'data', 'admissions.json');
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]');
    }
  } catch (err) {
    console.error('Error loading admissions.json:', err.message);
  }
  return [];
};

const { spawn } = require('child_process');

const PYTHON_PATH = 'C:\\Users\\USER\\AppData\\Local\\Programs\\Python\\Python313\\python.exe';
const PREDICT_SCRIPT = path.join(__dirname, '..', '..', 'ml_engine', 'predict.py');
const METRICS_FILE = path.join(__dirname, '..', '..', 'ml_engine', 'models', 'model_metrics.json');

/**
 * Execute Python Scikit-Learn ML Inference Engine
 */
function callPythonMLEngine(payload) {
  return new Promise((resolve, reject) => {
    const tempInputFile = path.join(__dirname, '..', `temp_ml_${Date.now()}_${Math.random().toString(36).substring(7)}.json`);
    try {
      fs.writeFileSync(tempInputFile, JSON.stringify(payload), 'utf8');
    } catch (e) {
      return reject(e);
    }

    const pyProc = spawn(PYTHON_PATH, [PREDICT_SCRIPT, '--file', tempInputFile], {
      windowsHide: true,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    let stdoutData = '';
    let stderrData = '';

    pyProc.stdout.on('data', (d) => { stdoutData += d.toString('utf8'); });
    pyProc.stderr.on('data', (d) => { stderrData += d.toString('utf8'); });

    const timeout = setTimeout(() => {
      pyProc.kill();
      try { if (fs.existsSync(tempInputFile)) fs.unlinkSync(tempInputFile); } catch (e) {}
      reject(new Error('Python ML inference timed out after 5s'));
    }, 5000);

    pyProc.on('close', (code) => {
      clearTimeout(timeout);
      try { if (fs.existsSync(tempInputFile)) fs.unlinkSync(tempInputFile); } catch (e) {}
      if (code !== 0) {
        return reject(new Error(stderrData || `Python exited with code ${code}`));
      }
      try {
        const parsed = JSON.parse(stdoutData.trim());
        resolve(parsed);
      } catch (err) {
        reject(new Error(`Failed to parse python output: ${err.message}`));
      }
    });

    pyProc.on('error', (err) => {
      clearTimeout(timeout);
      try { if (fs.existsSync(tempInputFile)) fs.unlinkSync(tempInputFile); } catch (e) {}
      reject(err);
    });
  });
}

/**
 * Probabilistic ML Sigmoid Function (Analytical Fallback)
 */
function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

/**
 * 0. GET /api/ml/model-info
 * Returns metadata, accuracy, and feature importances of the trained Python Scikit-Learn model
 */
router.get('/api/ml/model-info', (req, res) => {
  try {
    if (fs.existsSync(METRICS_FILE)) {
      const data = JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
      return res.json({ success: true, data });
    }
    return res.json({
      success: true,
      data: {
        model_name: 'RandomForestClassifier',
        library: 'scikit-learn 1.9.1 / Python 3.13',
        status: 'Active'
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 1. POST /api/ml/predict-admission-chances
 * Predicts admission chances using Python Scikit-Learn RandomForest Model
 * with fallback to calibrated analytical model
 */
router.post('/api/ml/predict-admission-chances', async (req, res) => {
  const {
    sscGpa = 5.0,
    hscGpa = 5.0,
    group = 'Science',
    subjectGrades = {}, // e.g. { physics: 'A+', chemistry: 'A+', math: 'A+', biology: 'A', english: 'A+' }
    mockTestAvg = 75 // 0 to 100 percentage in EduFast mock tests
  } = req.body;

  // Try Python Scikit-Learn Machine Learning Pipeline
  try {
    const pyResult = await callPythonMLEngine({
      sscGpa: parseFloat(sscGpa) || 5.0,
      hscGpa: parseFloat(hscGpa) || 5.0,
      group,
      subjectGrades,
      mockTestAvg: parseFloat(mockTestAvg) || 75
    });

    if (pyResult && pyResult.success && Array.isArray(pyResult.predictions)) {
      const combinedGpa = ((parseFloat(sscGpa) || 5.0) + (parseFloat(hscGpa) || 5.0)).toFixed(2);
      
      const mappedPredictions = pyResult.predictions.map(p => {
        let tierColor = '#0d9488';
        if (!p.isEligible) {
          tierColor = '#ef4444';
        } else if (p.chancePercentage >= 75) {
          tierColor = '#10b981';
        } else if (p.chancePercentage >= 50) {
          tierColor = '#0d9488';
        } else {
          tierColor = '#f59e0b';
        }

        return {
          id: p.id,
          name: p.name,
          unit: p.unit,
          isEligible: p.isEligible,
          ineligibleReason: (p.ineligibilityReasons && p.ineligibilityReasons.length > 0)
            ? p.ineligibilityReasons.join(', ')
            : '',
          chancePercent: p.chancePercentage,
          tier: p.status,
          tierColor: tierColor,
          suggestion: p.recommendedAction
        };
      });

      return res.json({
        success: true,
        data: {
          engine: 'Python 3.13 / Scikit-Learn RandomForestClassifier',
          trainedSamples: 4000,
          summary: {
            group,
            combinedGpa,
            mockTestAvg: parseFloat(mockTestAvg) || 75,
            percentileRank: pyResult.percentileRank,
            evaluatedUniversitiesCount: mappedPredictions.length
          },
          predictions: mappedPredictions,
          strengths: pyResult.strengths,
          areasToImprove: pyResult.areasToImprove
        }
      });
    }
  } catch (pyErr) {
    console.warn('[ML Predictor] Python inference error, switching to analytical fallback:', pyErr.message);
  }

  // Fallback to Calibrated Analytical Model if Python is temporarily unavailable
  try {

    const ssc = Math.min(Math.max(parseFloat(sscGpa) || 5.0, 1.0), 5.0);
    const hsc = Math.min(Math.max(parseFloat(hscGpa) || 5.0, 1.0), 5.0);
    const combinedGpa = ssc + hsc;
    const mockScore = Math.min(Math.max(parseFloat(mockTestAvg) || 70, 0), 100);

    // Grade to numerical point converter (A+ = 5, A = 4, A- = 3.5, B = 3)
    const gradeToNum = (grade) => {
      if (!grade) return 4.5;
      const g = String(grade).toUpperCase().trim();
      if (g === 'A+' || g === '5.0' || g === '5') return 5.0;
      if (g === 'A' || g === '4.0' || g === '4') return 4.0;
      if (g === 'A-' || g === '3.5') return 3.5;
      if (g === 'B' || g === '3.0' || g === '3') return 3.0;
      if (g === 'C' || g === '2.0') return 2.0;
      return 4.0;
    };

    const mathPt = gradeToNum(subjectGrades.math || 'A+');
    const phyPt = gradeToNum(subjectGrades.physics || 'A+');
    const chemPt = gradeToNum(subjectGrades.chemistry || 'A+');
    const bioPt = gradeToNum(subjectGrades.biology || 'A');
    const engPt = gradeToNum(subjectGrades.english || 'A');

    // Universities Benchmark Definition with weights & cutoffs
    const benchmarks = [
      {
        id: 'buet',
        name: 'বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয় (BUET)',
        unit: 'প্রকৌশল ও স্থাপত্য (Ka & Kha)',
        group: 'Science',
        minCombined: 10.0,
        minSsc: 5.0,
        minHsc: 5.0,
        weights: { ssc: 0.15, hsc: 0.25, math: 0.25, physics: 0.20, chemistry: 0.15 },
        baselineMock: 78,
        difficultyBias: -0.6
      },
      {
        id: 'du-ka',
        name: 'ঢাকা বিশ্ববিদ্যালয় (DU)',
        unit: 'বিজ্ঞান অনুষদ (Ka Unit)',
        group: 'Science',
        minCombined: 8.5,
        minSsc: 3.5,
        minHsc: 3.5,
        weights: { ssc: 0.15, hsc: 0.25, math: 0.20, physics: 0.20, chemistry: 0.20 },
        baselineMock: 68,
        difficultyBias: 0.1
      },
      {
        id: 'medical-mbbs',
        name: 'সরকারি মেডিকেল কলেজসমূহ (DGHS MBBS)',
        unit: 'এমবিবিএস ও বিডিএস (MBBS/BDS)',
        group: 'Science',
        minCombined: 9.0,
        minSsc: 4.0,
        minHsc: 4.0,
        minBio: 4.0,
        weights: { ssc: 0.15, hsc: 0.25, biology: 0.35, chemistry: 0.15, english: 0.10 },
        baselineMock: 74,
        difficultyBias: -0.3
      },
      {
        id: 'ckruet',
        name: 'প্রকৌশল গুচ্ছ (RUET, KUET, CUET)',
        unit: 'ইঞ্জিনিয়ারিং ও প্রযুক্তি',
        group: 'Science',
        minCombined: 9.5,
        minSsc: 4.5,
        minHsc: 4.5,
        weights: { ssc: 0.15, hsc: 0.25, math: 0.25, physics: 0.20, chemistry: 0.15 },
        baselineMock: 65,
        difficultyBias: 0.3
      },
      {
        id: 'gst-science',
        name: 'জিএসটি গুচ্ছ - ২৪টি বিশ্ববিদ্যালয়',
        unit: 'এ ইউনিট (বিজ্ঞান অনুষদ)',
        group: 'Science',
        minCombined: 8.0,
        minSsc: 3.5,
        minHsc: 3.5,
        weights: { ssc: 0.20, hsc: 0.30, math: 0.15, physics: 0.15, chemistry: 0.20 },
        baselineMock: 55,
        difficultyBias: 0.8
      },
      {
        id: 'du-kha',
        name: 'ঢাকা বিশ্ববিদ্যালয় (DU)',
        unit: 'কলা, আইন ও সামাজিক বিজ্ঞান (Kha Unit)',
        group: 'Arts',
        minCombined: 8.0,
        minSsc: 3.0,
        minHsc: 3.0,
        weights: { ssc: 0.25, hsc: 0.35, english: 0.40 },
        baselineMock: 60,
        difficultyBias: 0.3
      },
      {
        id: 'du-ga',
        name: 'ঢাকা বিশ্ববিদ্যালয় (DU)',
        unit: 'ব্যবসায় শিক্ষা অনুষদ (Ga Unit)',
        group: 'Commerce',
        minCombined: 8.0,
        minSsc: 3.0,
        minHsc: 3.0,
        weights: { ssc: 0.25, hsc: 0.35, english: 0.40 },
        baselineMock: 62,
        difficultyBias: 0.25
      }
    ];

    const predictions = benchmarks
      .filter(b => b.group.toLowerCase() === group.toLowerCase() || b.group === 'All')
      .map(b => {
        // Eligibility constraint check
        const isEligible = combinedGpa >= b.minCombined && ssc >= b.minSsc && hsc >= b.minHsc;
        if (b.minBio && bioPt < b.minBio) {
          return {
            id: b.id,
            name: b.name,
            unit: b.unit,
            isEligible: false,
            ineligibleReason: `জীববিজ্ঞানে ন্যূনতম জিপিএ ${b.minBio.toFixed(2)} (A) প্রয়োজন`,
            chancePercent: 0,
            tier: 'Ineligible',
            tierColor: '#ef4444'
          };
        }

        if (!isEligible) {
          return {
            id: b.id,
            name: b.name,
            unit: b.unit,
            isEligible: false,
            ineligibleReason: `ন্যূনতম মোট জিপিএ ${b.minCombined.toFixed(2)} প্রয়োজন (আপনার ${combinedGpa.toFixed(2)})`,
            chancePercent: 0,
            tier: 'Ineligible',
            tierColor: '#ef4444'
          };
        }

        // ML Feature Linear Combination
        let featureZ = b.difficultyBias;

        // GPA Feature Score (Z-normalized)
        const gpaDiff = (combinedGpa - b.minCombined) * 0.8;
        featureZ += gpaDiff;

        // Subject Weighted Impact
        if (b.weights.math) featureZ += (mathPt - 4.0) * b.weights.math * 2.5;
        if (b.weights.physics) featureZ += (phyPt - 4.0) * b.weights.physics * 2.5;
        if (b.weights.chemistry) featureZ += (chemPt - 4.0) * b.weights.chemistry * 2.0;
        if (b.weights.biology) featureZ += (bioPt - 4.0) * b.weights.biology * 2.5;
        if (b.weights.english) featureZ += (engPt - 4.0) * b.weights.english * 1.8;

        // Mock Test Performance Influence
        const mockDiff = (mockScore - b.baselineMock) / 15;
        featureZ += mockDiff * 1.2;

        // Logistic Sigmoid Function to compute probability 0 to 1
        const prob = sigmoid(featureZ);
        const chancePercent = Math.min(Math.max(Math.round(prob * 100), 8), 98);

        // Classification Tier
        let tier = 'Competitive Target';
        let tierColor = '#0d9488';
        let suggestion = '';

        if (chancePercent >= 80) {
          tier = 'High Chance (নিশ্চিত প্রায়)';
          tierColor = '#10b981';
          suggestion = 'আপনার বর্তমান ফলাফল অনুযায়ী মেধার তালিকায় শীর্ষ আসনে স্থান পাওয়ার প্রবল সম্ভাবনা রয়েছে। রিভিশন ধরে রাখুন।';
        } else if (chancePercent >= 55) {
          tier = 'Competitive Target (প্রতিদ্বন্দ্বিতাপূর্ণ)';
          tierColor = '#0d9488';
          suggestion = `মক টেস্টে স্কোর আরও ৫-১০% বাড়ালে এই ইউনিটে চান্স নিশ্চিত করা সম্ভব।`;
        } else {
          tier = 'Moderate / Hard (কঠিন প্রতিযোগিতা)';
          tierColor = '#f59e0b';
          suggestion = `বিগত বছরের প্রশ্ন ও দুর্বল অধ্যায়গুলোতে বাড়তি ফোকাস দিন।`;
        }

        return {
          id: b.id,
          name: b.name,
          unit: b.unit,
          isEligible: true,
          chancePercent,
          tier,
          tierColor,
          suggestion
        };
      });

    // Sort predictions by chance percent descending
    predictions.sort((a, b) => b.chancePercent - a.chancePercent);

    return res.json({
      success: true,
      data: {
        summary: {
          group,
          combinedGpa: combinedGpa.toFixed(2),
          mockTestAvg: mockScore,
          evaluatedUniversitiesCount: predictions.length
        },
        predictions
      }
    });

  } catch (err) {
    console.error('ML Admission chance prediction error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to predict admission chances.' });
  }
});

/**
 * 2. POST /api/ml/exam-date-roadmap
 * Generates automated milestone study roadmap based on active university exam dates
 */
router.post('/api/ml/exam-date-roadmap', (req, res) => {
  try {
    const { targetUniversityIds, studentGroup = 'Science' } = req.body;
    const admissions = loadAdmissions();

    // Map of enriched institutional intelligence
    const universityMetadata = {
      'univ-buet': {
        logo: '📐',
        cutoffScore: '৩১০+ / ৪০০ (লিখিত ও প্রিলি)',
        examPattern: 'প্রিলিমিনারি ১০০ MCQ (-০.২৫ নেগেটিভ) + ফাইনাল ৪০০ লিখিত',
        strategyTips: [
          'BUET পরীক্ষায় স্টেপ মার্কিং থাকে; অঙ্কের সমীকরণ ও চিত্র স্পষ্ট রাখা জরুরি।',
          'উচ্চতর গণিত ও পদার্থবিজ্ঞানের মৌলিক ডেরিভেশন বুঝে না মুখস্থ করে সমাধান করুন।',
          'প্রমিত নন-প্রোগ্রামেবল ক্যালকুলেটর শর্টকাট (ম্যাট্রিক্স, জটিল সংখ্যা) আয়ত্তে রাখুন।'
        ]
      },
      'univ-du': {
        logo: '🏛️',
        cutoffScore: '৭৫+ / ১০০ (MCQ + লিখিত)',
        examPattern: '৬০ নম্বর MCQ + ৪০ নম্বর লিখিত (সময় ৯০ মিনিট, প্রতি ভুল -০.২৫)',
        strategyTips: [
          'ঢাকা বিশ্ববিদ্যালয়ে MCQ এবং লিখিত উভয় অংশে আলাদাভাবে পাস নম্বর পেতে হয়।',
          'লিখিত অংশের জন্য সংক্ষিপ্ত এবং টু-দ্য-পয়েন্ট উত্তর লেখার প্র্যাকটিস করুন।',
          'বিগত ১০ বছরের ঢাবি প্রশ্ন বিশ্লেষণ করলে প্রায় ৪০% অনুরূপ কনসেপ্ট পাওয়া যায়।'
        ]
      },
      'univ-medical': {
        logo: '🩺',
        cutoffScore: '৭২+ / ১০০ (MCQ টেস্ট)',
        examPattern: '১০০ নম্বর MCQ (সময় ৬০ মিনিট, প্রতি ভুলে -০.২৫ কাটা যায়)',
        strategyTips: [
          'জীববিজ্ঞানের ক্ষেত্রে মূল পাঠ্যবইয়ের প্রতিটি গুরুত্বপূর্ণ তথ্য লাইন-বাই-লাইন পড়ুন।',
          'রসায়ন ও পদার্থবিজ্ঞানের সরাসরি সূত্রভিত্তিক ছোট অঙ্কে বেশি ফোকাস দিন।',
          'টাইম ম্যানেজমেন্ট সবচেয়ে গুরুত্বপূর্ণ: ৬০ মিনিটে ১০০টি প্রশ্ন দাগানোর প্র্যাকটিস করুন।'
        ]
      },
      'univ-1792096089869': {
        logo: '💻',
        cutoffScore: '৬৫+ / ১০০',
        examPattern: '১০০ নম্বর MCQ ও কনসেপচুয়াল প্রশ্ন (সময় ৬০ মিনিট)',
        strategyTips: [
          'ম্যাথমেটিক্স ও লজিক্যাল রিজনিং অংশে সর্বোচ্চ একিউরেসি ধরে রাখুন।',
          'ইংরেজি ভোকাবুলারি ও গ্রামারের বেসিক রুলস নিয়মিত রিভিশন দিন।',
          'কম্পিউটার ফান্ডামেন্টালস ও আইসিটি অংশের বিগত বছরের প্রশ্নগুলো শেষ করুন।'
        ]
      },
      'univ-cu': {
        logo: '🎓',
        cutoffScore: '৭০+ / ১০০',
        examPattern: '১০০ নম্বর MCQ (সময় ৬০ মিনিট, প্রতি ভুল -০.২৫)',
        strategyTips: [
          'চবি-র প্রশ্নব্যাংক থেকে প্রায়ই পুনরাবৃত্তি প্রশ্ন আসে, বিগত বছরের প্রশ্ন শেষ করুন।',
          'নেগেটিভ মার্কিং এড়াতে নিশ্চিত না হলে আন্দাজে অপশন দাগাবেন না।'
        ]
      },
      'univ-ru': {
        logo: '📚',
        cutoffScore: '৬৮+ / ১০০',
        examPattern: '৮০টি প্রশ্ন (১০০ নম্বর MCQ, সময় ৬০ মিনিট)',
        strategyTips: [
          'রাজশাহী বিশ্ববিদ্যালয়ে দ্রুত প্রশ্ন পড়ে নির্ভুল সিদ্ধান্ত নেওয়ার স্পিড বাড়ান।',
          'টেক্সটবইয়ের কনসেপ্ট ভিত্তিক প্রশ্ন সবচেয়ে বেশি প্রাধান্য পায়।'
        ]
      },
      'univ-ju': {
        logo: '🔬',
        cutoffScore: '৭২+ / ১০০',
        examPattern: '৮০ নম্বর MCQ + ২০ নম্বর এসএসসি/এইচএসসি জিপিএ',
        strategyTips: [
          'জাবির বিভিন্ন ইউনিটের জন্য গণিত ও অ্যানালিটিক্যাল রিজনিং অত্যন্ত গুরুত্বপূর্ণ।',
          'বাংলা ও ইংরেজি অংশের জন্য ডিপ গ্রামার প্র্যাকটিস চালিয়ে যান।'
        ]
      },
      'univ-gst': {
        logo: '🌐',
        cutoffScore: '৬৮+ / ১০০ (গুচ্ছ সম্মিলিত)',
        examPattern: '১০০ নম্বর MCQ (সময় ৬০ মিনিট, প্রতি ভুল -০.২৫)',
        strategyTips: [
          'গুচ্ছ ভর্তি পরীক্ষায় টেক্সটবই ভিত্তিক শর্ট সিলেবাসের সব টপিক গুরুত্ব পাবে।',
          'সহজ প্রশ্নগুলোতে ভুল না করাটাই গুচ্ছে শীর্ষ মেধা তালিকা নিশ্চিত করে।'
        ]
      }
    };

    // Subject breakdown matrices based on academic group
    const getSubjectBreakdown = (group) => {
      const normalizedGroup = (group || 'Science').toLowerCase();
      if (normalizedGroup.includes('commerce') || normalizedGroup.includes('business')) {
        return [
          { name: 'হিসাববিজ্ঞান', weight: '৩০%', dailyTime: '২.৫ ঘণ্টা', color: '#0d9488', chapters: ['কার্যপত্র ও সমাপনী দাখিলা', 'আর্থিক বিবরণী বিশ্লেষণ', 'ব্যাংক সমন্বয় বিবরণী', 'শেয়ার ইস্যু ও যৌথ মূলধনী কোম্পানি'] },
          { name: 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা', weight: '২৫%', dailyTime: '২.০ ঘণ্টা', color: '#0284c7', chapters: ['ব্যবসায় উদ্যোগ ও একমালিকানা', 'অংশীদারি কারবার', 'ব্যবস্থাপনার নীতি ও প্রেষণা', 'নেতৃত্ব ও নিয়ন্ত্রণ'] },
          { name: 'ফিন্যান্স, ব্যাংকিং ও বীমা', weight: '২০%', dailyTime: '১.৫ ঘণ্টা', color: '#8b5cf6', chapters: ['অর্থের সময়মূল্য', 'ঝুঁকি ও মুনাফার হার', 'মূলধন বাজেটিং', 'বাণিজ্যিক ব্যাংক ও বীমা পলিসি'] },
          { name: 'বাংলা ও ইংরেজি', weight: '২৫%', dailyTime: '২.০ ঘণ্টা', color: '#ea580c', chapters: ['English Grammar & Prepositions', 'Vocabulary & Cloze Test', 'বাংলা ব্যাকরণ ও প্রমিত প্রয়োগ'] }
        ];
      }
      if (normalizedGroup.includes('arts') || normalizedGroup.includes('humanities')) {
        return [
          { name: 'বাংলা (১ম ও ২য় পত্র)', weight: '৩৫%', dailyTime: '২.৫ ঘণ্টা', color: '#0d9488', chapters: ['গুরুত্বপূর্ণ গদ্য ও পদ্যের মূলভাব', 'বানান শুদ্ধি ও প্রমিত বাংলা', 'সমাস, প্রত্যয় ও উপসর্গ', 'বাগধারা ও বাক্য রূপান্তর'] },
          { name: 'ইংরেজি (English Mastery)', weight: '৩৫%', dailyTime: '২.৫ ঘণ্টা', color: '#0284c7', chapters: ['Parts of Speech & Subject-Verb Agreement', 'Tense, Conditionals & Prepositions', 'Synonym-Antonym & Idioms', 'Reading Comprehension Drills'] },
          { name: 'সাধারণ জ্ঞান ও সাম্প্রতিক', weight: '৩০%', dailyTime: '২.০ ঘণ্টা', color: '#8b5cf6', chapters: ['বাংলাদেশের ইতিহাস ও মুক্তিযুদ্ধ', 'সংবিধান ও জাতীয় অর্জনসমূহ', 'আন্তর্জাতিক চুক্তি ও সংস্থা', 'সাম্প্রতিক ৩ মাসের কারেন্ট অ্যাফেয়ার্স'] }
        ];
      }
      // Default: Science
      return [
        { name: 'পদার্থবিজ্ঞান', weight: '২৫%', dailyTime: '২.০ ঘণ্টা', color: '#0d9488', chapters: ['নিউটনিয়ান বলবিদ্যা ও মহাকর্ষ', 'কাজ, শক্তি ও ক্ষমতা', 'স্থির তড়িৎ ও চল তড়িৎ', 'আদর্শ গ্যাস ও তাপগতিবিদ্যা', 'ভৌত আলোকবিজ্ঞান'] },
        { name: 'রসায়ন', weight: '২৫%', dailyTime: '২.০ ঘণ্টা', color: '#0284c7', chapters: ['গুণগত রসায়ন ও দ্রাব্যতা', 'মৌলের পর্যায়বৃত্ত ধর্ম ও বন্ধন', 'রাসায়নিক পরিবর্তন (Kc, Kp ও বাফার)', 'জৈব যৌগ ও বিক্রিয়া মেকানিজম', 'তড়িৎ রসায়ন'] },
        { name: 'উচ্চতর গণিত', weight: '২৫%', dailyTime: '২.০ ঘণ্টা', color: '#8b5cf6', chapters: ['সরলরেখা ও বৃত্ত', 'ত্রিকোণমিতিক অনুপাত ও বিপরীত ফাংশন', 'অন্তরীকরণ ও চরমমান নির্ণয়', 'যোগজীকরণ ও ক্ষেত্রফল নির্ণয়', 'কণিক ও স্থিতিবিদ্যা-গতিবিদ্যা'] },
        { name: 'জীববিজ্ঞান / ইংরেজি', weight: '২৫%', dailyTime: '১.৫ ঘণ্টা', color: '#ea580c', chapters: ['কোষ ও এর গঠন', 'জিনতত্ত্ব ও বিবর্তন', 'রক্ত, সংবহন ও শ্বসন', 'Grammar Rules & Advanced Vocabulary'] }
      ];
    };

    // Filter admissions if specific IDs requested; else return full university list
    let activeList = admissions;
    if (Array.isArray(targetUniversityIds) && targetUniversityIds.length > 0) {
      const filtered = admissions.filter(u => targetUniversityIds.includes(u.id) || targetUniversityIds.includes(u.shortName));
      if (filtered.length > 0) activeList = filtered;
    }

    const now = new Date();
    const roadmapItems = activeList.map(univ => {
      // Parse exam date or calculate accurate pending days
      let examDate = null;
      if (univ.examDate) {
        const parsed = new Date(univ.examDate);
        if (!isNaN(parsed.getTime())) {
          examDate = parsed;
        }
      }
      if (!examDate) {
        examDate = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));
      }

      const diffTime = Math.max(examDate.getTime() - now.getTime(), 12 * 24 * 60 * 60 * 1000);
      const totalDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Dynamic phase duration breakdown
      const phase1Days = Math.round(totalDaysLeft * 0.50); // Foundational Mastery
      const phase2Days = Math.round(totalDaysLeft * 0.30); // Question Bank & Hacks
      const phase3Days = Math.max(totalDaysLeft - phase1Days - phase2Days, 5); // Full Mock Simulation

      // Dynamic study hours based on time pressure
      let dailyHoursRecommended = '৭ - ৮ ঘণ্টা / দিন';
      let readinessLevel = 'কনসেপ্ট মাস্টারি ফেজ (Foundations)';
      if (totalDaysLeft > 70) {
        dailyHoursRecommended = '৬.৫ - ৭.৫ ঘণ্টা / দিন';
        readinessLevel = 'প্রাথমিক ভিত্তি মজবুতকরণ ফেজ (Phase 1)';
      } else if (totalDaysLeft <= 35) {
        dailyHoursRecommended = '৯.৫ - ১১ ঘণ্টা / দিন (পিক এক্সাম স্প্রিন্ট)';
        readinessLevel = 'চূড়ান্ত এক্সাম স্প্রিন্ট ফেজ (Final Sprint)';
      } else {
        dailyHoursRecommended = '৮ - ৯.৫ ঘণ্টা / দিন';
        readinessLevel = 'প্রশ্নব্যাংক ও স্পিড অ্যাক্সিলারেশন ফেজ (Phase 2)';
      }

      const meta = universityMetadata[univ.id] || {
        logo: '🏛️',
        cutoffScore: '৭০+ / ১০০ (কাট-অফ প্রজেকশন)',
        examPattern: '১০০ নম্বর MCQ (সময় ৬০ মিনিট, নেগেটিভ -০.২৫)',
        strategyTips: [
          'মূল পাঠ্যবই ও কনসেপ্টের ওপর শতভাগ দখল নিশ্চিত করুন।',
          'বিগত বছরের প্রশ্ন সমাধান করে প্রশ্ন প্যাটার্ন আয়ত্তে রাখুন।'
        ]
      };

      const subjectBreakdown = getSubjectBreakdown(studentGroup);

      return {
        universityId: univ.id,
        universityName: univ.name,
        logo: meta.logo || univ.logo || '🏛️',
        examDateFormatted: univ.examDate || examDate.toLocaleDateString('bn-BD', { month: 'long', day: 'numeric', year: 'numeric' }),
        daysLeft: totalDaysLeft,
        dailyHoursRecommended,
        readinessLevel,
        cutoffScore: meta.cutoffScore,
        examPattern: meta.examPattern,
        strategyTips: meta.strategyTips,
        subjectBreakdown,
        phases: [
          {
            phaseIndex: 1,
            phaseCode: 'foundation',
            title: 'ফেজ ১: মূল কনসেপ্ট মাস্টারি ও থিওরি ড্রিল',
            durationDays: `${phase1Days} দিন`,
            badgeColor: '#0d9488',
            focus: 'অধ্যায়ভিত্তিক ফর্মুলা শিট তৈরি, সূত্র প্রমাণ ও বেসিক ক্লিয়ারিং',
            weeklyGoal: 'প্রতি সপ্তাহে প্রতিটি বিষয়ের অন্তত ৩টি জটিল অধ্যায়ের সব থিওরি ও সূত্র মুখস্থ ও নোট ডাউন করা।',
            tasks: [
              'পদার্থবিজ্ঞান ও উচ্চতর গণিতের মূল সূত্র, গ্রাফ ও ডেরিভেশন রিভিশন নোট তৈরি',
              'রসায়নের বিক্রিয়া মেকানিজম, জারন-বিজারন ও বাফার দ্রবণের অঙ্ক সমাধান',
              'জীববিজ্ঞান/ব্যবসায়/বাংলা বিষয়ের লাইন-বাই-লাইন টেক্সটবুক রিভিশন',
              'প্রতিটি অধ্যায়ের কনসেপচুয়াল শর্টকাট ফ্ল্যাশকার্ড ও সেলফ-নোট প্রস্তুত করা'
            ],
            status: 'in-progress'
          },
          {
            phaseIndex: 2,
            phaseCode: 'question-bank',
            title: 'ফেজ ২: বিগত ১০-১৫ বছরের প্রশ্নব্যাংক সল্যুশন ও শর্টকাট হ্যাকস',
            durationDays: `${phase2Days} দিন`,
            badgeColor: '#0284c7',
            focus: 'কোয়েশ্চেন প্যাটার্ন এনালাইসিস, ক্যালকুলেটর ট্রিকস ও টাইম সেভিং হ্যাকস',
            weeklyGoal: 'প্রতি সপ্তাহে বিগত বছরের ন্যূনতম ৫০০টি প্রশ্ন টাইমার ধরে সমাধান ও দুর্বল টপিক চিহ্নিত করা।',
            tasks: [
              `${univ.name}-এর বিগত ১০-১৫ বছরের সকল ভর্তি পরীক্ষার প্রশ্ন নিখুঁত সমাধান`,
              'ক্যালকুলেটর শর্টকাট (ম্যাট্রিক্স, জটিল সংখ্যা, সমীকরণ) ও অপশন টেস্ট কৌশল রপ্ত করা',
              'টাইম ম্যানেজমেন্ট: প্রতি প্রশ্নে সর্বোচ্চ ৪৫ সেকেন্ড সময়ের মধ্যে উত্তর করার প্র্যাকটিস',
              'ভুল হওয়া ও বিভ্রান্তিকর প্রশ্নগুলো নিয়ে আলাদা "মিস্টেক ডায়রি" তৈরি ও রিভিউ'
            ],
            status: totalDaysLeft <= 40 ? 'in-progress' : 'upcoming'
          },
          {
            phaseIndex: 3,
            phaseCode: 'simulation',
            title: 'ফেজ ৩: ফাইনাল টাইমড মক টেস্ট ও এক্সাম হল স্ট্র্যাটেজি',
            durationDays: `${phase3Days} দিন`,
            badgeColor: '#8b5cf6',
            focus: '১০০ নম্বরের ফুল-লেংথ মক টেস্ট, ওএমআর শিট পূরণ ও নেগেটিভ মার্কিং হ্যান্ডলিং',
            weeklyGoal: 'প্রতিদিন ১টি করে পূর্ণাঙ্গ টাইমড টেস্ট দেওয়া এবং ৯০%+ একিউরেসি ও ৯৯ পার্সেন্টাইল আত্মবিশ্বাস অর্জন।',
            tasks: [
              'নেগেটিভ মার্কিং সহ ফুল-লেংথ ১০০ নম্বরের টাইমড অনলাইন মক টেস্ট দেওয়া',
              'ভুল হওয়া প্রশ্নগুলোর রিভার্স-রিভিশন ও মেন্টরদের সাথে সল্যুশন এনালাইসিস',
              'পরীক্ষার হলের ওএমআর শিট দ্রুত ও নির্ভুলভাবে পূরণের বাস্তব কৌশল অনুশীলন',
              'শেষ মুহূর্তের মাইন্ডসেট টিপস, স্ট্রেস রিলিজ ও ফর্মুলা কুইক রিভিউ'
            ],
            status: totalDaysLeft <= 15 ? 'in-progress' : 'upcoming'
          }
        ]
      };
    });

    return res.json({
      success: true,
      studentGroup,
      totalCount: roadmapItems.length,
      roadmap: roadmapItems
    });

  } catch (err) {
    console.error('Roadmap generation error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to generate date-driven study roadmap.' });
  }
});

module.exports = router;
