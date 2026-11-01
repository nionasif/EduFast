// ============================================================================
// EduFast Advanced Adaptive Study Planner & Multi-Exam Engine
// ============================================================================
// Features:
// 1. Unified Syllabus Knowledge Base (Paper 1 & Paper 2 with Chapters & Subtopics)
// 2. Multi-Exam Dynamic Prioritization (Closest Exam weight 65%, Secondary 35%)
// 3. Day 1 - Day 50 (or custom days) Adaptive Day-by-Day Routine Generator
// 4. Cross-Exam Topic Deduplication & Mastered Topics History Tracker
// 5. Student Profile & Applied Universities Integration
// ============================================================================

export const SYLLABUS_DATABASE = {
  Science: {
    physics_1st: {
      subject: 'পদার্থবিজ্ঞান ১ম পত্র (Physics 1st Paper)',
      short: 'পদার্থ ১ম',
      color: '#0284c7',
      chapters: [
        {
          no: 2,
          name: 'ভেক্টর (Vectors)',
          subtopics: ['ডট ও ক্রস গুণন', 'লম্ব একক ভেক্টর ও কোণ নির্ণয়', 'নদী-নৌকা ও বৃষ্টি-ছাতার ম্যাথ', 'ভেক্টর ক্যালকুলাস (গ্রেডিয়েন্ট, ডাইভারজেন্স, কার্ল)'],
          formulas: ['A·B = AB cosθ', '|A×B| = AB sinθ', 't = d / (v cosα)', '∇×V = 0 (অঘূর্ণনশীল)'],
          priority: 'High',
          universities: ['univ-buet', 'univ-du', 'univ-medical', 'univ-cu', 'univ-ru', 'univ-gst']
        },
        {
          no: 3,
          name: 'গতিবিদ্যা (Dynamics)',
          subtopics: ['প্রাসের গতি ও সমীকরণ', 'সর্বোচ্চ উচ্চতা ও পাল্লা', 'রৈখিক গতিসূত্র ও গ্রাফিকাল বিশ্লেষণ', 'আপেক্ষিক বেগ'],
          formulas: ['R = (v₀² sin2θ) / g', 'H = (v₀² sin²θ) / (2g)', 'y = x tanθ - (gx²)/(2v₀² cos²θ)'],
          priority: 'High',
          universities: ['univ-buet', 'univ-du', 'univ-cu', 'univ-ru', 'univ-gst']
        },
        {
          no: 4,
          name: 'নিউটনিয়ান বলবিদ্যা (Newtonian Mechanics)',
          subtopics: ['ভরবেগ ও শক্তির সংরক্ষণশীলতা', 'রকেট গতি সমীকরণ ও ধাক্কা', 'জড়তার ভ্রামক ও চক্রগতির ব্যাসার্ধ', 'কৌণিক ভরবেগ ও ব্যাংকিং কোণ'],
          formulas: ['F = dp/dt', 'v = u ln(m₀/m)', 'I = ∑mr²', 'tanθ = v² / (rg)'],
          priority: 'Critical',
          universities: ['univ-buet', 'univ-du', 'univ-medical', 'univ-cu', 'univ-ru', 'univ-gst']
        },
        {
          no: 5,
          name: 'কাজ, শক্তি ও ক্ষমতা (Work, Energy & Power)',
          subtopics: ['পরিবর্তনশীল বল দ্বারা কাজ', 'স্প্রিং বল ও বিভব শক্তি', 'কুয়া ও চৌবাচ্চা খালি করার ম্যাথ', 'কর্মদক্ষতা (Efficiency)'],
          formulas: ['W = 1/2 k x²', 'P = W / t = F·v', 'η = (P_out / P_in) × 100%'],
          priority: 'Critical',
          universities: ['univ-buet', 'univ-du', 'univ-medical', 'univ-cu', 'univ-ru', 'univ-gst']
        },
        {
          no: 6,
          name: 'মহাকর্ষ ও অভিকর্ষ (Gravitation)',
          subtopics: ['মহাকর্ষীয় বিভব ও তীব্রতা', 'উচ্চতা ও গভীরতায় g-এর পরিবর্তন', 'মুক্তিবেগ (Escape Velocity)', 'কৃত্রিম উপগ্রহের বেগ ও পর্যায়কাল'],
          formulas: ['g_h = g (1 - 2h/R)', 'v_e = √(2gR)', 'v_orb = √(GM / (R+h))', 'T² ∝ r³'],
          priority: 'High',
          universities: ['univ-buet', 'univ-du', 'univ-medical', 'univ-cu', 'univ-ru', 'univ-gst']
        },
        {
          no: 7,
          name: 'পদার্থের গাঠনিক ধর্ম (Structural Properties)',
          subtopics: ['স্থিতিস্থাপকতা ও ইয়ং-এর গুণাঙ্ক', 'পৃষ্ঠটান ও সান্দ্রতা (স্টোকসের সূত্র)', 'প্রান্তবেগ ও কৈশিক নল', 'পয়সনের অনুপাত'],
          formulas: ['Y = (FL) / (Al)', 'F = 6πηrv', 'h = (2T cosθ) / (rρg)', 'σ = - (Δd/d) / (ΔL/L)'],
          priority: 'Medium',
          universities: ['univ-buet', 'univ-du', 'univ-medical', 'univ-gst']
        },
        {
          no: 8,
          name: 'পর্যায়বৃত্ত গতি (Periodic Motion)',
          subtopics: ['সরল ছন্দিত স্পন্দন ও ব্যবকলনীয় সমীকরণ', 'সরল দোলকের সূত্র ও পাহাড়ে সময় হারানো', 'স্প্রিং-ভর ব্যবস্থা ও পর্যায়কাল', 'দোলনের শক্তি'],
          formulas: ['d²x/dt² + ω²x = 0', 'T = 2π√(L/g)', 'T = 2π√(m/k)', 'E = 1/2 k A²'],
          priority: 'High',
          universities: ['univ-buet', 'univ-du', 'univ-cu', 'univ-gst']
        },
        {
          no: 10,
          name: 'আদর্শ গ্যাস ও গতিতত্ত্ব (Ideal Gas & Kinetics)',
          subtopics: ['আদর্শ গ্যাস সূত্র ও RMS বেগ', 'গ্যাসের গতিশক্তি ও স্বাধীনতার মাত্রা', 'আপেক্ষিক আর্দ্রতা ও শিশিরাঙ্ক (গ্লাইশারের সূত্র)', 'চাপ ও ঘনত্বের সম্পর্ক'],
          formulas: ['PV = nRT', 'c_rms = √(3RT/M)', 'E_k = 3/2 nRT', 'R = (f/F) × 100%'],
          priority: 'Critical',
          universities: ['univ-buet', 'univ-du', 'univ-medical', 'univ-cu', 'univ-ru', 'univ-gst']
        }
      ]
    },
    physics_2nd: {
      subject: 'পদার্থবিজ্ঞান ২য় পত্র (Physics 2nd Paper)',
      short: 'পদার্থ ২য়',
      color: '#0891b2',
      chapters: [
        {
          no: 1,
          name: 'তাপগতিবিদ্যা (Thermodynamics)',
          subtopics: ['তাপগতিবিদ্যার ১ম সূত্র ও আপেক্ষিক তাপ', 'সমোষ্ণ ও রুদ্ধতাপীয় প্রক্রিয়া', 'কার্নো চক্র ও ইঞ্জিনের দক্ষতা', 'এনট্রপি পরিবর্তন (ΔS)'],
          formulas: ['dQ = dU + dW', 'PV^γ = const', 'η = 1 - (T₂/T₁)', 'dS = dQ / T'],
          priority: 'Critical',
          universities: ['univ-buet', 'univ-du', 'univ-medical', 'univ-cu', 'univ-ru', 'univ-gst']
        },
        {
          no: 2,
          name: 'স্থির তড়িৎ (Electrostatics)',
          subtopics: ['কুলম্বের সূত্র ও তড়িৎ প্রাবল্য', 'তড়িৎ বিভব ও গাউসের সূত্র', 'ধারকত্ব ও সমান্তরাল পাত ধারক', 'ধারকে সঞ্চিত শক্তি'],
          formulas: ['E = q / (4πε₀r²)', 'V = q / (4πε₀r)', 'C = (ε₀A) / d', 'U = 1/2 CV²'],
          priority: 'High',
          universities: ['univ-buet', 'univ-du', 'univ-medical', 'univ-cu', 'univ-gst']
        },
        {
          no: 3,
          name: 'চল তড়িৎ (Current Electricity)',
          subtopics: ['ওহমের সূত্র ও রোধের তাপমাত্রা সহগ', 'কার্শফের সূত্র ও হুইটস্টোন ব্রিজ', 'শান্ট ও গ্যালভানোমিটার রূপান্তর', 'কোষের সমবায় ও তড়িৎ ক্ষমতা'],
          formulas: ['R_t = R₀(1 + αΔT)', 'P/Q = R/S', 'S = (I_g G) / (I - I_g)', 'P = I²R = V²/R'],
          priority: 'Critical',
          universities: ['univ-buet', 'univ-du', 'univ-cu', 'univ-ru', 'univ-gst']
        },
        {
          no: 7,
          name: 'ভৌত আলোকবিজ্ঞান (Physical Optics)',
          subtopics: ['হাইগেনসের নীতি ও তরঙ্গমুখ', 'ইয়ং-এর দ্বি-চির ব্যতিচার', 'অপবর্তন (একক চির ও গ্রেটিং)', 'সমবর্তন ও ব্রুস্টারের সূত্র'],
          formulas: ['y_n = (nλD) / d', 'β = (λD) / d', 'a sinθ = nλ', 'tanθ_p = μ'],
          priority: 'High',
          universities: ['univ-buet', 'univ-du', 'univ-gst']
        },
        {
          no: 8,
          name: 'আধুনিক পদার্থবিজ্ঞান (Modern Physics)',
          subtopics: ['কাল দীর্ঘায়ন ও দৈর্ঘ্য সংকোচন', 'ভর বৃদ্ধি ও ভর-শক্তি সমীকরণ', 'ফটোতড়িৎ ক্রিয়া ও আইনস্টাইনের সমীকরণ', 'কম্পটন ক্রিয়া ও ডি-ব্রগলি তরঙ্গ'],
          formulas: ['t = t₀ / √(1 - v²/c²)', 'E = mc²', 'hf = W₀ + 1/2 mv_max²', 'λ = h / p'],
          priority: 'Critical',
          universities: ['univ-buet', 'univ-du', 'univ-medical', 'univ-cu', 'univ-gst']
        },
        {
          no: 9,
          name: 'পরমাণু মডেল ও নিউক্লিয়ার পদার্থবিজ্ঞান (Nuclear Physics)',
          subtopics: ['রাদারফোর্ড ও বোর পরমাণু মডেল', 'হাইড্রোজেন বর্ণালী (রিডবার্গ সমীকরণ)', 'তেজস্ক্রিয় ক্ষয় ও অর্ধায়ু', 'ভর ত্রুটি ও বন্ধন শক্তি'],
          formulas: ['1/λ = R_H (1/n₁² - 1/n₂²)', 'N = N₀ e^(-λt)', 'T_{1/2} = 0.693 / λ', 'ΔE = Δm c²'],
          priority: 'High',
          universities: ['univ-buet', 'univ-du', 'univ-medical', 'univ-cu', 'univ-ru', 'univ-gst']
        },
        {
          no: 10,
          name: 'সেমিকন্ডাক্টর ও ইলেকট্রনিক্স (Semiconductors)',
          subtopics: ['p-n জাংশন ও ডায়োড রেকটিফায়ার', 'ট্রানজিস্টর কনফিগারেশন ও বিবর্ধন', 'লজিক গেট ও বুলিয়ান অ্যালজেব্রা', 'সংখ্যা পদ্ধতি রূপান্তর'],
          formulas: ['α = I_c / I_e', 'β = I_c / I_b', 'β = α / (1 - α)'],
          priority: 'High',
          universities: ['univ-buet', 'univ-du', 'univ-cu', 'univ-gst']
        }
      ]
    },
    chem_1st: {
      subject: 'রসায়ন ১ম পত্র (Chemistry 1st Paper)',
      short: 'রসায়ন ১ম',
      color: '#059669',
      chapters: [
        {
          no: 2,
          name: 'গুণগত রসায়ন (Qualitative Chemistry)',
          subtopics: ['কোয়ান্টাম সংখ্যা ও ইলেকট্রন বিন্যাস নীতি', 'হাইজেনবার্গের অনিশ্চয়তা ও বর্ণালী', 'দ্রাব্যতা ও দ্রাব্যতা গুণফল (Ksp)', 'আয়ন সনাক্তকরণ ও ক্রোম্যাটোগ্রাফি'],
          formulas: ['mvr = nh / (2π)', 'Δx·Δp ≥ h / (4π)', 'Ksp = [A⁺]ᵃ [B⁻]ᵇ'],
          priority: 'Critical',
          universities: ['univ-buet', 'univ-du', 'univ-medical', 'univ-cu', 'univ-ru', 'univ-gst']
        },
        {
          no: 3,
          name: 'মৌলের পর্যায়বৃত্ত ধর্ম ও বন্ধন (Periodic Properties)',
          subtopics: ['আয়নকরণ শক্তি ও ইলেকট্রন আসক্তি', 'সংকরায়ন ও জৈব-অজৈব অণুর জ্যামিতি', 'হাইড্রোজেন বন্ধন ও ফাজানের নীতি', 'জটিল যৌগ ও লিগ্যান্ড'],
          formulas: ['sp, sp², sp³, sp³d', 'পোলারায়ন ∝ চার্জ / ব্যাসার্ধ'],
          priority: 'Critical',
          universities: ['univ-buet', 'univ-du', 'univ-medical', 'univ-cu', 'univ-ru', 'univ-gst']
        },
        {
          no: 4,
          name: 'রাসায়নিক পরিবর্তন (Chemical Changes)',
          subtopics: ['লা-শাতেলিয়ারের নীতি ও সম্যাবস্থা', 'ভরক্রিয়া সূত্র (Kc ও Kp নির্ণয়)', 'বাফার দ্রবণ ও হেন্ডারসন সমীকরণ', 'অসওয়াল্ডের লঘুকরণ সূত্র ও এনথালপি'],
          formulas: ['Kp = Kc (RT)^Δn', 'pH = pKa + log([Salt]/[Acid])', 'α = √(Ka / C)'],
          priority: 'Critical',
          universities: ['univ-buet', 'univ-du', 'univ-medical', 'univ-cu', 'univ-ru', 'univ-gst']
        },
        {
          no: 5,
          name: 'কর্মমুখী রসায়ন (Practical Chemistry)',
          subtopics: ['খাদ্য নিরাপত্তা ও প্রিজারভেটিভস', 'ভিনেগার প্রস্তুতি ও সাসপেনশন-কোয়াগুলেশন', 'টয়লেট্রিজ ও প্রসাধন সামগ্রী প্রস্তুতি'],
          formulas: ['CH₃COOH (৬-১০% জলীয় দ্রবণ)', 'ক্লাউড পয়েন্ট ও ক্লিনজিং একশন'],
          priority: 'Medium',
          universities: ['univ-du', 'univ-medical', 'univ-gst']
        }
      ]
    },
    chem_2nd: {
      subject: 'রসায়ন ২য় পত্র (Chemistry 2nd Paper)',
      short: 'রসায়ন ২য়',
      color: '#10b981',
      chapters: [
        {
          no: 1,
          name: 'পরিবেশ রসায়ন (Environmental Chemistry)',
          subtopics: ['বয়েলের সূত্র, চার্লস সূত্র ও গ্রাহামের ব্যাপন সূত্র', 'ডাল্টনের আংশিক চাপ ও ভ্যান্ডার ওয়ালস সমীকরণ', 'বায়ুমণ্ডলের স্তর ও ওজোন ক্ষয়', 'লুইস এসিড-ক্ষার ও পানির BOD/COD'],
          formulas: ['r₁/r₂ = √(M₂/M₁)', 'P_i = X_i × P_total', '(P + an²/V²)(V - nb) = nRT'],
          priority: 'Critical',
          universities: ['univ-buet', 'univ-du', 'univ-medical', 'univ-cu', 'univ-ru', 'univ-gst']
        },
        {
          no: 2,
          name: 'জৈব রসায়ন (Organic Chemistry)',
          subtopics: ['জৈব যৌগের নামকরণ ও সমাণুতা (জ্যামিতিক ও স্টেরিও)', 'অ্যালকেন, অ্যালকিন ও বেনজিনের ইলেকট্রোফিলিক প্রতিস্থাপন', 'গ্রিগনার্ড বিকারক ও অ্যালকোহল/কার্বনিল যৌগ', 'SN1, SN2, E1, E2 বিক্রিয়া মেকানিজম', 'অ্যারোমেটিসিটি ও হাকেল নীতি'],
          formulas: ['৪n + ২ পাই ইলেকট্রন', 'SN1: ২ ধাপ, ৩° > ২° > ১°', 'SN2: ১ ধাপ, ১° > ২° > ৩°'],
          priority: 'Critical',
          universities: ['univ-buet', 'univ-du', 'univ-medical', 'univ-cu', 'univ-ru', 'univ-gst']
        },
        {
          no: 3,
          name: 'পরিমাণগত রসায়ন (Quantitative Chemistry)',
          subtopics: ['মোলারিটি, নরমালিটি ও পিপিএম (ppm)', 'টাইট্রেশন ও জারণ-বিজারণ ব্যালেন্সিং', 'নির্দেশকের পিএইচ সীমা', 'বিয়ার-ল্যাম্বার্ট সূত্র'],
          formulas: ['S = (1000 × w) / (M × V)', 'V₁S₁e₁ = V₂S₂e₂', 'ppm = (w_solute / w_solution) × 10⁶', 'A = ε c l'],
          priority: 'Critical',
          universities: ['univ-buet', 'univ-du', 'univ-medical', 'univ-cu', 'univ-ru', 'univ-gst']
        },
        {
          no: 4,
          name: 'তড়িৎ রসায়ন (Electrochemistry)',
          subtopics: ['ফ্যারাডের তড়িৎ বিশ্লেষণ সূত্র', 'তড়িৎ রাসায়নিক কোষ ও প্রমাণ বিভব (E°)', 'নার্নস্ট সমীকরণ ও ব্যাটারি (লিথিয়াম আয়ন)', 'ক্ষয় ও ফুয়েল সেল'],
          formulas: ['W = Z I t', 'E_cell = E°_cell - (0.0591/n) log Q', 'ΔG° = - n F E°'],
          priority: 'High',
          universities: ['univ-buet', 'univ-du', 'univ-medical', 'univ-cu', 'univ-gst']
        }
      ]
    },
    math_1st: {
      subject: 'উচ্চতর গণিত ১ম পত্র (Higher Math 1st Paper)',
      short: 'গণিত ১ম',
      color: '#7c3aed',
      chapters: [
        {
          no: 1,
          name: 'ম্যাট্রিক্স ও নির্ণায়ক (Matrices & Determinants)',
          subtopics: ['ম্যাট্রিক্সের গুণ ও ইনভার্স ম্যাট্রিক্স', 'নির্ণায়কের ধর্মাবলি ও মান বিস্তার', 'ক্রেমারের নিয়মে সমাধান', 'ব্যতিক্রমী ও প্রতিসম ম্যাট্রিক্স'],
          formulas: ['A⁻¹ = (1 / |A|) adj(A)', '|AB| = |A||B|', 'x = D_x / D'],
          priority: 'High',
          universities: ['univ-buet', 'univ-du', 'univ-cu', 'univ-ru', 'univ-gst']
        },
        {
          no: 3,
          name: 'সরলরেখা (Straight Lines)',
          subtopics: ['স্থানাঙ্ক রূপান্তর ও ক্ষেত্রফল', 'বিভিন্ন আকারের সরলরেখার সমীকরণ', 'দুই রেখার ছেদবিন্দু ও মধ্যবর্তী কোণ', 'বিন্দু থেকে রেখার লম্ব দূরত্ব ও সমদ্বিখণ্ডক'],
          formulas: ['y - y₁ = m(x - x₁)', 'tanθ = |(m₁ - m₂)/(1 + m₁m₂)|', 'd = |ax₁ + by₁ + c| / √(a² + b²)'],
          priority: 'Critical',
          universities: ['univ-buet', 'univ-du', 'univ-cu', 'univ-ru', 'univ-gst']
        },
        {
          no: 4,
          name: 'বৃত্ত (Circles)',
          subtopics: ['বৃত্তের সাধারণ সমীকরণ ও কেন্দ্র-ব্যাসার্ধ', 'অক্ষকে স্পর্শ করার শর্ত', 'স্পর্শক ও অভিলম্বের সমীকরণ', 'স্পর্শকের দৈর্ঘ্য ও জ্যা এর মধ্যবিন্দু'],
          formulas: ['x² + y² + 2gx + 2fy + c = 0', 'r = √(g² + f² - c)', 'xx₁ + yy₁ + g(x+x₁) + f(y+y₁) + c = 0'],
          priority: 'Critical',
          universities: ['univ-buet', 'univ-du', 'univ-cu', 'univ-ru', 'univ-gst']
        },
        {
          no: 7,
          name: 'সংযুক্ত ও যৌগিক কোণের ত্রিকোণমিতি (Trigonometry)',
          subtopics: ['sin(A±B), cos(A±B) ও tan(A±B)', 'গুণফল থেকে যোগফল রূপান্তর সূত্র', 'ত্রিভুজের কোণ ও বাহুর সম্পর্ক (Sine & Cosine Rule)', 'ত্রিভুজের ক্ষেত্রফল ও অন্তর্ব্যাসার্ধ'],
          formulas: ['sin2A = 2sinA cosA', 'a/sinA = b/sinB = c/sinC = 2R', 'cosA = (b² + c² - a²) / (2bc)'],
          priority: 'High',
          universities: ['univ-buet', 'univ-du', 'univ-cu', 'univ-ru', 'univ-gst']
        },
        {
          no: 9,
          name: 'অন্তরীকরণ (Differentiation)',
          subtopics: ['মূল নিয়মে অন্তরজ ও সীমা (Limit)', 'শৃঙ্খল নিয়ম (Chain Rule) ও অব্যক্ত ফাংশন', 'পর্যায়ক্রমিক অন্তরীকরণ (Leibnitz Theorem)', 'স্পর্শক, অভিলম্ব ও চরমমান (গুরুমান/লঘুমান)'],
          formulas: ['d/dx [f(g(x))] = f\'(g(x))g\'(x)', 'f\'(x) = 0 & f\'\'(x) < 0 (Max)', 'lim_{x→0} sinx / x = 1'],
          priority: 'Critical',
          universities: ['univ-buet', 'univ-du', 'univ-cu', 'univ-ru', 'univ-gst']
        },
        {
          no: 10,
          name: 'যোগজীকরণ (Integration)',
          subtopics: ['অনির্দিষ্ট যোগজ ও প্রতিস্থাপন পদ্ধতি', 'অংশক্রমে যোগজীকরণ (UV সূত্র)', 'নির্দিষ্ট যোগজ ও তার ধর্মাবলি', 'বক্ররেখা দ্বারা আবদ্ধ ক্ষেত্রফল নির্ণয়'],
          formulas: ['∫ u v dx = u∫v dx - ∫[u\'∫v dx]dx', '∫ dx / (x² + a²) = 1/a tan⁻¹(x/a)', 'Area = ∫ (y₁ - y₂) dx'],
          priority: 'Critical',
          universities: ['univ-buet', 'univ-du', 'univ-cu', 'univ-ru', 'univ-gst']
        }
      ]
    },
    math_2nd: {
      subject: 'উচ্চতর গণিত ২য় পত্র (Higher Math 2nd Paper)',
      short: 'গণিত ২য়',
      color: '#9333ea',
      chapters: [
        {
          no: 3,
          name: 'জটিল সংখ্যা (Complex Numbers)',
          subtopics: ['জটিল সংখ্যার মডুলাস ও আর্গুমেন্ট', 'এককের ঘনমূল (ω) ও ধর্ম', 'ডিময়ভারের উপপাদ্য (De Moivre\'s)', 'বর্গমূল ও সঞ্চারপথের সমীকরণ'],
          formulas: ['z = r e^(iθ)', '1 + ω + ω² = 0', 'ω³ = 1', '|z - z₁| = k'],
          priority: 'Critical',
          universities: ['univ-buet', 'univ-du', 'univ-cu', 'univ-ru', 'univ-gst']
        },
        {
          no: 4,
          name: 'বহুপদী ও বহুপদী সমীকরণ (Polynomials)',
          subtopics: ['দ্বিঘাত সমীকরণের মূলের প্রকৃতি ও নিশ্চয়ক', 'মূল ও সহগের সম্পর্ক', 'সাধারণ মূল থাকার শর্ত', 'ত্রিঘাত সমীকরণ ও মূল রূপান্তর'],
          formulas: ['D = b² - 4ac', 'α + β = -b/a', 'αβ = c/a', 'α + β + γ = -b/a'],
          priority: 'High',
          universities: ['univ-buet', 'univ-du', 'univ-cu', 'univ-ru', 'univ-gst']
        },
        {
          no: 6,
          name: 'কণিক (Conics)',
          subtopics: ['পরাবৃত্তের সমীকরণ, শীর্ষ, উপকেন্দ্র ও নিয়ামক', 'উপবৃত্তের উৎকেন্দ্রিকতা (e < 1) ও উপকেন্দ্রিক লম্ব', 'অধিবৃত্তের সমীকরণ ও অসীমমুখী স্পর্শক', 'কণিকের সাধারণ সমীকরণ সনাক্তকরণ'],
          formulas: ['y² = 4ax', 'x²/a² + y²/b² = 1 (b² = a²(1 - e²))', 'x²/a² - y²/b² = 1 (b² = a²(e² - 1))'],
          priority: 'Critical',
          universities: ['univ-buet', 'univ-du', 'univ-cu', 'univ-ru', 'univ-gst']
        },
        {
          no: 7,
          name: 'বিপরীত ত্রিকোণমিতিক ফাংশন ও সমীকরণ (Inverse Trig)',
          subtopics: ['মুখ্য মান ও বিপরীত ফাংশনের যোগ-বিয়োগ সূত্র', '2tan⁻¹x রূপান্তর', 'সাধারণ ত্রিকোণমিতিক সমীকরণ সমাধান'],
          formulas: ['tan⁻¹x + tan⁻¹y = tan⁻¹((x+y)/(1-xy))', 'sinθ = 0 => θ = nπ', 'cosθ = 0 => θ = (2n+1)π/2'],
          priority: 'High',
          universities: ['univ-buet', 'univ-du', 'univ-cu', 'univ-ru', 'univ-gst']
        },
        {
          no: 8,
          name: 'স্থিতিবিদ্যা (Statics)',
          subtopics: ['বলের সামান্তরিক সূত্র ও লব্ধি', 'লামির উপপাদ্য (Lami\'s Theorem)', 'সমান্তরাল বল (সদৃশ ও অসদৃশ)', 'ভারকেন্দ্র ও সাধারণ সাম্যাবস্থা'],
          formulas: ['R = √(P² + Q² + 2PQ cosα)', 'P/sinα = Q/sinβ = R/sinγ', 'P·p = Q·q'],
          priority: 'Critical',
          universities: ['univ-buet', 'univ-du', 'univ-cu', 'univ-gst']
        },
        {
          no: 9,
          name: 'গতিবিদ্যা (Dynamics 2nd)',
          subtopics: ['উল্লম্ব তলে গতি ও খাড়া নিক্ষিপ্ত বস্তু', 'গতিসূত্রাবলি ও আপেক্ষিক বেগ', 'কণার সংঘর্ষ ও শক্তির নিত্যতা'],
          formulas: ['v = u - gt', 'h_max = u² / (2g)', 'm₁u₁ + m₂u₂ = m₁v₁ + m₂v₂'],
          priority: 'High',
          universities: ['univ-buet', 'univ-du', 'univ-cu', 'univ-gst']
        }
      ]
    },
    biology_combined: {
      subject: 'জীববিজ্ঞান ১ম ও ২য় পত্র (Biology 1st & 2nd)',
      short: 'জীববিজ্ঞান',
      color: '#16a34a',
      chapters: [
        {
          no: 1,
          paper: '১ম পত্র (উদ্ভিদবিজ্ঞান)',
          name: 'কোষ ও এর গঠন (Cell & Structure)',
          subtopics: ['কোষঝিল্লি ও ফ্লুইড মোজাইক মডেল', 'রাইবোসোম, মাইটোকন্ড্রিয়া ও ক্লোরোপ্লাস্ট', 'DNA গঠন ও রেপ্লিকেশন', 'ট্রান্সক্রিপশন ও ট্রান্সলেশন'],
          priority: 'Critical',
          universities: ['univ-medical', 'univ-du', 'univ-cu', 'univ-ru', 'univ-gst']
        },
        {
          no: 9,
          paper: '১ম পত্র (উদ্ভিদবিজ্ঞান)',
          name: 'উদ্ভিদ শারীরতত্ত্ব (Plant Physiology)',
          subtopics: ['খনিজ লবণ পরিশোষণ প্রক্রিয়া', 'প্রস্বেদন ও পত্ররন্ধ্র খোলা-বন্ধ মেকানিজম', 'সালোকসংশ্লেষণ (C3 ও C4 চক্র)', 'শ্বসন ও ক্রেবস চক্র (ATP হিসাব)'],
          priority: 'Critical',
          universities: ['univ-medical', 'univ-du', 'univ-cu', 'univ-ru', 'univ-gst']
        },
        {
          no: 3,
          paper: '২য় পত্র (প্রাণিবিজ্ঞান)',
          name: 'পরিপাক ও শোষণ (Digestion)',
          subtopics: ['মুখগহ্বর ও পাকস্থলীতে যান্ত্রিক ও রাসায়নিক পরিপাক', 'যকৃৎ ও অগ্ন্যাশয়ের ভূমিকা', 'খাদ্য উপাদানের বিশোষণ ও ক্যালরি মান'],
          priority: 'Critical',
          universities: ['univ-medical', 'univ-du', 'univ-cu', 'univ-ru', 'univ-gst']
        },
        {
          no: 4,
          paper: '২য় পত্র (প্রাণিবিজ্ঞান)',
          name: 'রক্ত ও সংবহন (Blood & Circulation)',
          subtopics: ['রক্তকণিকা ও রক্ততঞ্চন প্রক্রিয়া', 'হৃদপিণ্ডের গঠন ও কার্ডিয়াক চক্র', 'রক্তচাপ ও পেসমেকার', 'হৃদরোগ ও এনজিওপ্লাস্টি'],
          priority: 'Critical',
          universities: ['univ-medical', 'univ-du', 'univ-cu', 'univ-ru', 'univ-gst']
        },
        {
          no: 11,
          paper: '২য় পত্র (প্রাণিবিজ্ঞান)',
          name: 'জিনতত্ত্ব ও বিবর্তন (Genetics)',
          subtopics: ['মেন্ডেলের ১ম ও ২য় সূত্র এবং ব্যতিক্রম', 'সেক্স লিঙ্কড ডিসঅর্ডার (হিমোফিলিয়া, বর্ণান্ধতা)', 'রক্তের গ্রুপ ও Rh ফ্যাক্টর জটিলতা'],
          priority: 'Critical',
          universities: ['univ-medical', 'univ-du', 'univ-cu', 'univ-ru', 'univ-gst']
        }
      ]
    }
  },

  Commerce: {
    accounting: {
      subject: 'হিসাববিজ্ঞান ১ম ও ২য় পত্র (Accounting 1st & 2nd)',
      short: 'হিসাববিজ্ঞান',
      color: '#0d9488',
      chapters: [
        { no: 2, paper: '১ম পত্র', name: 'হিসাবের বইসমূহ (জাবেদা, খতিয়ান ও নগদান বই)', subtopics: ['৩ ঘরা নগদান বই ও বাট্টা', 'বিশেষ জাবেদা ও প্রারম্ভিক দাখিলা'], priority: 'Critical', universities: ['univ-du', 'univ-cu', 'univ-ru', 'univ-gst'] },
        { no: 4, paper: '১ম পত্র', name: 'ব্যাংক সমন্বয় বিবরণী (Bank Reconciliation)', subtopics: ['একক জের ও উভয় জের পদ্ধতি', 'অনুমোদিত ও অপরিশোধিত চেক'], priority: 'Critical', universities: ['univ-du', 'univ-cu', 'univ-ru', 'univ-gst'] },
        { no: 8, paper: '১ম পত্র', name: 'কার্যপত্র ও সমাপনী দাখিলা (Worksheet)', subtopics: ['সমন্বয় দাখিলা ও বিপরীত দাখিলা', 'কার্যপত্র প্রস্তুত প্রণালী'], priority: 'High', universities: ['univ-du', 'univ-cu', 'univ-ru', 'univ-gst'] },
        { no: 4, paper: '২য় পত্র', name: 'যৌথ মূলধনী কোম্পানির মূলধন (Share Issue)', subtopics: ['সমহার, অধিহার ও অবহারে শেয়ার বিলি', 'জব্দকৃত শেয়ার পুনঃইস্যু'], priority: 'Critical', universities: ['univ-du', 'univ-cu', 'univ-ru', 'univ-gst'] },
        { no: 6, paper: '২য় পত্র', name: 'আর্থিক বিবরণী বিশ্লেষণ (Ratio Analysis)', subtopics: ['চলতি অনুপাত ও তারল্য অনুপাত', 'মজুদ আবর্তন ও দায়-মালিকানা অনুপাত'], priority: 'Critical', universities: ['univ-du', 'univ-cu', 'univ-ru', 'univ-gst'] }
      ]
    },
    management: {
      subject: 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা (Management)',
      short: 'ব্যবস্থাপনা',
      color: '#0284c7',
      chapters: [
        { no: 2, paper: '১ম পত্র', name: 'ব্যবসায় পরিবেশ ও একমালিকানা', subtopics: ['ব্যবসায় পরিবেশের উপাদান', 'একমালিকানা কারবারের সুবিধা ও সীমাবদ্ধতা'], priority: 'High', universities: ['univ-du', 'univ-cu', 'univ-ru', 'univ-gst'] },
        { no: 4, paper: '১ম পত্র', name: 'অংশীদারি কারবার (Partnership)', subtopics: ['অংশীদারদের প্রকারভেদ ও চুক্তিপত্র', 'বিলোপসাধন প্রক্রিয়া'], priority: 'Critical', universities: ['univ-du', 'univ-cu', 'univ-ru', 'univ-gst'] },
        { no: 5, paper: '১ম পত্র', name: 'যৌথ মূলধনী কারবার (Company Org)', subtopics: ['স্মারকলিপি ও পরিমেল নিয়মাবলি', 'পাবলিক বনাম প্রাইভেট লিমিটেড কোম্পানি'], priority: 'Critical', universities: ['univ-du', 'univ-cu', 'univ-ru', 'univ-gst'] },
        { no: 1, paper: '২য় পত্র', name: 'ব্যবস্থাপনার মূলনীতি ও হেনরি ফেয়লের ১৪ নীতি', subtopics: ['ব্যবস্থাপনার স্তরসমূহ ও কার্যবলি', 'হেনরি ফেয়ল ও টেলরের অবদান'], priority: 'Critical', universities: ['univ-du', 'univ-cu', 'univ-ru', 'univ-gst'] },
        { no: 6, paper: '২য় পত্র', name: 'নেতৃত্ব ও প্রেষণা (Leadership & Motivation)', subtopics: ['ম্যাসলোর চাহিদা সোপান তত্ত্ব', 'হার্জবার্গের দ্বি-উপাদান তত্ত্ব'], priority: 'High', universities: ['univ-du', 'univ-cu', 'univ-ru', 'univ-gst'] }
      ]
    },
    finance: {
      subject: 'ফিন্যান্স, ব্যাংকিং ও বীমা (Finance)',
      short: 'ফিন্যান্স',
      color: '#8b5cf6',
      chapters: [
        { no: 3, paper: '১ম পত্র', name: 'অর্থের সময়মূল্য (Time Value of Money)', subtopics: ['বর্তমান ও ভবিষ্যৎ মূল্য নির্ণয়', 'অ্যানুইটি ও বার্ষিক কিস্তি', 'কার্যকরী সুদের হার (EAR)'], priority: 'Critical', universities: ['univ-du', 'univ-cu', 'univ-ru', 'univ-gst'] },
        { no: 5, paper: '১ম পত্র', name: 'ঝুঁকি ও মুনাফার হার (Risk & Return)', subtopics: ['পরিমিত ব্যবধান ও বিভেদাঙ্ক (CV)', 'পোর্টফোলিও ঝুঁকি ও সিএপিএম (CAPM)'], priority: 'Critical', universities: ['univ-du', 'univ-cu', 'univ-ru', 'univ-gst'] },
        { no: 8, paper: '১ম পত্র', name: 'মূলধন বাজেটিং ও বিনিয়োগ সিদ্ধান্ত', subtopics: ['পে-ব্যাক সময় (PBP)', 'নিট বর্তমান মূল্য (NPV) ও আইআরআর (IRR)'], priority: 'Critical', universities: ['univ-du', 'univ-cu', 'univ-ru', 'univ-gst'] }
      ]
    },
    english_commerce: {
      subject: 'ইংরেজি ও বাংলা (Language Mastery)',
      short: 'ভাষা ও ইংরেজি',
      color: '#ea580c',
      chapters: [
        { no: 1, paper: 'English', name: 'Grammar & Subject-Verb Agreement', subtopics: ['Prepositions & Inversion', 'Parallelism & Modifiers', 'Vocabulary & Synonyms'], priority: 'Critical', universities: ['univ-du', 'univ-cu', 'univ-ru', 'univ-gst'] },
        { no: 2, paper: 'বাংলা', name: 'বাংলা ব্যাকরণ ও প্রমিত প্রয়োগ', subtopics: ['সন্ধি, সমাস ও প্রত্যয়', 'বানান শুদ্ধি ও বাক্য রূপান্তর'], priority: 'High', universities: ['univ-du', 'univ-cu', 'univ-ru', 'univ-gst'] }
      ]
    }
  },

  Humanities: {
    bangla: {
      subject: 'বাংলা ১ম ও ২য় পত্র (Bangla 1st & 2nd)',
      short: 'বাংলা',
      color: '#0d9488',
      chapters: [
        { no: 1, paper: '১ম পত্র', name: 'গুরুত্বপূর্ণ গদ্য (অপরিচিতা, বিলাসী, রেইনকোট)', subtopics: ['মূলভাব, চরিত্র বিশ্লেষণ ও প্রেক্ষাপট', 'গুরুত্বপূর্ণ লাইন ও শব্দার্থ'], priority: 'Critical', universities: ['univ-du', 'univ-cu', 'univ-ru', 'univ-ju', 'univ-gst'] },
        { no: 2, paper: '১ম পত্র', name: 'গুরুত্বপূর্ণ পদ্য (সোনার তরী, বিদ্রোহী, তাহারই পড়ে মনে)', subtopics: ['ছন্দ, রূপক অর্থ ও রচয়িতার দর্শন', 'উদ্ধৃতি ও অন্ত্যমিল'], priority: 'Critical', universities: ['univ-du', 'univ-cu', 'univ-ru', 'univ-ju', 'univ-gst'] },
        { no: 3, paper: '২য় পত্র', name: 'বাংলা ভাষার ব্যাকরণ ও নির্মিতি', subtopics: ['উচ্চারণ ও বানানের নিয়ম', 'সমাস, উপসর্গ ও প্রকৃতি-প্রত্যয়', 'বাক্য শুদ্ধিকরণ ও পারিভাষিক শব্দ'], priority: 'Critical', universities: ['univ-du', 'univ-cu', 'univ-ru', 'univ-ju', 'univ-gst'] }
      ]
    },
    english_arts: {
      subject: 'ইংরেজি (English Mastery & Comprehension)',
      short: 'ইংরেজি',
      color: '#0284c7',
      chapters: [
        { no: 1, paper: 'Grammar', name: 'Comprehensive Grammar Rules', subtopics: ['Tense, Conditionals & Causative Verbs', 'Prepositions, Idioms & Phrases', 'Subject-Verb Agreement & Subjunctive'], priority: 'Critical', universities: ['univ-du', 'univ-cu', 'univ-ru', 'univ-ju', 'univ-gst'] },
        { no: 2, paper: 'Vocabulary', name: 'Advanced Vocabulary & Reading', subtopics: ['Synonyms & Antonyms from Context', 'Analogy & Spelling Test', 'Reading Comprehension Passages'], priority: 'Critical', universities: ['univ-du', 'univ-cu', 'univ-ru', 'univ-ju', 'univ-gst'] }
      ]
    },
    general_knowledge: {
      subject: 'সাধারণ জ্ঞান (General Knowledge & Current Affairs)',
      short: 'সাধারণ জ্ঞান',
      color: '#8b5cf6',
      chapters: [
        { no: 1, paper: 'বাংলাদেশ', name: 'বাংলাদেশের ইতিহাস, মুক্তিযুদ্ধ ও সংবিধান', subtopics: ['১৯৪৭-১৯৭১ এর ধারাবাহিক আন্দোলন', '৭ মার্চের ভাষণ ও মুক্তিযুদ্ধ সেক্টর', 'সংবিধানের প্রধান অনুচ্ছেদ ও ভৌগোলিক পরিচিতি'], priority: 'Critical', universities: ['univ-du', 'univ-cu', 'univ-ru', 'univ-ju', 'univ-gst'] },
        { no: 2, paper: 'আন্তর্জাতিক', name: 'আন্তর্জাতিক সম্পর্ক, ভূগোল ও সম্মেলন', subtopics: ['জাতিসংঘ ও বিশ্ব সংস্থা', 'গুরুত্বপূর্ণ প্রণালী, সীমান্ত ও চুক্তি', 'ভূ-রাজনীতি ও সাম্প্রতিক বৈশ্বিক ঘটনাবলী'], priority: 'Critical', universities: ['univ-du', 'univ-cu', 'univ-ru', 'univ-ju', 'univ-gst'] }
      ]
    }
  }
};

// University Metadata Master
export const UNIVERSITY_CATALOG = [
  { id: 'univ-buet', name: 'বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয় (BUET)', shortName: 'BUET', logo: '📐', group: 'Science', defaultDays: 50, examDate: '2026-12-20' },
  { id: 'univ-du', name: 'ঢাকা বিশ্ববিদ্যালয় (DU)', shortName: 'DU', logo: '🏛️', group: 'All', defaultDays: 70, examDate: '2027-01-09' },
  { id: 'univ-medical', name: 'মেডিকেল ভর্তি পরীক্ষা (MBBS/BDS)', shortName: 'Medical', logo: '🩺', group: 'Science', defaultDays: 45, examDate: '2026-12-15' },
  { id: 'univ-1792096089869', name: 'আইআইটি ও ইঞ্জিনিয়ারিং ক্লাস্টার (CKRUET)', shortName: 'CKRUET', logo: '💻', group: 'Science', defaultDays: 75, examDate: '2027-01-14' },
  { id: 'univ-cu', name: 'চট্টগ্রাম বিশ্ববিদ্যালয় (CU)', shortName: 'CU', logo: '🎓', group: 'All', defaultDays: 82, examDate: '2027-01-21' },
  { id: 'univ-ru', name: 'রাজশাহী বিশ্ববিদ্যালয় (RU)', shortName: 'RU', logo: '📚', group: 'All', defaultDays: 88, examDate: '2027-01-27' },
  { id: 'univ-ju', name: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয় (JU)', shortName: 'JU', logo: '🔬', group: 'All', defaultDays: 92, examDate: '2027-02-01' },
  { id: 'univ-gst', name: 'গুচ্ছ সাধারণ ও প্রযুক্তি (GST Cluster)', shortName: 'GST', logo: '🌐', group: 'All', defaultDays: 98, examDate: '2027-02-07' }
];

/**
 * Filter universities based on student profile (Group, GPA, Target)
 */
export function getEligibleUniversitiesForProfile(user) {
  const group = (user?.academicGroup || user?.group || 'Science').toLowerCase();
  return UNIVERSITY_CATALOG.filter(univ => {
    if (univ.group === 'All') return true;
    if (group.includes('commerce') || group.includes('business')) {
      return univ.group !== 'Science';
    }
    if (group.includes('humanities') || group.includes('arts')) {
      return univ.group !== 'Science';
    }
    return true; // Science can sit for science & general
  });
}

/**
 * Generates an adaptive 50-day (or custom days) schedule.
 * Automatically prioritizes the closest exam (65% time) and secondary targets (35% time).
 * Granularly specifies Paper 1 vs Paper 2, Chapter, and exact subtopics.
 */
export function generateAdaptiveMultiExamRoutine({
  user = {},
  selectedUnivIds = [],
  totalDays = 50,
  dailyHours = 8,
  completedTopicKeys = {}
}) {
  const group = user?.academicGroup || user?.group || 'Science';
  const groupKey = group.toLowerCase().includes('commerce')
    ? 'Commerce'
    : (group.toLowerCase().includes('arts') || group.toLowerCase().includes('humanities') ? 'Humanities' : 'Science');

  const syllabus = SYLLABUS_DATABASE[groupKey] || SYLLABUS_DATABASE.Science;
  const eligibleUnivs = getEligibleUniversitiesForProfile(user);

  // If user selected none, pick top 3 based on eligibility
  const activeUnivs = eligibleUnivs.filter(u =>
    selectedUnivIds.length > 0 ? selectedUnivIds.includes(u.id) : true
  );

  // Sort universities by pending days ascending (Closest Exam first)
  const sortedTargetVarsities = [...(activeUnivs.length > 0 ? activeUnivs : eligibleUnivs.slice(0, 3))].sort(
    (a, b) => (a.defaultDays || 60) - (b.defaultDays || 60)
  );

  const primaryVarsity = sortedTargetVarsities[0] || UNIVERSITY_CATALOG[0];
  const secondaryVarsity = sortedTargetVarsities[1] || sortedTargetVarsities[0];
  const tertiaryVarsity = sortedTargetVarsities[2] || null;

  // Flatten all chapters across all subjects for this stream
  const allFlattenedChapters = [];
  Object.entries(syllabus).forEach(([subjectKey, subjectObj]) => {
    subjectObj.chapters.forEach(ch => {
      allFlattenedChapters.push({
        subjectKey,
        subjectTitle: subjectObj.subject,
        subjectShort: subjectObj.short,
        color: subjectObj.color,
        paper: ch.paper || (subjectKey.includes('1st') ? '১ম পত্র' : '২য় পত্র'),
        chapterNo: ch.no,
        chapterName: ch.name,
        subtopics: ch.subtopics,
        formulas: ch.formulas || [],
        priority: ch.priority,
        targetUniversities: ch.universities || ['univ-buet', 'univ-du', 'univ-medical', 'univ-gst'],
        uniqueKey: `${subjectKey}_ch${ch.no}`
      });
    });
  });

  // Calculate day-by-day distribution for `totalDays`
  const dailyPlans = [];
  const primaryRatio = 0.65;
  const secondaryRatio = 0.35;

  const primaryHours = Number((dailyHours * primaryRatio).toFixed(1));
  const secondaryHours = Number((dailyHours * secondaryRatio).toFixed(1));

  for (let day = 1; day <= totalDays; day++) {
    // Round-robin selection of primary chapter and secondary chapter
    const primaryChIndex = (day - 1) % allFlattenedChapters.length;
    const secondaryChIndex = (day + 3) % allFlattenedChapters.length;

    const primaryChapter = allFlattenedChapters[primaryChIndex];
    const secondaryChapter = allFlattenedChapters[secondaryChIndex];

    // Pick 2 focused subtopics for today
    const primarySubtopics = primaryChapter.subtopics.slice(0, 2);
    const secondarySubtopics = secondaryChapter.subtopics.slice(0, 2);

    // Build unique task keys to sync with completion
    const morningKey = `day_${day}_morning_${primaryChapter.uniqueKey}`;
    const afternoonKey = `day_${day}_afternoon_${secondaryChapter.uniqueKey}`;
    const nightKey = `day_${day}_night_${primaryChapter.uniqueKey}`;

    const isMorningDone = Boolean(completedTopicKeys[morningKey]);
    const isAfternoonDone = Boolean(completedTopicKeys[afternoonKey]);
    const isNightDone = Boolean(completedTopicKeys[nightKey]);

    // Check if primary chapter is shared across secondary/tertiary varsities
    const sharedVarsities = sortedTargetVarsities.filter(v =>
      primaryChapter.targetUniversities.includes(v.id)
    ).map(v => v.shortName);

    dailyPlans.push({
      dayNumber: day,
      dayTitle: `দিন ${day} / ${totalDays}`,
      dateOffsetDays: day - 1,
      primaryFocus: {
        varsity: primaryVarsity,
        weight: `${Math.round(primaryRatio * 100)}% সময় (${primaryHours} ঘণ্টা)`,
        chapter: primaryChapter,
        subtopics: primarySubtopics,
        isShared: sharedVarsities.length > 1,
        sharedWith: sharedVarsities.filter(name => name !== primaryVarsity.shortName)
      },
      secondaryFocus: {
        varsity: secondaryVarsity,
        weight: `${Math.round(secondaryRatio * 100)}% সময় (${secondaryHours} ঘণ্টা)`,
        chapter: secondaryChapter,
        subtopics: secondarySubtopics
      },
      sessions: [
        {
          id: morningKey,
          timeSlot: 'সকাল (০৮:০০ - ১১:৩০)',
          duration: `${Math.round(primaryHours * 0.6 * 10) / 10} ঘণ্টা`,
          type: 'Primary Deep Concept & Math',
          badge: `🎯 ${primaryVarsity.shortName} প্রধান ফোকাস`,
          badgeColor: '#0d9488',
          subjectName: primaryChapter.subjectTitle,
          subjectShort: primaryChapter.subjectShort,
          paper: primaryChapter.paper,
          chapterTitle: `অধ্যায় ${primaryChapter.chapterNo}: ${primaryChapter.chapterName}`,
          taskDetails: `মৌলিক তত্ত্ব ও সূত্র সমাধান: ${primarySubtopics.join(' • ')}`,
          keyFormulas: primaryChapter.formulas.slice(0, 2),
          done: isMorningDone
        },
        {
          id: afternoonKey,
          timeSlot: 'দুপুর/বিকাল (০২:৩০ - ০৫:০০)',
          duration: `${secondaryHours} ঘণ্টা`,
          type: 'Secondary Target & Cross-Topic Drill',
          badge: `🔄 ${secondaryVarsity.shortName} ব্যালেন্সিং`,
          badgeColor: '#0284c7',
          subjectName: secondaryChapter.subjectTitle,
          subjectShort: secondaryChapter.subjectShort,
          paper: secondaryChapter.paper,
          chapterTitle: `অধ্যায় ${secondaryChapter.chapterNo}: ${secondaryChapter.chapterName}`,
          taskDetails: `টপিক ড্রিল ও কনসেপ্ট রিভিশন: ${secondarySubtopics.join(' • ')}`,
          keyFormulas: secondaryChapter.formulas.slice(0, 2),
          done: isAfternoonDone
        },
        {
          id: nightKey,
          timeSlot: 'রাত (০৮:০০ - ১১:০০)',
          duration: `${Math.round(primaryHours * 0.4 * 10) / 10} ঘণ্টা`,
          type: 'Past Question Solving & Speed Drill',
          badge: `⚡ বিগত ১০ বছরের প্রশ্নব্যাংক সলভিং`,
          badgeColor: '#7c3aed',
          subjectName: primaryChapter.subjectTitle,
          subjectShort: primaryChapter.subjectShort,
          paper: primaryChapter.paper,
          chapterTitle: `অধ্যায় ${primaryChapter.chapterNo}: ${primaryChapter.chapterName}`,
          taskDetails: `${primaryVarsity.shortName} ও অন্যান্য ভার্সিটির বিগত প্রশ্ন সমাধান ও সেলফ টেস্ট`,
          practiceGoal: 'প্রতি প্রশ্নে ৪০-৫০ সেকেন্ডে অন্তত ৩০টি প্রশ্ন সমাধান',
          done: isNightDone
        }
      ]
    });
  }

  return {
    group,
    groupKey,
    totalDays,
    dailyHours,
    primaryVarsity,
    secondaryVarsity,
    tertiaryVarsity,
    sortedTargetVarsities,
    allFlattenedChapters,
    dailyPlans
  };
}

/**
 * Computes Cross-Exam Mastery Analysis:
 * Shows how completed topics for the closest exam cross-benefit other universities.
 */
export function calculateCrossExamMasteryStats({
  user = {},
  selectedUnivIds = [],
  completedTopicKeys = {}
}) {
  const group = user?.academicGroup || user?.group || 'Science';
  const groupKey = group.toLowerCase().includes('commerce')
    ? 'Commerce'
    : (group.toLowerCase().includes('arts') || group.toLowerCase().includes('humanities') ? 'Humanities' : 'Science');

  const syllabus = SYLLABUS_DATABASE[groupKey] || SYLLABUS_DATABASE.Science;
  const eligibleUnivs = getEligibleUniversitiesForProfile(user);
  const activeUnivs = eligibleUnivs.filter(u =>
    selectedUnivIds.length > 0 ? selectedUnivIds.includes(u.id) : true
  );

  const targetVarsities = activeUnivs.length > 0 ? activeUnivs : eligibleUnivs.slice(0, 3);
  const closestVarsity = targetVarsities[0] || UNIVERSITY_CATALOG[0];

  // Map chapters with completion status and cross-crediting
  const chapterMasteryList = [];
  let totalMasteredCount = 0;
  let totalSharedCount = 0;

  Object.entries(syllabus).forEach(([subjectKey, subjectObj]) => {
    subjectObj.chapters.forEach(ch => {
      const chapterKey = `${subjectKey}_ch${ch.no}`;

      // A chapter is considered mastered if any session or milestone key matching it is completed
      const isCompleted = Object.keys(completedTopicKeys).some(k =>
        k.includes(chapterKey) && completedTopicKeys[k] === true
      );

      if (isCompleted) totalMasteredCount++;

      // Which target universities share this chapter?
      const applicableVarsities = targetVarsities.filter(v =>
        (ch.universities || []).includes(v.id)
      );

      if (applicableVarsities.length > 1) {
        totalSharedCount++;
      }

      chapterMasteryList.push({
        key: chapterKey,
        subject: subjectObj.short,
        paper: ch.paper || (subjectKey.includes('1st') ? '১ম পত্র' : '২য় পত্র'),
        chapterNo: ch.no,
        chapterName: ch.name,
        subtopics: ch.subtopics,
        formulas: ch.formulas || [],
        priority: ch.priority,
        isCompleted,
        applicableVarsities: applicableVarsities.map(v => v.shortName),
        crossExamBenefits: applicableVarsities.filter(v => v.id !== closestVarsity.id).map(v => v.shortName)
      });
    });
  });

  const totalChapters = chapterMasteryList.length;
  const overallMasteryPct = totalChapters > 0 ? Math.round((totalMasteredCount / totalChapters) * 100) : 0;
  const sharedOverlapPct = totalChapters > 0 ? Math.round((totalSharedCount / totalChapters) * 100) : 0;

  // Approximate hours saved by cross-exam syllabus synergy
  const hoursSaved = Math.round(totalMasteredCount * 4.5);

  return {
    closestVarsity,
    targetVarsities,
    chapterMasteryList,
    totalChapters,
    totalMasteredCount,
    overallMasteryPct,
    sharedOverlapPct,
    hoursSaved
  };
}

