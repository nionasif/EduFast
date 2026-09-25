import React, { createContext, useContext, useState, useEffect } from 'react';

export const LanguageContext = createContext({
  language: 'bn',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key) => key
});

// Comprehensive bidirectional phrase dictionary
const phraseMap = [
  // Authentication & Nav
  ['ড্যাশবোর্ড', 'Dashboard'],
  ['কোর্স হাব', 'Course Hub'],
  ['প্রশ্নব্যাংক', 'Question Bank'],
  ['লাইভ ক্লাসেস', 'Live Classes'],
  ['ভর্তি তথ্য', 'Admissions'],
  ['মক টেস্ট', 'Mock Tests'],
  ['স্টাডি লাউঞ্জ', 'Study Lounge'],
  ['লগইন', 'Login'],
  ['রেজিস্ট্রেশন', 'Registration'],
  ['সাইন আপ', 'Sign Up'],
  ['সাইনআপ', 'Signup'],
  ['লগআউট', 'Logout'],
  ['সেটিংস', 'Settings'],
  ['প্রোফাইল সেটিংস ও এডিট', 'Profile Settings & Edit'],
  ['প্রোফাইল সেটিংস', 'Profile Settings'],
  ['প্রোফাইল বিবরণী', 'Profile Overview'],
  ['প্রোফাইল বিবরণ', 'Profile Overview'],
  ['তথ্য এডিট', 'Edit Info'],
  ['তথ্য এডিট করুন', 'Edit Information'],
  ['নির্ধারিত মেন্টর', 'Assigned Mentor'],
  ['এসএসসি ও এইচএসসি রেকর্ড', 'SSC & HSC Records'],
  ['এসএসসি/এইচএসসি', 'SSC/HSC Records'],
  ['বন্ধ করুন', 'Close'],
  ['সংরক্ষণ করুন', 'Save Changes'],
  ['পরিবর্তন সংরক্ষণ করুন', 'Save Changes'],

  // Teacher Studio & Overview
  ['শিক্ষক বিবরণী ও পরিচিতি', 'Instructor Overview & Bio'],
  ['তথ্য পরিবর্তন করুন', 'Edit Profile'],
  ['ইমেইল ও মোবাইল ভেরিফাইড শিক্ষক অ্যাকাউন্ট', 'Email & Mobile Verified Instructor Account'],
  ['রেজিস্ট্রেশনের সময় প্রদত্ত সকল তথ্য নির্ভুলভাবে সংরক্ষিত ও ডেটাবেজে সিঙ্ক রয়েছে।', 'All information provided during registration is accurately stored and synced.'],
  ['ইমেইল অ্যাড্রেস', 'Email Address'],
  ['মোবাইল নম্বর', 'Mobile Number'],
  ['পিতার নাম / অভিভাবক', "Father's Name / Guardian"],
  ['পিতার নাম', "Father's Name"],
  ['মাতার নাম', "Mother's Name"],
  ['জন্ম তারিখ', 'Date of Birth'],
  ['বর্তমান শিক্ষা প্রতিষ্ঠান / কর্মক্ষেত্র', 'Current Institution / Workplace'],
  ['সর্বোচ্চ ডিগ্রি ও যোগ্যতা', 'Highest Degree & Qualification'],
  ['প্রধান পাঠদান বিষয়', 'Primary Teaching Subject'],
  ['প্রধান বিষয়', 'Primary Subject'],
  ['শিক্ষকতার অভিজ্ঞতা', 'Teaching Experience'],
  ['পাঠদান শাখা / উইং', 'Academic Wing'],
  ['পাঠদান শাখা', 'Teaching Wing'],
  ['বর্তমান পদবি / টাইটেল', 'Current Title / Designation'],
  ['শিক্ষক পরিচিতি ও বায়ো', 'Instructor Biography'],
  ['ব্যক্তিগত তথ্য বিবরণী', 'Personal Details'],
  ['অফিসিয়াল শিক্ষক ডাটাবেজ', 'Official Teacher Database'],
  ['কর্মক্ষেত্র বা ডিগ্রি প্রতিষ্ঠান', 'Workplace or Degree Institution'],
  ['সার্টিফায়েড শিক্ষাগত যোগ্যতা', 'Certified Academic Qualifications'],
  ['লাইভ স্টুডিও ক্লাস ও প্রশ্নব্যাংক বিশেষজ্ঞ', 'Live Studio Class & Question Bank Expert'],
  ['অ্যাডমিশন ও এইচএসসি ব্যাচ মেন্টরিং', 'Admission & HSC Batch Mentoring'],
  ['নির্ধারিত একাডেমিক উইং', 'Assigned Academic Wing'],
  ['বিশেষায়িত পাঠ্য বিষয়', 'Specialized Subject'],
  ['মোট শিক্ষকতা জীবনকাল', 'Total Teaching Experience'],
  ['পাঠদান ও শিক্ষাগত স্পেশালাইজেশন', 'Teaching & Academic Specialization'],
  ['শিক্ষকের বিভাগ, মূল পাঠদান বিষয় ও অভিজ্ঞতা অনুযায়ী ব্যাচ ও ক্লাস নির্ধারণ করা হয়', 'Batches & classes are assigned based on instructor wing, subject, and experience'],
  ['৩টি আবশ্যক তথ্য', '3 Required Fields'],
  ['কপি', 'Copy'],
  ['কপি হয়েছে', 'Copied'],
  ['পূর্ণ নাম', 'Full Name'],
  ['বিজ্ঞপ্তি বা নোটিশ নেই', 'No Notices Available'],
  ['শিক্ষক প্রোফাইল ছবি', 'Instructor Profile Picture'],
  ['একটি স্পষ্ট পোর্ট্রেট ছবি আপলোড করুন। সর্বোচ্চ ফাইলের আকার: ২ মেগাবাইট (2MB)।', 'Upload a clear portrait picture. Max file size: 2MB.'],
  ['ছবি নির্বাচন করুন', 'Choose Photo'],
  ['ছবি মুছুন', 'Remove Photo'],

  // Student Profile Modal & Dashboard
  ['ব্যক্তিগত তথ্য', 'Personal Details'],
  ['নিবন্ধনের সময় প্রদানকৃত', 'Provided during registration'],
  ['শিক্ষাগত রেকর্ডের সারাংশ', 'Academic Record Summary'],
  ['নিরাপদ ও যাচাইকৃত শিক্ষার্থী প্রোফাইল', 'Secure & Verified Student Profile'],
  ['প্রোফাইল এডিট', 'Edit Profile'],
  ['বিস্তারিত দেখুন', 'View Details'],
  ['বিভাগ / গ্রুপ', 'Department / Group'],
  ['বিভাগ', 'Department'],
  ['বিজ্ঞান শাখা', 'Science'],
  ['ব্যবসায় শিক্ষা', 'Commerce'],
  ['মানবিক শাখা', 'Humanities'],
  ['তথ্য পাওয়া যায়নি', 'Not Available'],
  ['প্রযোজ্য নয়', 'Not Applicable'],
  ['কোনো নোটিফিকেশন নেই', 'No notifications'],
  ['ওভারভিউ', 'Overview'],
  ['লাইভ স্টুডিও', 'Live Studio'],
  ['রেকর্ডিংস', 'Recordings'],
  ['কোর্সেস', 'Courses'],
  ['নোটিশ', 'Notices'],
  ['কয়েন', 'Coins'],
  ['ক্যালকুলেটর', 'Calculator'],
  ['লিডারবোর্ড', 'Leaderboard'],
  ['টাস্ক সলভার', 'Task Solver'],
  ['সরাসরি দেখুন', 'View Directly'],
  ['সব নোটিফিকেশন পড়া হয়েছে', 'All notifications read'],
  ['সব নোটিফিকেশন ক্লিয়ার', 'Clear all notifications'],
  ['পাবলিক প্ল্যাটফর্ম', 'Public Platform']
];

// Clean regex map
const bnToEnMap = new Map();
const enToBnMap = new Map();

phraseMap.forEach(([bn, en]) => {
  bnToEnMap.set(bn.trim(), en.trim());
  enToBnMap.set(en.trim(), bn.trim());
});

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('edufast_language');
      if (saved === 'en' || saved === 'bn') return saved;
    } catch (e) {}
    return 'bn';
  });

  const setLanguage = (lang) => {
    const validLang = lang === 'en' ? 'en' : 'bn';
    setLanguageState(validLang);
    try {
      localStorage.setItem('edufast_language', validLang);
      window.dispatchEvent(new CustomEvent('edufast-language-change', { detail: validLang }));
    } catch (e) {}
  };

  const toggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail && (e.detail === 'en' || e.detail === 'bn')) {
        setLanguageState(e.detail);
      }
    };
    window.addEventListener('edufast-language-change', handleSync);
    return () => window.removeEventListener('edufast-language-change', handleSync);
  }, []);

  // Global DOM Text Observer to ensure 100% language consistency
  // (Skips user inputs like input, textarea, and contenteditable so user's typed signup data is NEVER altered)
  useEffect(() => {
    const translateText = (text, targetLang) => {
      if (!text || typeof text !== 'string') return text;
      const trimmed = text.trim();
      if (!trimmed) return text;

      if (targetLang === 'en') {
        if (bnToEnMap.has(trimmed)) {
          return text.replace(trimmed, bnToEnMap.get(trimmed));
        }
        // Substring replacement for longer combined phrases
        for (const [bn, en] of bnToEnMap.entries()) {
          if (text.includes(bn)) {
            text = text.replaceAll(bn, en);
          }
        }
        return text;
      } else {
        if (enToBnMap.has(trimmed)) {
          return text.replace(trimmed, enToBnMap.get(trimmed));
        }
        for (const [en, bn] of enToBnMap.entries()) {
          if (text.includes(en)) {
            text = text.replaceAll(en, bn);
          }
        }
        return text;
      }
    };

    const processNode = (node) => {
      if (!node) return;
      // Skip form fields, user input, scripts, styles
      const parent = node.parentElement;
      if (!parent) return;
      const tag = parent.tagName.toLowerCase();
      if (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'script' ||
        tag === 'style' ||
        tag === 'code' ||
        parent.isContentEditable ||
        parent.closest('input') ||
        parent.closest('textarea') ||
        parent.classList.contains('preserve-user-input')
      ) {
        return;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const original = node.nodeValue;
        const translated = translateText(original, language);
        if (translated !== original) {
          node.nodeValue = translated;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Also check placeholder for input/textarea if needed (only standard labels)
        for (let child of node.childNodes) {
          processNode(child);
        }
      }
    };

    // Run initial pass on document body
    processNode(document.body);

    // Observe mutations for newly rendered modals or tab switches
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach(n => processNode(n));
        } else if (m.type === 'characterData') {
          processNode(m.target);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => observer.disconnect();
  }, [language]);

  const t = (key) => {
    if (language === 'en') {
      return bnToEnMap.get(key) || key;
    }
    return enToBnMap.get(key) || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
