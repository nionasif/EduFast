/* ═══════════════════════════════════════════════════════════════════════════
   mockTestGenerator.js
   Procedurally generates 5 mock tests for each of the 3 major units:
   1. Science (Ka Unit / Engineering) - 5 tests × 100 Qs (Physics, Chemistry, Math, Biology, English)
   2. Arts (Kha Unit) - 5 tests × 100 Qs (Bangla, English, General Knowledge)
   3. Commerce (Ga Unit) - 5 tests × 100 Qs (Accounting, Business Studies, Finance/ICT, Bangla, English)
   Total: 15 mock tests, each containing exactly 100 high-quality questions.
═══════════════════════════════════════════════════════════════════════════ */

// A simple helper to map templates into standard format based on testIndex (1 to 5)
function getQuestion(template, t, idPrefix, qIndex) {
  return {
    id: `${idPrefix}-q${qIndex}`,
    type: "mcq",
    question: typeof template.q === 'function' ? template.q(t) : template.q,
    options: typeof template.o === 'function' ? template.o(t) : template.o,
    correct: typeof template.c === 'function' ? template.c(t) : template.c,
    explanation: typeof template.e === 'function' ? template.e(t) : template.e
  };
}

// ─────────────────────────────────────────────────────────────────────────
// 1. PHYSICS TEMPLATES (20 Items)
// ─────────────────────────────────────────────────────────────────────────
const physicsTemplates = [
  {
    q: (t) => `একটি বস্তুর ভরবেগ ${t * 10}% বৃদ্ধি করা হলে এর গতিশক্তি কত শতাংশ বৃদ্ধি পাবে? (If the momentum of a body is increased by ${t * 10}%, what is the percentage increase in its kinetic energy?)`,
    o: (t) => {
      const p = 1 + (t * 10) / 100;
      const ke = Math.round((p * p - 1) * 100);
      return [`${ke}%`, `${ke + 15}%`, `${ke - 10}%`, `${t * 20}%`];
    },
    c: (t) => 0,
    e: (t) => `গতিশক্তি E_k = p² / 2m. So, if momentum increases by x%, new momentum is (1 + x/100)p. New KE increases by ((1 + x/100)² - 1) * 100%.`
  },
  {
    q: (t) => `একটি সরল দোলকের দৈর্ঘ্য ${t * 4} গুণ করা হলে তার দোলনকাল কত গুণ হবে? (If the length of a simple pendulum is multiplied by ${t * 4}, its time period is multiplied by how many times?)`,
    o: (t) => {
      const times = Math.sqrt(t * 4);
      return [`${times} গুণ`, `${t * 2} গুণ`, `1/${times} গুণ`, `${t * 4} গুণ`];
    },
    c: (t) => 0,
    e: (t) => `দোলনকাল T = 2π√(L/g). So T ∝ √L. Length L becomes ${t * 4}L, so time period T becomes √(${t * 4}) = ${Math.sqrt(t * 4)} times.`
  },
  {
    q: (t) => `নিচের কোনটির স্থিতিস্থাপকতা সবচেয়ে বেশি? (Which of the following has the highest elasticity?)`,
    o: (t) => ["ইস্পাত (Steel)", "রবার (Rubber)", "তামা (Copper)", "কাঁচ (Glass)"],
    c: (t) => 0,
    e: (t) => `ইস্পাতের ইয়ং-এর গুণাঙ্ক (Young's Modulus) রবার বা তামার চেয়ে বেশি, তাই ইস্পাতের স্থিতিস্থাপকতা সবচেয়ে বেশি।`
  },
  {
    q: (t) => `একটি তরঙ্গের কম্পাঙ্ক ${t * 100} Hz এবং তরঙ্গদৈর্ঘ্য ${(0.5 + t * 0.1).toFixed(2)} m হলে তরঙ্গের বেগ কত? (If the frequency of a wave is ${t * 100} Hz and its wavelength is ${(0.5 + t * 0.1).toFixed(2)} m, what is the wave velocity?)`,
    o: (t) => {
      const v = Math.round(t * 100 * (0.5 + t * 0.1));
      return [`${v} m/s`, `${v + 50} m/s`, `${v - 20} m/s`, `${v * 2} m/s`];
    },
    c: (t) => 0,
    e: (t) => `Using formula: v = f * λ.`
  },
  {
    q: (t) => `কার্নো ইঞ্জিনের উৎসের তাপমাত্রা ${(500 + t * 50)} K এবং গ্রাহকের তাপমাত্রা ${(300 + t * 20)} K হলে এর কর্মদক্ষতা কত? (Source temp of a Carnot engine is ${(500 + t * 50)} K and sink temp is ${(300 + t * 20)} K. What is its efficiency?)`,
    o: (t) => {
      const t1 = 500 + t * 50;
      const t2 = 300 + t * 20;
      const eff = Math.round((1 - t2 / t1) * 100);
      return [`${eff}%`, `${eff + 5}%`, `${eff - 8}%`, `${eff + 10}%`];
    },
    c: (t) => 0,
    e: (t) => `কর্মদক্ষতা η = (1 - T2/T1) * 100%`
  },
  {
    q: (t) => `দুটি আধানের মধ্যবর্তী দূরত্ব ${t + 1} গুণ করা হলে কুলম্ব বল পূর্বের বলের কত গুণ হবে? (If the distance between two charges is multiplied by ${t + 1}, Coulomb force becomes how many times?)`,
    o: (t) => {
      const div = (t + 1) * (t + 1);
      return [`1/${div} গুণ`, `${t + 1} গুণ`, `${div} গুণ`, `1/${t + 1} গুণ`];
    },
    c: (t) => 0,
    e: (t) => `Coulomb force is inversely proportional to square of distance (F ∝ 1/d²).`
  },
  {
    q: (t) => `একটি সমান্তরাল পাত ধারকের পাত দুটির মধ্যবর্তী দূরত্ব অর্ধেক এবং ক্ষেত্রফল ${t} গুণ করা হলে ধারকত্ব কত গুণ হবে? (If distance between plates of a capacitor is halved and area is multiplied by ${t}, capacitance becomes how many times?)`,
    o: (t) => [`${t * 2} গুণ`, `${t} গুণ`, `${t / 2} গুণ`, `4 গুণ`],
    c: (t) => 0,
    e: (t) => `धारकत्व C = εA/d. If A' = ${t}A and d' = d/2, then C' = ε(${t}A)/(d/2) = ${t * 2}C.`
  },
  {
    q: (t) => `রোধের সমান্তরাল সমবায়ে কোন রাশিটি ধ্রুবক থাকে? (Which quantity remains constant in parallel combination of resistors?)`,
    o: (t) => ["বিভব পার্থক্য (Potential Difference)", "তড়িৎ প্রবাহ (Current)", "রোধ (Resistance)", "ক্ষমতা (Power)"],
    c: (t) => 0,
    e: (t) => `সমান্তরাল সমবায়ে প্রতিটি রোধের দুই প্রান্তের বিভব পার্থক্য সমান থাকে।`
  },
  {
    q: (t) => `একটি পরিবাহীর দৈর্ঘ্য টেনে দ্বিগুণ করা হলে এর রোধ পূর্বের রোধের কত গুণ হবে? (If the length of a conductor is pulled to double, its resistance becomes how many times?)`,
    o: (t) => ["৪ গুণ (4 times)", "২ গুণ (2 times)", "৮ গুণ (8 times)", "অপরিবর্তিত (Unchanged)"],
    c: (t) => 0,
    e: (t) => `দৈর্ঘ্য টেনে দ্বিগুণ করলে ক্ষেত্রফল অর্ধেক হয়ে যায়। R = ρ*L/A সূত্রানুযায়ী রোধ ৪ গুণ হয়।`
  },
  {
    q: (t) => `ফটোতড়িৎ ক্রিয়ায় নির্গত ইলেকট্রনের সর্বোচ্চ গতিশক্তি আলোর কোন গুণের ওপর নির্ভর করে? (Max kinetic energy of photoelectrons depends on which property of light?)`,
    o: (t) => ["কম্পাঙ্ক (Frequency)", "তীব্রতা (Intensity)", "বেগ (Velocity)", "উৎস (Source)"],
    c: (t) => 0,
    e: (t) => `ফটোতড়িৎ তড়িৎদ্বারে আলোর কম্পাঙ্ক (Frequency) বাড়লে গতিশক্তি বাড়ে। তীব্রতা কেবল ইলেকট্রন প্রবাহের হার নিয়ন্ত্রণ করে।`
  },
  {
    q: (t) => `আইনস্টাইনের ভর-শক্তি সমীকরণটি কী? (What is Einstein's mass-energy equation?)`,
    o: (t) => ["E = mc²", "E = hν", "E = pc", "E = 1/2 mv²"],
    c: (t) => 0,
    e: (t) => `Einstein's mass-energy relationship is E = mc².`
  },
  {
    q: (t) => `নিচের কোন বলটির পাল্লা সবচেয়ে কম? (Which of the following forces has the shortest range?)`,
    o: (t) => ["সবল নিউক্লীয় বল (Strong nuclear force)", "দুর্বল নিউক্লীয় বল (Weak nuclear force)", "মহাকর্ষ বল (Gravitational force)", "তাড়িতচৌম্বক বল (Electromagnetic force)"],
    c: (t) => 1,
    e: (t) => `দুর্বল নিউক্লীয় বলের পাল্লা সবচেয়ে কম (প্রায় 10⁻¹⁸ m)। সবল নিউক্লীয় বলের পাল্লা 10⁻¹⁵ m।`
  },
  {
    q: (t) => `একটি উত্তল লেন্সের ফোকাস দূরত্ব ${t * 10} cm হলে লেন্সের ক্ষমতা কত? (If the focal length of a convex lens is ${t * 10} cm, what is the power of the lens?)`,
    o: (t) => {
      const p = (100 / (t * 10)).toFixed(2);
      return [`+${p} D`, `-${p} D`, `+${t} D`, `-${t} D`];
    },
    c: (t) => 0,
    e: (t) => `লেন্সের ক্ষমতা P = 100/f (cm) Dioptre. উত্তল লেন্সের ক্ষমতা ধনাত্মক (+)।`
  },
  {
    q: (t) => `মহাকাশে একটি সরল দোলকের দোলনকাল কত? (What is the time period of a simple pendulum in space?)`,
    o: (t) => ["অসীম (Infinite)", "শূন্য (Zero)", "১ সেকেন্ড", "২ সেকেন্ড"],
    c: (t) => 0,
    e: (t) => `মহাকাশে মহাকর্ষীয় ত্বরণ g = 0. T = 2π√(L/g) সূত্রানুযায়ী দোলনকাল অসীম হবে।`
  },
  {
    q: (t) => `শব্দের তীব্রতার একক কী? (What is the unit of intensity of sound?)`,
    o: (t) => ["W/m²", "dB", "Watt", "Hz"],
    c: (t) => 0,
    e: (t) => `শব্দের তীব্রতার একক W/m² (Watt per square meter)। ডেসিবেল (dB) হলো তীব্রতা স্তরের একক।`
  },
  {
    q: (t) => `পৃথিবী পৃষ্ঠে মুক্তিবেগ কত? (What is the escape velocity on the surface of the Earth?)`,
    o: (t) => ["11.2 km/s", "11.2 m/s", "9.8 km/s", "8.0 km/s"],
    c: (t) => 0,
    e: (t) => `Earth surface escape velocity v_e = √(2GM/R) ≈ 11.2 km/s.`
  },
  {
    q: (t) => `আদর্শ গ্যাসের ক্ষেত্রে অণুর গড় গতিশক্তি নিচের কোনটির সমানুপাতিক? (For an ideal gas, average kinetic energy of molecules is proportional to what?)`,
    o: (t) => ["পরম তাপমাত্রা (Absolute Temperature)", "চাপ (Pressure)", "আয়তন (Volume)", "ঘনত্ব (Density)"],
    c: (t) => 0,
    e: (t) => `গড় গতিশক্তি E = 3/2 RT. সুতরাং এটি পরম তাপমাত্রার (T) সমানুপাতিক।`
  },
  {
    q: (t) => `কৈশিক নলে তরলের আরোহণ তরলের কোন গুণের ওপর নির্ভর করে? (Capillary rise of liquid depends on which property of liquid?)`,
    o: (t) => ["পৃষ্ঠটান (Surface Tension)", "সান্দ্রতা (Viscosity)", "ঘনত্ব (Density)", "স্থিতিস্থাপকতা (Elasticity)"],
    c: (t) => 0,
    e: (t) => `কৈশিক আরোহণের কারণ হলো তরলের পৃষ্ঠটান ও স্পর্শকোণ।`
  },
  {
    q: (t) => `নিচের কোনটি ভেক্টর রাশি? (Which of the following is a vector quantity?)`,
    o: (t) => ["তড়িৎ প্রাবল্য (Electric Field Intensity)", "তড়িৎ বিভব (Electric Potential)", "তড়িৎ আধান (Electric Charge)", "রোধ (Resistance)"],
    c: (t) => 0,
    e: (t) => `তড়িৎ প্রাবল্যের মান ও দিক উভয়ই আছে, তাই এটি ভেক্টর। বিভব, আধান, ও রোধ স্কেলার রাশি।`
  },
  {
    q: (t) => `একটি কণা ${t * 2} m ব্যাসার্ধের বৃত্তাকার পথে প্রতি মিনিটে ${t * 10} বার আবর্তন করে। এর কৌণিক বেগ কত? (A particle rotates ${t * 10} times per minute in a circle of radius ${t * 2} m. What is its angular velocity?)`,
    o: (t) => {
      const w = ((t * 10 * 2 * Math.PI) / 60).toFixed(2);
      return [`${w} rad/s`, `${(w * 2).toFixed(2)} rad/s`, `${(w / 2).toFixed(2)} rad/s`, `${w} m/s`];
    },
    c: (t) => 0,
    e: (t) => `Angular velocity ω = 2πN / t. Here N = ${t * 10}, t = 60s.`
  }
];

// ─────────────────────────────────────────────────────────────────────────
// 2. CHEMISTRY TEMPLATES (20 Items)
// ─────────────────────────────────────────────────────────────────────────
const chemistryTemplates = [
  {
    q: (t) => `${t * 2} M H₂SO₄ দ্রবণের নরমালিটি কত? (What is the normality of a ${t * 2} M H₂SO₄ solution?)`,
    o: (t) => [`${t * 4} N`, `${t * 2} N`, `${t * 1} N`, `${t * 8} N`],
    c: (t) => 0,
    e: (t) => `Normality = Molarity * Acidity/Basicity. For H₂SO₄, basicity is 2. So Normality = Molarity * 2.`
  },
  {
    q: (t) => `কোন অরবিটালের শক্তি সবচেয়ে কম? (Which orbital has the lowest energy?)`,
    o: (t) => ["3d", "4s", "4p", "5s"],
    c: (t) => 1,
    e: (t) => `According to (n+l) rule: for 3d (3+2=5), for 4s (4+0=4). Lowest (n+l) value means lower energy. So 4s fills before 3d.`
  },
  {
    q: (t) => `মিথেন (CH₄) অণুতে কার্বনের কোন সংকরণ ঘটে? (Which hybridization occurs in Carbon of methane CH₄ molecule?)`,
    o: (t) => ["sp³", "sp²", "sp", "dsp²"],
    c: (t) => 0,
    e: (t) => `CH₄ has 4 sigma bonds and 0 lone pairs. Steric number is 4, which means sp³ hybridization.`
  },
  {
    q: (t) => `নিচের কোনটি জলীয় দ্রবণে সবচেয়ে শক্তিশালী অম্ল? (Which of the following is the strongest acid in aqueous solution?)`,
    o: (t) => ["HClO₄", "HNO₃", "H₂SO₄", "HCl"],
    c: (t) => 0,
    e: (t) => `Perchloric acid (HClO₄) is considered the strongest mineral acid due to high oxidation state of Chlorine (+7).`
  },
  {
    q: (t) => `পানির pH এর মান কত হলে তা পানের অযোগ্য হয়? (At what pH value water becomes undrinkable?)`,
    o: (t) => ["< 4.5 বা > 9.5", "7", "6.5 - 8.5", "8"],
    c: (t) => 0,
    e: (t) => `Standard drinking water pH should be between 6.5 and 8.5. Extreme pH values (<4.5 or >9.5) are toxic.`
  },
  {
    q: (t) => `স্থির তাপমাত্রায় গ্যাসের চাপ অর্ধেক করা হলে তার আয়তন কত গুণ হবে? (If pressure of a gas is halved at constant temperature, its volume becomes how many times?)`,
    o: (t) => ["২ গুণ (2 times)", "অর্ধেক (Half)", "৪ গুণ (4 times)", "পরিবর্তন হবে না"],
    c: (t) => 0,
    e: (t) => `According to Boyle's Law, P₁V₁ = P₂V₂. Volume is inversely proportional to pressure. Halving pressure doubles volume.`
  },
  {
    q: (t) => `কোন গ্যাসটির ব্যাপন হার সবচেয়ে বেশি? (Which gas has the highest diffusion rate?)`,
    o: (t) => ["H₂", "He", "CH₄", "CO₂"],
    c: (t) => 0,
    e: (t) => `According to Graham's law, rate of diffusion is inversely proportional to square root of molecular mass. H₂ has lowest molecular mass (2 g/mol).`
  },
  {
    q: (t) => `প্রমাণ তাপমাত্রায় ও চাপে (STP) এক মোল যেকোনো গ্যাসের আয়তন কত? (What is the volume of 1 mole of any gas at STP?)`,
    o: (t) => ["22.4 L", "24.8 L", "11.2 L", "22.4 mL"],
    c: (t) => 0,
    e: (t) => `Standard molar volume of ideal gas at STP (0°C and 1 atm) is 22.4 Liters.`
  },
  {
    q: (t) => `অ্যালকেনের সাধারণ সংকেত কোনটি? (What is the general formula of alkanes?)`,
    o: (t) => ["C_nH_2n+2", "C_nH_2n", "C_nH_2n-2", "C_nH_2n+1OH"],
    c: (t) => 0,
    e: (t) => `Alkanes: C_nH_2n+2, Alkenes: C_nH_2n, Alkynes: C_nH_2n-2.`
  },
  {
    q: (t) => `টলেন বিকারক নিচের কোনটির সাথে সিলভার দর্পণ তৈরি করে? (Tollens' reagent forms a silver mirror with which of the following?)`,
    o: (t) => ["অ্যালডিহাইড (Aldehyde)", "কিটোন (Ketone)", "অ্যালকোহল (Alcohol)", "ইথার (Ether)"],
    c: (t) => 0,
    e: (t) => `Aldehydes reduce Tollens' reagent [Ag(NH₃)₂]⁺ to metallic silver, forming a silver mirror. Ketones do not respond.`
  },
  {
    q: (t) => `লোহার মরিচা পড়ার জন্য কোন দুটি উপাদানের উপস্থিতি আবশ্যক? (Which two components are required for rusting of iron?)`,
    o: (t) => ["অক্সিজেন ও পানি (Oxygen & Water)", "কার্বন ও নাইট্রোজেন", "কেবল পানি", "কেবল অক্সিজেন"],
    c: (t) => 0,
    e: (t) => `Rusting is electrochemical oxidation of iron in presence of water and oxygen: Fe + O₂ + H₂O → Fe₂O₃·xH₂O.`
  },
  {
    q: (t) => `সোডিয়াম ক্লোরাইডের গলনাঙ্ক কত? (What is the melting point of Sodium Chloride NaCl?)`,
    o: (t) => ["801 °C", "100 °C", "1500 °C", "357 °C"],
    c: (t) => 0,
    e: (t) => `NaCl is a strong ionic compound with a high melting point of approximately 801 °C.`
  },
  {
    q: (t) => `নিচের কোনটি জারণ-বিজারণ বিক্রিয়া নয়? (Which of the following is NOT a redox reaction?)`,
    o: (t) => ["প্রশমন বিক্রিয়া (Neutralization)", "দহন বিক্রিয়া (Combustion)", "প্রতিস্থাপন বিক্রিয়া (Substitution)", "সংযোজন বিক্রিয়া (Addition)"],
    c: (t) => 0,
    e: (t) => `Acid-base neutralization reactions are double displacement reactions and do not involve change in oxidation numbers.`
  },
  {
    q: (t) => `রক্তের পিএইচ (pH) বাফার সিস্টেম মূলত কোনটি দ্বারা নিয়ন্ত্রিত হয়? (Which buffer system主要是 controls the pH of blood?)`,
    o: (t) => ["বাইকার্বনেট বাফার (Bicarbonate buffer)", "ফসফেট বাফার", "প্রোটিন বাফার", "অ্যাসিটেট বাফার"],
    c: (t) => 0,
    e: (t) => `Carbonic acid-bicarbonate (H₂CO₃ / HCO₃⁻) is the primary buffer system that maintains blood pH around 7.4.`
  },
  {
    q: (t) => `সবচেয়ে নিষ্ক্রিয় গ্যাস কোনটি? (Which of the following is the most inert gas?)`,
    o: (t) => ["হিলিয়াম (He)", "আর্গন (Ar)", "ক্রিপ্টন (Kr)", "জেনন (Xe)"],
    c: (t) => 0,
    e: (t) => `Helium has the highest ionization energy and the most stable 1s² configuration, making it extremely inert.`
  },
  {
    q: (t) => `লুকাশ বিকারক দিয়ে কোন যৌগগুলো সনাক্ত করা হয়? (Lucas reagent is used to identify which compounds?)`,
    o: (t) => ["অ্যালকোহল (Alcohols)", "কার্বক্সিলিক অ্যাসিড", "অ্যালডিহাইড", "ফেনল"],
    c: (t) => 0,
    e: (t) => `Lucas reagent (anhydrous ZnCl₂ + conc. HCl) differentiates primary, secondary, and tertiary alcohols based on turbidity time.`
  },
  {
    q: (t) => `ব্রোঞ্জ তৈরিতে তামার (Cu) সাথে কোনটি মেশানো হয়? (What is mixed with Copper to make Bronze?)`,
    o: (t) => ["টিন (Sn)", "দস্তা (Zn)", "নিকেল (Ni)", "লোহা (Fe)"],
    c: (t) => 0,
    e: (t) => `Bronze is an alloy of Copper (Cu) and Tin (Sn). Brass is an alloy of Copper (Cu) and Zinc (Zn).`
  },
  {
    q: (t) => `কাদানে গ্যাসের প্রধান রাসায়নিক উপাদান কী? (What is the main chemical component of tear gas?)`,
    o: (t) => ["ক্লোরোপিক্রিন (Chloropicrin)", "ফসজিন", "মাস্টার্ড গ্যাস", "ক্লোরোফর্ম"],
    c: (t) => 0,
    e: (t) => `Tear gas contains chloropicrin (CCl₃NO₂), which acts as a powerful lachrymatory agent.`
  },
  {
    q: (t) => `পানির অস্থায়ী ক্ষরতার জন্য দায়ী কোনটি? (Which is responsible for temporary hardness of water?)`,
    o: (t) => ["ক্যালসিয়াম বাইকার্বনেট (Ca(HCO₃)₂)", "ক্যালসিয়াম ক্লোরাইড (CaCl₂)", "ম্যাগনেসিয়াম সালফেট (MgSO₄)", "সোডিয়াম কার্বনেট (Na₂CO₃)"],
    c: (t) => 0,
    e: (t) => `Temporary hardness is caused by dissolved bicarbonate minerals (calcium and magnesium bicarbonates) which can be removed by boiling.`
  },
  {
    q: (t) => `ক্ষারকীয় অম্লত্ব সবচেয়ে বেশি নিচের কোন যৌগের? (Which of the following base has the highest acidity?)`,
    o: (t) => ["Al(OH)₃", "Ca(OH)₂", "NaOH", "NH₄OH"],
    c: (t) => 0,
    e: (t) => `Acidity of a base depends on the number of OH⁻ ions it can release. Al(OH)₃ can release 3 OH⁻ ions.`
  }
];

// ─────────────────────────────────────────────────────────────────────────
// 3. MATHEMATICS TEMPLATES (20 Items)
// ─────────────────────────────────────────────────────────────────────────
const mathematicsTemplates = [
  {
    q: (t) => `যদি A = [1, ${t}; 0, 1] হয়, তবে A² এর মান কত? (If A = [1, ${t}; 0, 1], what is the value of A²?)`,
    o: (t) => {
      const v = t * 2;
      return [[`[1, ${v}; 0, 1]`], [`[1, ${t * t}; 0, 1]`], [`[2, ${t}; 0, 2]`], [`[1, 0; 0, 1]`]];
    },
    c: (t) => 0,
    e: (t) => `Matrix multiplication: A² = [1, t; 0, 1] * [1, t; 0, 1] = [1, 2t; 0, 1].`
  },
  {
    q: (t) => `y = x³ - 3x + 5 বক্ররেখার কোন বিন্দুতে স্পর্শক x-অক্ষের সমান্তরাল? (At which points of y = x³ - 3x + 5 the tangent is parallel to the x-axis?)`,
    o: (t) => ["x = ±1", "x = 0, 1", "x = ±2", "x = ±√3"],
    c: (t) => 0,
    e: (t) => `Parallel to x-axis means dy/dx = 0. dy/dx = 3x² - 3 = 0 => x² = 1 => x = ±1.`
  },
  {
    q: (t) => `y² = ${t * 4}x পরাবৃত্তের উপকেন্দ্রের স্থানাঙ্ক কত? (What is the coordinate of the focus of the parabola y² = ${t * 4}x?)`,
    o: (t) => [`(${t}, 0)`, `(0, ${t})`, `(-${t}, 0)`, `(${t * 2}, 0)`],
    c: (t) => 0,
    e: (t) => `Equation y² = 4ax has focus at (a, 0). Here 4a = ${t * 4} => a = ${t}.`
  },
  {
    q: (t) => `10 টি বস্তুর মধ্যে 3 টি একই প্রকার। বস্তুগুলোকে কত উপায়ে সাজানো যায়? (Out of 10 objects, 3 are identical. How many ways can they be arranged?)`,
    o: (t) => ["10! / 3!", "10! * 3!", "10P3", "10C3"],
    c: (t) => 0,
    e: (t) => `Number of permutations with identical items: n! / (p!q!r!). Here 10! / 3!.`
  },
  {
    q: (t) => `দুটি ছক্কা একসাথে নিক্ষেপ করলে সমষ্টি ${t + 5} পাওয়ার সম্ভাবনা কত? (If two dice are thrown together, what is the probability of getting a sum of ${t + 5}?)`,
    o: (t) => {
      const sum = t + 5;
      let count = 0;
      for (let i = 1; i <= 6; i++) {
        for (let j = 1; j <= 6; j++) {
          if (i + j === sum) count++;
        }
      }
      return [`${count}/36`, `${count + 1}/36`, `${count - 1}/36`, `1/6`];
    },
    c: (t) => 0,
    e: (t) => `Total outcomes is 36. Favorable outcomes depend on permutations summing to the requested target.`
  },
  {
    q: (t) => `∫ (from 0 to ${t}) 2x dx এর মান কত? (What is the value of ∫ (from 0 to ${t}) 2x dx?)`,
    o: (t) => [`${t * t}`, `${t}`, `${2 * t}`, `${t * t * t}`],
    c: (t) => 0,
    e: (t) => `Integration of 2x is x². Limit from 0 to ${t} gives ${t}² - 0 = ${t * t}.`
  },
  {
    q: (t) => `যদি log_x (${t * t}) = 2 হয়, তবে x এর ধনাত্মক মান কত? (If log_x (${t * t}) = 2, what is the positive value of x?)`,
    o: (t) => [`${t}`, `${t * t}`, `2`, `${t / 2}`],
    c: (t) => 0,
    e: (t) => `log_x (t²) = 2 => x² = t² => x = t (since positive value requested).`
  },
  {
    q: (t) => `(2x + y)⁵ বিস্তৃতিতে মোট পদের সংখ্যা কত? (What is the total number of terms in expansion of (2x + y)⁵?)`,
    o: (t) => ["6", "5", "10", "32"],
    c: (t) => 0,
    e: (t) => `Total terms in (a+b)^n expansion is always (n + 1). Here 5 + 1 = 6.`
  },
  {
    q: (t) => `y = ${t}x + 5 এবং y = 2x - 3 রেখাদ্বয় পরস্পর লম্ব হলে ${t} এর মান কত? (If the lines y = ${t}x + 5 and y = 2x - 3 are perpendicular, what is the value of ${t}?)`,
    o: (t) => ["-0.5", "0.5", "-2", "2"],
    c: (t) => 0,
    e: (t) => `Perpendicular lines have product of slopes equal to -1 (m1 * m2 = -1). So ${t} * 2 = -1 => slope = -0.5.`
  },
  {
    q: (t) => `একটি বৃত্তের ব্যাসার্ধ ${t * 2} একক এবং কেন্দ্রের স্থানাঙ্ক (0,0) হলে বৃত্তের সমীকরণ কী? (Radius of a circle is ${t * 2} and center is (0,0). What is its equation?)`,
    o: (t) => {
      const r2 = (t * 2) * (t * 2);
      return [`x² + y² = ${r2}`, `x² + y² = ${t * 2}`, `x² - y² = ${r2}`, `x² + y² = ${t}`];
    },
    c: (t) => 0,
    e: (t) => `Circle equation centered at origin: x² + y² = r². Here r = ${t * 2} => r² = ${ (t * 2) * (t * 2) }.`
  },
  {
    q: (t) => `sin 75° এর মান কত? (What is the value of sin 75°?)`,
    o: (t) => ["(√6 + √2)/4", "(√6 - √2)/4", "(√3 + 1)/2", "(√3 - 1)/2"],
    c: (t) => 0,
    e: (t) => `sin 75° = sin(45° + 30°) = sin45°cos30° + cos45°sin30° = (1/√2)*(√3/2) + (1/√2)*(1/2) = (√3+1)/(2√2) = (√6+√2)/4.`
  },
  {
    q: (t) => `i^(${t * 4 + 2}) এর সরলীকৃত মান কত? (What is the simplified value of i^(${t * 4 + 2})?)`,
    o: (t) => ["-1", "1", "i", "-i"],
    c: (t) => 0,
    e: (t) => `i^(4n+2) = i^(4n) * i² = 1 * (-1) = -1.`
  },
  {
    q: (t) => `y = sin(x) বক্ররেখার x = 0 বিন্দুতে স্পর্শকের ঢাল কত? (What is the slope of tangent of y=sin(x) at x=0?)`,
    o: (t) => ["1", "0", "-1", "undefined"],
    c: (t) => 0,
    e: (t) => `Slope = dy/dx = cos(x). At x=0, cos(0) = 1.`
  },
  {
    q: (t) => `f(x) = √(x - ${t}) ফাংশনের ডোমেন কত? (What is the domain of f(x) = √(x - ${t})?)`,
    o: (t) => [`x ≥ ${t}`, `x > ${t}`, `x ≤ ${t}`, `বাস্তব সংখ্যা (Real Numbers)`],
    c: (t) => 0,
    e: (t) => `For real output, value inside root must be non-negative: x - ${t} ≥ 0 => x ≥ ${t}.`
  },
  {
    q: (t) => `x² - 5x + 6 = 0 সমীকরণের মূলদ্বয়ের গুণফল কত? (What is the product of roots of equation x² - 5x + 6 = 0?)`,
    o: (t) => ["6", "5", "-5", "-6"],
    c: (t) => 0,
    e: (t) => `For quadratic ax² + bx + c = 0, product of roots is c/a. Here c = 6, a = 1.`
  },
  {
    q: (t) => `1, 3, 9, 27... গুণোত্তর ধারার ${t + 3} তম পদ কত? (What is the ${t + 3}-th term of geometric series 1, 3, 9, 27...?)`,
    o: (t) => {
      const term = Math.pow(3, t + 2);
      return [`${term}`, `${term * 3}`, `${term / 3}`, `${t + 3}`];
    },
    c: (t) => 0,
    e: (t) => `First term a=1, ratio r=3. n-th term = a * r^(n-1) = 3^(${t + 2}).`
  },
  {
    q: (t) => `দুটি ভেক্টরের স্কেলার গুণফল শূন্য হলে তাদের মধ্যবর্তী কোণ কত? (If dot product of two vectors is zero, what is the angle between them?)`,
    o: (t) => ["90°", "0°", "180°", "45°"],
    c: (t) => 0,
    e: (t) => `A.B = AB cos θ = 0 => cos θ = 0 => θ = 90° (perpendicular vectors).`
  },
  {
    q: (t) => `একটি ত্রিভুজের শীর্ষবিন্দুসমূহ (0,0), (${t * 2},0), (0,${t * 2}) হলে এর ক্ষেত্রফল কত? (What is the area of a triangle with vertices (0,0), (${t * 2},0), (0,${t * 2})?)`,
    o: (t) => {
      const area = 0.5 * (t * 2) * (t * 2);
      return [`${area}`, `${area * 2}`, `${area / 2}`, `${t}`];
    },
    c: (t) => 0,
    e: (t) => `Area = 0.5 * base * height = 0.5 * ${t * 2} * ${t * 2} = ${0.5 * (t * 2) * (t * 2)} sq units.`
  },
  {
    q: (t) => `tan⁻¹(1) এর প্রধান মান কত? (What is the principal value of tan⁻¹(1)?)`,
    o: (t) => ["π/4", "π/2", "π/3", "π/6"],
    c: (t) => 0,
    e: (t) => `tan(π/4) = 1. Hence, the principal value of tan⁻¹(1) is π/4.`
  },
  {
    q: (t) => `নিচের কোনটি কনিক্সের সমীকরণ নির্দেশ করে? (Which of the following represents conics equation?)`,
    o: (t) => ["ax² + 2hxy + by² + 2gx + 2fy + c = 0", "y = mx + c", "x² + y² = r²", "x/a + y/b = 1"],
    c: (t) => 0,
    e: (t) => `The general second-degree equation in two variables represents conics depending on the discriminant.`
  }
];

// ─────────────────────────────────────────────────────────────────────────
// 4. BIOLOGY TEMPLATES (20 Items)
// ─────────────────────────────────────────────────────────────────────────
const biologyTemplates = [
  {
    q: (t) => `উদ্ভিদকোষের কোষপ্রাচীর প্রধানত কী দ্বারা গঠিত? (Plant cell wall is primarily composed of what?)`,
    o: (t) => ["সেলুলোজ (Cellulose)", "কাইটিন (Chitin)", "পেপটিডোগ্লাইকান", "লিপিড"],
    c: (t) => 0,
    e: (t) => `উদ্ভিদকোষের কোষপ্রাচীর প্রধানত সেলুলোজ দ্বারা গঠিত। ছত্রাকের কোষপ্রাচীর কাইটিন দ্বারা গঠিত।`
  },
  {
    q: (t) => `অ্যামাইটোসিস কোষ বিভাজন কোন জীবে ঘটে? (Amitosis cell division occurs in which organism?)`,
    o: (t) => ["অ্যামিবা (Amoeba)", "মানুষ", "আম গাছ", "ব্যাঙ"],
    c: (t) => 0,
    e: (t) => `ব্যাকটেরিয়া, ঈস্ট, এবং অ্যামিবার মতো এককোষী সরল জীবে অ্যামাইটোসিস বা প্রত্যক্ষ বিভাজন ঘটে।`
  },
  {
    q: (t) => `উদ্ভিদের সালোকসংশ্লেষণ প্রক্রিয়ায় আলোক নিরপেক্ষ পর্যায়ের প্রধান কাজ কোনটি? (Main function of light-independent phase in plant photosynthesis?)`,
    o: (t) => ["কার্বন ডাই অক্সাইড বিজারণ (CO₂ reduction)", "পানি বিভাজন", "অক্সিজেন নির্গমন", "ক্লোরোফিল সক্রিয়করণ"],
    c: (t) => 0,
    e: (t) => `আলোক নিরপেক্ষ বা অন্ধকার পর্যায়ে CO₂ বিজারণের মাধ্যমে শর্করা (গ্লুকোজ) প্রস্তুত হয়।`
  },
  {
    q: (t) => `ডিএনএ (DNA) অণুর অ্যাডেনিনের (A) বিপরীতে কোন ক্ষারক যুক্ত থাকে? (Which nitrogenous base binds opposite to Adenine A in DNA?)`,
    o: (t) => ["থাইমিন (Thymine)", "সাইটোসিন (Cytosine)", "গুয়ানিন", "ইউরাসিল (Uracil)"],
    c: (t) => 0,
    e: (t) => `DNA অণুতে Adenine-Thymine (A=T) এবং Guanine-Cytosine (G≡C) জোড় গঠন করে। RNA-তে থাইমিনের জায়গায় ইউরাসিল (U) থাকে।`
  },
  {
    q: (t) => `মানুষের পাকস্থলীতে কোন এসিড নিঃসৃত হয়? (Which acid is secreted in the human stomach?)`,
    o: (t) => ["হাইড্রোক্লোরিক এসিড (HCl)", "সালফিউরিক এসিড", "নাইট্রিক এসিড", "সাইট্রিক এসিড"],
    c: (t) => 0,
    e: (t) => `পাকস্থলীর প্যারাইটাল কোষ থেকে শক্তিশালী হাইড্রোক্লোরিক এসিড (HCl) নিঃসৃত হয় যা জীবাণু ধ্বংস করে এবং এনজাইম সক্রিয় করে।`
  },
  {
    q: (t) => `মানুষের হৃদপিণ্ডের বাম নিলয় (Left Ventricle) থেকে কোন রক্তবাহী নালী রক্ত সারা শরীরে নিয়ে যায়? (Which vessel carries blood from left ventricle to rest of body?)`,
    o: (t) => ["মহাধমনী (Aorta)", "ফুসফুসীয় ধমনী", "মহাশিরা", "ফুসফুসীয় শিরা"],
    c: (t) => 0,
    e: (t) => `বাম নিলয় থেকে বিশুদ্ধ অক্সিজেনযুক্ত রক্ত মহাধমনী বা এওর্টার (Aorta) মাধ্যমে সারা শরীরে প্রবাহিত হয়।`
  },
  {
    q: (t) => `লোহিত রক্তকণিকার গড় আয়ু কত দিন? (What is the average lifespan of red blood cells?)`,
    o: (t) => ["১২০ দিন (120 days)", "১০ দিন", "৫০ দিন", "১৫ দিন"],
    c: (t) => 0,
    e: (t) => `মানুষের লোহিত রক্তকণিকার গড় আয়ু ৪ মাস বা প্রায় ১২০ দিন।`
  },
  {
    q: (t) => `বৃক্কের (Kidney) গঠন ও কাজের একক কী? (What is the structural and functional unit of Kidney?)`,
    o: (t) => ["নেফ্রন (Nephron)", "নিউরণ (Neuron)", "অ্যালভিওলাস", "হেপাটোসাইট"],
    c: (t) => 0,
    e: (t) => `বৃক্কের একক হলো নেফ্রন। স্নায়ুতন্ত্রের একক হলো নিউরণ এবং ফুসফুসের একক হলো অ্যালভিওলাস।`
  },
  {
    q: (t) => `মানবদেহের দীর্ঘতম অস্থি কোনটি? (Which is the longest bone in human body?)`,
    o: (t) => ["ফিমার (Femur)", "হিউমেরাস", "টিবিয়া", "স্টেপিস (Stapes)"],
    c: (t) => 0,
    e: (t) => `ঊরুর অস্থি বা ফিমার (Femur) মানবদেহের দীর্ঘতম এবং শক্তিশালী অস্থি। কানের স্টেপিস সবচেয়ে ছোট অস্থি।`
  },
  {
    q: (t) => `মানুষের চোখের কোন অংশটি আলোকরশ্মি রেটিনায় ফোকাস করতে সাহায্য করে? (Which part of human eye focuses light rays on Retina?)`,
    o: (t) => ["লেন্স (Lens)", "কর্ণিয়া (Cornea)", "আইরিস", "পিউপিল"],
    c: (t) => 0,
    e: (t) => `লেন্স নিজের আকার পরিবর্তন করে আলোকরশ্মিকে সংকুচিত বা প্রসারিত করে রেটিনায় নিখুঁতভাবে ফোকাস করে।`
  },
  {
    q: (t) => `উদ্বেগ বা ভয়ের সময় রক্তে কোন হরমোন দ্রুত বৃদ্ধি পায়? (Which hormone increases in blood during fear or stress?)`,
    o: (t) => ["অ্যাড্রেনালিন (Adrenaline)", "ইনসুলিন", "থাইরক্সিন", "ইস্ট্রোজেন"],
    c: (t) => 0,
    e: (t) => `অ্যাড্রেনাল গ্রন্থি থেকে নিঃসৃত অ্যাড্রেনালিনকে 'ফ্লাইট অর ফাইট' বা আপদকালীন হরমোন বলা হয়, যা ভয়ের সময় বেড়ে যায়।`
  },
  {
    q: (t) => `মেন্ডেলের প্রথম সূত্রের ফিনোটাইপিক অনুপাত কত? (What is the phenotypic ratio of Mendel's 1st law?)`,
    o: (t) => ["৩:১ (3:1)", "১:২:১", "৯:৩:৩:১", "১:১"],
    c: (t) => 0,
    e: (t) => `মেন্ডেলের ১ম সূত্রের (মনোহাইব্রিড ক্রস) ফিনোটাইপিক অনুপাত ৩:১ এবং জিনোটাইপিক অনুপাত ১:২:১।`
  },
  {
    q: (t) => `নিচের কোনটি ভাইরাসের কারণে সৃষ্ট রোগ নয়? (Which of the following is NOT caused by virus?)`,
    o: (t) => ["টাইফয়েড (Typhoid)", "ডেঙ্গু (Dengue)", "ইনফ্লুয়েঞ্জা", "এইডস (AIDS)"],
    c: (t) => 0,
    e: (t) => `টাইফয়েড হলো সালমোনেলা টাইফি ব্যাকটেরিয়াজনিত রোগ। ডেঙ্গু, ইনফ্লুয়েঞ্জা এবং এইডস ভাইরাসজনিত রোগ।`
  },
  {
    q: (t) => `ব্যাকটেরিয়া ধ্বংস করতে পারে নিচের কোনটি? (Which of the following can destroy bacteria?)`,
    o: (t) => ["ব্যাকটেরিওফাজ (Bacteriophage)", "তামাক মোজাইক ভাইরাস", "করোনা ভাইরাস", "এইচআইভি"],
    c: (t) => 0,
    e: (t) => `ব্যাকটেরিওফাজ হলো এক ধরণের ভাইরাস যা ব্যাকটেরিয়াকে আক্রমণ করে এবং ধ্বংস করে।`
  },
  {
    q: (t) => `উদ্ভিদের জাইলেম টিস্যুর প্রধান কাজ কী? (What is the main function of xylem tissue in plants?)`,
    o: (t) => ["পানি ও খনিজ লবণ পরিবহন (Water and mineral transport)", "খাদ্য পরিবহন", "সালোকসংশ্লেষণ", "ফল উৎপাদন"],
    c: (t) => 0,
    e: (t) => `জাইলেম মাটি থেকে শোষিত পানি ও খনিজ লবণ পাতায় পৌঁছায়। ফ্লোয়েম পাতায় তৈরি খাদ্য উদ্ভিদের সারা দেহে ছড়ায়।`
  },
  {
    q: (t) => `কোন ফাইলামের প্রাণীদের দেহ ত্বক কণ্টকময় বা কাঁটাযুক্ত? (Which phylum has spiny-skinned body animals?)`,
    o: (t) => ["Echinodermata", "Mollusca", "Arthropoda", "Annelida"],
    c: (t) => 0,
    e: (t) => `Echinodermata (যেমন তারামাছ) পর্বের প্রাণীদের ত্বক চুনময় কাঁটাযুক্ত বা কণ্টকময় থাকে।`
  },
  {
    q: (t) => `জিন প্রকৌশলে (Genetic Engineering) প্লাজমিড ডিএনএ কী হিসেবে ব্যবহৃত হয়? (How plasmid DNA is used in Genetic Engineering?)`,
    o: (t) => ["বাহক বা ভেক্টর (Vector)", "এনজাইম", "হোস্ট সেল", "মার্কার জিন"],
    c: (t) => 0,
    e: (t) => `প্লাজমিড হলো ব্যাকটেরিয়ার বহিঃক্রোমোজোমীয় বৃত্তাকার ডিএনএ, যা কাঙ্ক্ষিত জিন বহনের ভেক্টর হিসেবে ব্যবহৃত হয়।`
  },
  {
    q: (t) => `নিচের কোনটি ছত্রাকের উদাহরণ? (Which of the following is an example of fungi?)`,
    o: (t) => ["পেনিসিলিয়াম (Penicillium)", "স্পাইরোগাইরা", "ফার্ন", "ব্যাকটেরিয়া"],
    c: (t) => 0,
    e: (t) => `Penicillium হলো একটি অত্যন্ত পরিচিত ছত্রাক যেখান থেকে পেনিসিলিন অ্যান্টিবায়োটিক তৈরি করা হয়।`
  },
  {
    q: (t) => `অ্যানাফেজ ধাপে ক্রোমোজোমের আকৃতি ইংরেজি 'V' অক্ষরের মতো হলে তাকে কী বলে? (If chromosome shape in Anaphase looks like English V, it is called?)`,
    o: (t) => ["মেটাসেন্ট্রিক (Metacentric)", "সাব-মেটাসেন্ট্রিক", "অ্যাক্রোসেন্ট্রিক", "টেলোসেন্ট্রিক"],
    c: (t) => 0,
    e: (t) => `V = মেটাসেন্ট্রিক, L = সাব-মেটাসেন্ট্রিক, J = অ্যাক্রোসেন্ট্রিক, I = টেলোসেন্ট্রিক।`
  },
  {
    q: (t) => `উদ্ভিদের বৃদ্ধি পরিমাপক যন্ত্রের নাম কী? (What is the name of the instrument used to measure plant growth?)`,
    o: (t) => ["অক্সানোমিটার (Auxanometer)", "ব্যারোমিটার", "হাইড্রোমিটার", "ক্রনোগ্রাফ"],
    c: (t) => 0,
    e: (t) => `অক্সানোমিটার দিয়ে উদ্ভিদের বৃদ্ধির হার পরিমাপ করা হয়।`
  }
];

// ─────────────────────────────────────────────────────────────────────────
// 5. BANGLA TEMPLATES (35 Items)
// ─────────────────────────────────────────────────────────────────────────
const banglaTemplates = [
  {
    q: (t) => t === 1 ? "চর্যাপদ কোন শতকে রচিত হয়?" : t === 2 ? "চর্যাপদের তিব্বতি অনুবাদ কে আবিষ্কার করেন?" : t === 3 ? "চর্যাপদের মোট পদের সংখ্যা কতটি?" : t === 4 ? "চর্যাপদ কোথা থেকে উদ্ধার করা হয়?" : "চর্যাপদের আদি কবি কে?",
    o: (t) => t === 1 ? ["৭ম-১২শ শতক", "৯ম শতক", "১১শ শতক", "৫ম শতক"] : t === 2 ? ["প্রবোধচন্দ্র বাগচী", "হরপ্রসাদ শাস্ত্রী", "সুকুমার সেন", "সুনীতিকুমার চট্টোপাধ্যায়"] : t === 3 ? ["৪৬.৫টি", "৫০টি", "৫১টি", "৪৮টি"] : t === 4 ? ["নেপালের রাজদরবার", "তিব্বতের মঠ", "ভুটানের রাজগ্রন্থ", "ভারতের বিহার"] : ["লুইপা", "কাহ্নপা", "শবরপা", "ভুসুকু পা"],
    c: (t) => 0,
    e: (t) => t === 1 ? "চর্যাপদ ৭ম থেকে১২শ শতাব্দীর মধ্যবর্তী সময়ে রচিত হয়।" : t === 2 ? "প্রবোধচন্দ্র বাগচী চর্যাপদের তিব্বতি অনুবাদ আবিষ্কার করেন।" : t === 3 ? "চর্যাপদের মোট সাড়ে ছেচল্লিশটি পদ পাওয়া গেছে।" : t === 4 ? "হরপ্রসাদ শাস্ত্রী ১৯০৭ সালে নেপালের রাজদরবারের গ্রন্থাগার থেকে এটি উদ্ধার করেন।" : "চর্যাপদের আদি কবি হলেন লুইপা।"
  },
  {
    q: (t) => `"কবর" নাটকটির রচয়িতা কে? (Who is the writer of play "Kabar"?)`,
    o: (t) => ["মুনীর চৌধুরী", "জসীমউদ্দীন", "শওকত ওসমান", "সেলিম আল দীন"],
    c: (t) => 0,
    e: (t) => `মুনীর চৌধুরী ভাষা আন্দোলনের পটভূমিতে ভাষা আন্দোলনের সময় কারাগারে বসে 'কবর' নাটকটি রচনা করেন। জসীমউদ্দীনের 'কবর' একটি বিখ্যাত কবিতা।`
  },
  {
    q: (t) => `নিচের কোনটি স্বরসন্ধির উদাহরণ? (Which of the following is an example of Swarasandhi?)`,
    o: (t) => ["বিদ্যালয়", "সজ্জন", "উদ্ধার", "দিক্বিজয়"],
    c: (t) => 0,
    e: (t) => `বিদ্যা + আলয় = বিদ্যালয় (স্বরবর্ণ + স্বরবর্ণ)। সজ্জন (সৎ + জন) ব্যঞ্জনসন্ধি।`
  },
  {
    q: (t) => `"হাতাহাতি" কোন সমাস? (What compound classification is "Hatahati"?)`,
    o: (t) => ["ব্যতিহার বহুব্রীহি", "দ্বিগু সমাস", "কর্মধারয় সমাস", "দ্বন্দ্ব সমাস"],
    c: (t) => 0,
    e: (t) => `হাতে হাতে যে যুদ্ধ বা লড়াই তাকে হাতাহাতি বলে, এটি ব্যতিহার বহুব্রীহি সমাস (ক্রিয়ার পারস্পরিকতা বোঝায়)।`
  },
  {
    q: (t) => `"ইতিহাস বিষয়ে যিনি অভিজ্ঞ" - এক কথায় প্রকাশ কী হবে? (One word substitution for "expert in history"?)`,
    o: (t) => ["ইতিহাসবেত্তা", "ঐতিহাসিক", "ইতিহাসবিদ", "ইতিহাসজ্ঞ"],
    c: (t) => 0,
    e: (t) => `ইতিহাস বিষয়ে যিনি অভিজ্ঞ তাকে 'ইতিহাসবেত্তা' বা 'ইতিহাসবিদ' বলা হয়।`
  },
  {
    q: (t) => `"সূর্য" এর সমার্থক শব্দ কোনটি? (Synonym of "Surjo"?)`,
    o: (t) => ["আদিত্য", "সুধাংশু", "শশাঙ্ক", "ক্ষপানাথ"],
    c: (t) => 0,
    e: (t) => `আদিত্য, তপন, ভাস্কর, দিনমণি, দিবাকর সূর্যের সমার্থক শব্দ। সুধাংশু ও শশাঙ্ক চন্দ্রের সমার্থক।`
  },
  {
    q: (t) => `"অগ্নিবীণা" কাব্যগ্রন্থের প্রথম কবিতা কোনটি? (First poem of Kazi Nazrul Islam's "Agnibeena"?)`,
    o: (t) => ["প্রলয়োল্লাস", "বিদ্রোহী", "ধূমকেতু", "রক্তাম্বরধারিণী মা"],
    c: (t) => 0,
    e: (t) => `কাজী নজরুল ইসলামের বিদ্রোহী ও ঐতিহাসিক প্রথম কাব্যগ্রন্থ 'অগ্নিবীণা' (১৯২২)-এর প্রথম কবিতা 'প্রলয়োল্লাস'। বিদ্রোহী কবিতাটি দ্বিতীয় স্থানে আছে।`
  },
  {
    q: (t) => `"পথের পাঁচালী" উপন্যাসের রচয়িতা কে? (Who wrote "Pather Panchali"?)`,
    o: (t) => ["বিভূতিভূষণ বন্দ্যোপাধ্যায়", "শরৎচন্দ্র চট্টোপাধ্যায়", "মানিক বন্দ্যোপাধ্যায়", "রবীন্দ্রনাথ ঠাকুর"],
    c: (t) => 0,
    e: (t) => `পথের পাঁচালী উপন্যাসটির লেখক বিভূতিভূষণ বন্দ্যোপাধ্যায়। এটি একটি কালজয়ী উপন্যাস যার ওপর সত্যজিৎ রায় চলচ্চিত্র নির্মাণ করেন।`
  },
  {
    q: (t) => `"অপমান" শব্দে 'অপ' উপসর্গটি কী অর্থে ব্যবহৃত হয়েছে? (What sense "Opo" prefix carries in "Opoman"?)`,
    o: (t) => ["বিপরীত", "হীনতা", "বিকৃতি", "নিকৃষ্ট"],
    c: (t) => 0,
    e: (t) => `মান এর বিপরীত অপমান। এখানে 'অপ' উপসর্গটি বিপরীত অর্থে ব্যবহৃত হয়েছে।`
  },
  {
    q: (t) => `"গীতাঞ্জলি" কাব্যগ্রন্থ কত সালে প্রকাশিত হয়? (What year Rabindranath's "Gitanjali" was published?)`,
    o: (t) => ["১৯১০", "১৯১৩", "১৯০৫", "১৯১১"],
    c: (t) => 0,
    e: (t) => `রবীন্দ্রনাথ ঠাকুরের গীতাঞ্জলি কাব্যগ্রন্থ ১৯১০ সালে মূল বাংলা সংস্করণে প্রকাশিত হয়। ইংরেজি অনুবাদের জন্য তিনি ১৯১৩ সালে নোবেল পান।`
  },
  {
    q: (t) => `"নদী" এর সমার্থক শব্দ নয় কোনটি? (Which of the following is NOT a synonym of "Nodi"?)`,
    o: (t) => ["তটিনী", "তরঙ্গিণী", "প্রবাহিনী", "ক্ষিতি"],
    c: (t) => 3,
    e: (t) => `ক্ষিতি শব্দের অর্থ পৃথিবী। তটিনী, তরঙ্গিণী, প্রবাহিণী নদীর সমার্থক শব্দ।`
  },
  {
    q: (t) => `"শুদ্ধ বানান" কোনটি? (Identify the correct spelling in Bangla?)`,
    o: (t) => ["মুহূর্ত", "মুহুুর্ত", "মূহুর্ত", "মূহূর্ত"],
    c: (t) => 0,
    e: (t) => `শুদ্ধ বানান হলো 'মুহূর্ত' (ম-এ হ্রস্ব উ, হ-এ দীর্ঘ উ, ত-এ রেফ)।`
  },
  {
    q: (t) => `"গীতাঞ্জলি" এর ইংরেজি অনুবাদ (Song Offerings) এর ভূমিকা কে লিখেছিলেন? (Who wrote introduction for Gitanjali English translation?)`,
    o: (t) => ["ডব্লিউ বি ইয়েটস (W. B. Yeats)", "শেক্সপিয়র", "রবার্ট ফ্রস্ট", "টি এস এলিয়ট"],
    c: (t) => 0,
    e: (t) => `Song Offerings (Gitanjali) এর ভূমিকা লিখেছিলেন আয়ারল্যান্ডের বিশ্বখ্যাত কবি ডব্লিউ বি ইয়েটস।`
  },
  {
    q: (t) => `"লালসালু" উপন্যাসের প্রধান চরিত্র কে? (Main character of novel "Lalsalu"?)`,
    o: (t) => ["মজিদ", "খালেক ব্যাপারী", "জমিলা", "রহিমা"],
    c: (t) => 0,
    e: (t) => `সৈয়দ ওয়ালীউল্লাহর 'লালসালু' উপন্যাসের ভণ্ড ধর্মব্যবসায়ী ও শোষক মজিদ হলো প্রধান চরিত্র।`
  },
  {
    q: (t) => `ক্রিয়ার কাল প্রধানত কত প্রকার? (How many main types of tense/time of verbs in Bangla?)`,
    o: (t) => ["৩ প্রকার", "৪ প্রকার", "২ প্রকার", "৫ প্রকার"],
    c: (t) => 0,
    e: (t) => `ক্রিয়ার কাল প্রধানত ৩ প্রকার: অতীত কাল, বর্তমান কাল, ভবিষ্যৎ কাল।`
  },
  {
    q: (t) => `"কপালকুণ্ডলা" উপন্যাসের নায়িকার উক্তি কোনটি? (Famous quote by heroine of novel "Kapalkundala"?)`,
    o: (t) => ["তুমি অধম, তাই বলিয়া আমি উত্তম হইব না কেন?", "পথিক, তুমি পথ হারাইয়াছ?", "সুন্দরী তুমি, আমি চিনিয়াছি তোমায়", "যাহা পাই তাহা চাই না"],
    c: (t) => 1,
    e: (t) => `বঙ্কিমচন্দ্র চট্টোপাধ্যায়ের রোমান্টিক উপন্যাস 'কপালকুণ্ডলা'র বিখ্যাত উক্তি: 'পথিক, তুমি পথ হারাইয়াছ?'।`
  },
  {
    q: (t) => `"চোখের বালি" উপন্যাসের লেখক কে? (Who wrote novel "Chokher Bali"?)`,
    o: (t) => ["রবীন্দ্রনাথ ঠাকুর", "শরৎচন্দ্র চট্টোপাধ্যায়", "বঙ্কিমচন্দ্র চট্টোপাধ্যায়", "তারাশঙ্কর বন্দ্যোপাধ্যায়"],
    c: (t) => 0,
    e: (t) => `চোখের বালি রবীন্দ্রনাথ ঠাকুরের একটি অন্যতম জনপ্রিয় সামাজিক ও মনস্তাত্ত্বিক উপন্যাস (১৯০৩)।`
  },
  {
    q: (t) => `"মেঘনাদবধ কাব্য" কোন ছন্দে রচিত? (Meghnadbadh Kabya is written in which meter?)`,
    o: (t) => ["অমিত্রাক্ষর ছন্দ", "অক্ষরবৃত্ত ছন্দ", "মাত্রাবৃত্ত ছন্দ", "স্বরবৃত্ত ছন্দ"],
    c: (t) => 0,
    e: (t) => `মাইকেল মধুসূদন দত্ত প্রবর্তিত অমিত্রাক্ষর ছন্দে (Blank verse) 'মেঘনাদবধ কাব্য' রচিত।`
  },
  {
    q: (t) => `"হাভাতে" শব্দের 'হা' উপসর্গটি কোন ভাষার? (From which language does the prefix "Ha" in "Havate" belong?)`,
    o: (t) => ["খাঁটি বাংলা", "সংস্কৃত", "ফারসি", "আরবি"],
    c: (t) => 0,
    e: (t) => `'হা' (অভাব অর্থে) একটি খাঁটি বাংলা উপসর্গ (যেমন: হাভাতে, হাঘরে)।`
  },
  {
    q: (t) => `সন্ধির প্রধান সুবিধা কী? (Main benefit of Sandhi?)`,
    o: (t) => ["উচ্চারণের সহজপ্রবণতা ও শ্রুতিমাধুর্য", "শব্দ গঠন", "নতুন পদের সৃষ্টি", "অর্থের বৈচিত্র্য"],
    c: (t) => 0,
    e: (t) => `সন্ধি পাশাপাশি দুটি ধ্বনিকে একত্রিত করে উচ্চারণ সহজ করে এবং শব্দকে শ্রুতিমধুর করে তোলে।`
  },
  {
    q: (t) => `"তিলে তৈল হয়" - 'তিলে' কোন কারকে কোন বিভক্তি? (What case and inflection is "Tile" in "Tile toil hoy"?)`,
    o: (t) => ["অপাদান কারকে ৭মী", "অধিকরণ কারকে ৭মী", "করণ কারকে ৭মী", "কর্তা কারকে ৭মী"],
    c: (t) => 0,
    e: (t) => `যা থেকে কোনো কিছু উৎপন্ন বা জাত হয় তা অপাদান কারক। তিল হতে তৈল উৎপন্ন হয়, তাই এটি অপাদানে ৭মী (এ বিভক্তি)।`
  },
  {
    q: (t) => `"বাগধারা" ব্যাকরণের কোন অংশে আলোচিত হয়? (In which part of grammar are "Idioms/Bagdhara" discussed?)`,
    o: (t) => ["বাক্যতত্ত্ব (Syntax)", "রূপতত্ত্ব (Morphology)", "ধ্বনিতত্ত্ব (Phonology)", "শব্দার্থতত্ত্ব (Semantics)"],
    c: (t) => 0,
    e: (t) => `বাগধারা বাক্যের অলংকার বা বিশিষ্ট প্রয়োগ, তাই এটি বাক্যতত্ত্বে আলোচিত হয়।`
  },
  {
    q: (t) => `নিচের কোনটি নিত্য সমাসের উদাহরণ? (Which of the following is an example of Nitya Samas?)`,
    o: (t) => ["দেশান্তর", "উপকূল", "রাজপথ", "প্রতিদিন"],
    c: (t) => 0,
    e: (t) => `দেশান্তর (অন্য দেশ) নিত্য সমাস। প্রতিদিন অব্যয়ীভাব সমাস। রাজপথ ষষ্ঠী তৎপুরুষ।`
  },
  {
    q: (t) => `বাংলা সাহিত্যে "ভোরের পাখি" বলা হয় কাকে? (Who is called "Vorer Pakhi" in Bangla Literature?)`,
    o: (t) => ["বিহারীলাল চক্রবর্তী", "রবীন্দ্রনাথ ঠাকুর", "ঈশ্বরচন্দ্র গুপ্ত", "মাইকেল মধুসূদন দত্ত"],
    c: (t) => 0,
    e: (t) => `রবীন্দ্রনাথ ঠাকুর গীতিকবি বিহারীলাল চক্রবর্তীকে আধুনিক বাংলা গীতিকাব্যের জনক ও 'ভোরের পাখি' উপাধি দেন।`
  },
  {
    q: (t) => `"জীবনানন্দ দাশ" এর বিখ্যাত কাব্যগ্রন্থ কোনটি? (Famous poetry book of Jibanananda Das?)`,
    o: (t) => ["রূপসী বাংলা", "সোনার তরী", "অগ্নিবীণা", "নকশী কাঁথার মাঠ"],
    c: (t) => 0,
    e: (t) => `জীবনানন্দ দাশকে রূপসী বাংলার কবি বলা হয়। তার অন্যতম শ্রেষ্ঠ কাব্যগ্রন্থ হলো 'রূপসী বাংলা' (১৯৫৭)।`
  },
  {
    q: (t) => `"ব্যক্ত" শব্দের বিপরীত শব্দ কোনটি? (Antonym of the word "Bhyakto"?)`,
    o: (t) => ["গূঢ়", "সুপ্ত", "লুপ্ত", "অব্যক্ত"],
    c: (t) => 3,
    e: (t) => `ব্যক্ত মানে যা প্রকাশ করা হয়েছে। এর বিপরীত হলো অব্যক্ত (যা প্রকাশ করা হয়নি)।`
  },
  {
    q: (t) => `"উপকার পরিমাপ করা যায় না যার" - এক কথায় প্রকাশ কী হবে? (One word substitution for immeasurable help?)`,
    o: (t) => ["অনুপমেয়", "অপরিমেয়", "অযাচিত", "অনস্বীকার্য"],
    c: (t) => 1,
    e: (t) => `যার উপকার পরিমাপ বা তুলনা করা যায় না তাকে অপরিমেয় বা অতুলনীয় বলা যায়।`
  },
  {
    q: (t) => `নিচের কোনটি অর্ধ-তৎসম শব্দ? (Which of the following is a semi-Sanskrit/Ardha-Tatsama word?)`,
    o: (t) => ["জোছনা", "চন্দ্র", "সূর্য", "হস্তী"],
    c: (t) => 0,
    e: (t) => `সংস্কৃত 'জ্যোৎস্না' শব্দ বিকৃত হয়ে বাংলায় 'জোছনা' রূপে এসেছে, যা অর্ধ-তৎসম শব্দ।`
  },
  {
    q: (t) => `"নত্ব বিধান" অনুযায়ী সাধারণত কোন বর্ণের পর 'ণ' ব্যবহৃত হয়? (According to Natwa Bidhan, after which letters 'No' ণ is used?)`,
    o: (t) => ["ঋ, র, ষ", "ক, খ, গ", "ত, থ, দ", "প, ফ, ব"],
    c: (t) => 0,
    e: (t) => `তৎসম শব্দে ঋ, র, ষ (এবং তাদের কার চিহ্ন ঋ-কার, র-ফলা, রেফ, মূর্ধন্য-ষ) এর পর মূর্ধন্য-ণ ব্যবহৃত হয়।`
  },
  {
    q: (t) => `বাংলা বর্ণমালায় অর্ধমাত্রার বর্ণ কয়টি? (How many semi-half-measured letters in Bangla alphabet?)`,
    o: (t) => ["৮টি", "১০টি", "৩২টি", "৬টি"],
    c: (t) => 0,
    e: (t) => `বাংলা বর্ণমালায় পূর্ণমাত্রা ৩২টি, অর্ধমাত্রা ৮টি এবং মাত্রাহীন বর্ণ ১০টি।`
  },
  {
    q: (t) => `বাংলা সাহিত্যের প্রাচীনতম নিদর্শন কোনটি? (Oldest literary work of Bangla literature?)`,
    o: (t) => ["চর্যাপদ (Charyapada)", "শ্রীকৃষ্ণকীর্তন", "মনসামঙ্গল", "ইউসুফ-জুলেখা"],
    c: (t) => 0,
    e: (t) => `চর্যাপদ হলো বাংলা ভাষার প্রথম এবং একমাত্র প্রাচীন নিদর্শন (রচনাকাল ৭ম-১২শ শতক)।`
  },
  {
    q: (t) => `"আট কপালে" বাগধারাটির অর্থ কী? (What is the meaning of idiom "At Kopale"?)`,
    o: (t) => ["হতভাগ্য (Unfortunate)", "সৌভাগ্যবান", "অলস", "উচ্চাভিলাষী"],
    c: (t) => 0,
    e: (t) => `'আট কপালে' অর্থ মন্দ কপাল বা হতভাগ্য। পক্ষান্তরে 'একাদশে বৃহস্পতি' অর্থ সুসময় বা পরম সৌভাগ্য।`
  },
  {
    q: (t) => `কাজী নজরুল ইসলামকে কত সালে বাংলাদেশের জাতীয় কবি ঘোষণা করা হয়? (What year Nazrul was declared National Poet of Bangladesh?)`,
    o: (t) => ["১৯৭২", "১৯৭৪", "১৯৭৬", "১৯৮০"],
    c: (t) => 0,
    e: (t) => `১৯৭২ সালে বঙ্গবন্ধু শেখ মুজিবুর রহমান কবিকে স্বাধীন বাংলাদেশে নিয়ে আসেন এবং ১৯৭৪ সালে তাকে জাতীয় কবির মর্যাদা দেওয়া হয়।`
  },
  {
    q: (t) => `"মরিতে চাহি না আমি সুন্দর ভুবনে" - পঙক্তিটি কার লেখা? (Who wrote "Morite chahi na ami sundar bhubone"?)`,
    o: (t) => ["রবীন্দ্রনাথ ঠাকুর", "কাজী নজরুল ইসলাম", "জীবনানন্দ দাশ", "সুফিয়া কামাল"],
    c: (t) => 0,
    e: (t) => `পঙক্তিটি বিশ্বকবি রবীন্দ্রনাথ ঠাকুরের রচিত 'প্রাণ' কবিতার বিখ্যাত চরণ।`
  },
  {
    q: (t) => `"কপোতাক্ষ নদ" কবিতাটি কোন ধরণের কবিতা? (What type of poem is "Kopotakkho Nod"?)`,
    o: (t) => ["চতুর্দশপদী কবিতা (Sonnet)", "গীতিকবিতা", "মহাকাব্য", "গাথাকবিতা"],
    c: (t) => 0,
    e: (t) => `মাইকেল মধুসূদন দত্তের স্মৃতিচারণমূলক কবিতা 'কপোতাক্ষ নদ' একটি চমৎকার ইতালীয় সনেট বা চতুর্দশপদী কবিতা।`
  }
];

// ─────────────────────────────────────────────────────────────────────────
// 6. ENGLISH TEMPLATES (35 Items)
// ─────────────────────────────────────────────────────────────────────────
const englishTemplates = [
  {
    q: (t) => `Choose the correct spelling:`,
    o: (t) => ["Bureaucracy", "Burocracy", "Bureaucracye", "Bureucracy"],
    c: (t) => 0,
    e: (t) => `The correct spelling is 'Bureaucracy' (B-U-R-E-A-U-C-R-A-C-Y).`
  },
  {
    q: (t) => `Identify the parts of speech of 'underlined' word: "It was a **fast** train."`,
    o: (t) => ["Adjective", "Adverb", "Noun", "Verb"],
    c: (t) => 0,
    e: (t) => `'Fast' modifies the noun 'train'. Therefore, it acts as an Adjective. If it were 'ran fast', it would be an Adverb.`
  },
  {
    q: (t) => `Choose the correct conditional sentence:`,
    o: (t) => ["If he had studied, he would have passed.", "If he studied, he will pass.", "If he had study, he would pass.", "If he would study, he passed."],
    c: (t) => 0,
    e: (t) => `Third conditional structure: If + Past Perfect, Subject + would have + V3.`
  },
  {
    q: (t) => `What is the antonym of 'Ambiguous'?`,
    o: (t) => ["Clear", "Vague", "Doubtful", "Confused"],
    c: (t) => 0,
    e: (t) => `'Ambiguous' means open to more than one interpretation (unclear). Its opposite is 'Clear' or 'Unambiguous'.`
  },
  {
    q: (t) => `What is the synonym of 'Prudent'?`,
    o: (t) => ["Wise", "Careless", "Foolish", "Impatient"],
    c: (t) => 0,
    e: (t) => `'Prudent' means acting with or showing care and thought for the future (Wise/Cautious).`
  },
  {
    q: (t) => `Complete the sentence: "Neither of the two sisters ______ present."`,
    o: (t) => ["was", "were", "are", "have been"],
    c: (t) => 0,
    e: (t) => `'Neither of' takes a singular verb. Hence, 'was' is correct.`
  },
  {
    q: (t) => `Change the voice: "The police caught the thief."`,
    o: (t) => ["The thief was caught by the police.", "The thief is caught by the police.", "The thief had been caught by the police.", "The thief caught by the police."],
    c: (t) => 0,
    e: (t) => `Simple Past passive: Subject + was/were + V3 (past participle).`
  },
  {
    q: (t) => `Select the correct preposition: "He is senior ______ me by two years."`,
    o: (t) => ["to", "than", "with", "from"],
    c: (t) => 0,
    e: (t) => `Words like senior, junior, superior, inferior take the preposition 'to' instead of 'than'.`
  },
  {
    q: (t) => `Identify the noun form of the verb 'Object':`,
    o: (t) => ["Objection", "Objective", "Objected", "Objecting"],
    c: (t) => 0,
    e: (t) => `The noun form of 'Object' is 'Objection'. 'Objective' can be an adjective or noun (goal).`
  },
  {
    q: (t) => `Fill in the blank: "He ran fast lest he ______ miss the train."`,
    o: (t) => ["should", "would", "could", "might"],
    c: (t) => 0,
    e: (t) => `The conjunction 'lest' is always followed by a clause containing 'should' + base verb.`
  },
  {
    q: (t) => `What is the meaning of the idiom 'To call it a day'?`,
    o: (t) => ["To stop working on something", "To start a new project", "To remember a good event", "To name a day of celebration"],
    c: (t) => 0,
    e: (t) => `'To call it a day' is an idiom meaning to stop what you are doing, especially because you are tired.`
  },
  {
    q: (t) => `Choose the correct indirect narration of: He said, "I am writing a letter."`,
    o: (t) => ["He said that he was writing a letter.", "He said that he is writing a letter.", "He told that he had written a letter.", "He said he write a letter."],
    c: (t) => 0,
    e: (t) => `Present continuous shifts to past continuous in indirect speech when reporting verb is in past tense.`
  },
  {
    q: (t) => `Complete with appropriate word: "I would rather starve than ______."`,
    o: (t) => ["beg", "to beg", "begging", "begged"],
    c: (t) => 0,
    e: (t) => `'Would rather... than' takes a bare infinitive (base verb). So 'beg' is correct.`
  },
  {
    q: (t) => `What is the synonym of 'Ephemeral'?`,
    o: (t) => ["Short-lived", "Eternal", "Heavy", "Beautiful"],
    c: (t) => 0,
    e: (t) => `'Ephemeral' means lasting for a very short time (transient/short-lived).`
  },
  {
    q: (t) => `Which word is a noun?`,
    o: (t) => ["Strength", "Strong", "Strengthen", "Strongly"],
    c: (t) => 0,
    e: (t) => `'Strength' is noun, 'Strong' is adjective, 'Strengthen' is verb, 'Strongly' is adverb.`
  },
  {
    q: (t) => `Fill in the blank: "The committee ______ divided in their opinions."`,
    o: (t) => ["were", "was", "is", "has been"],
    c: (t) => 0,
    e: (t) => `A collective noun takes a plural verb when members act individually or are divided in opinion.`
  },
  {
    q: (t) => `What is the meaning of 'Out of the blue'?`,
    o: (t) => ["Unexpectedly", "Depressed", "In the ocean", "Regularly"],
    c: (t) => 0,
    e: (t) => `'Out of the blue' means completely unexpected or without warning.`
  },
  {
    q: (t) => `Fill in the blank: "I look forward to ______ you soon."`,
    o: (t) => ["meeting", "meet", "met", "to meet"],
    c: (t) => 0,
    e: (t) => `The phrase 'look forward to' is followed by a gerund (verb+ing).`
  },
  {
    q: (t) => `Choose the correct plural form of 'Oasis':`,
    o: (t) => ["Oases", "Oasises", "Oasisese", "Oasise"],
    c: (t) => 0,
    e: (t) => `The plural of 'oasis' (singular) is 'oases' (plural), similar to analysis/analyses.`
  },
  {
    q: (t) => `Identify the sentence in subjunctive mood:`,
    o: (t) => ["I demand that he leave immediately.", "He is leaving now.", "If he leaves, I go.", "Please leave the room."],
    c: (t) => 0,
    e: (t) => `Verbs like demand, suggest, insist take a subjunctive clause where the verb is in base form ('he leave', not 'he leaves').`
  },
  {
    q: (t) => `Which of the following is a gerund?`,
    o: (t) => ["**Walking** is good for health.", "I am **walking** now.", "A **walking** stick is useful.", "He keeps **walk**."],
    c: (t) => 0,
    e: (t) => `A gerund functions as a noun. Here 'Walking' is the subject of the sentence, so it is a gerund. In option C, it acts as an adjective (participle).`
  },
  {
    q: (t) => `Find the correct sentence:`,
    o: (t) => ["One of my friends is a doctor.", "One of my friend is a doctor.", "One of my friends are a doctor.", "One of my friend are a doctor."],
    c: (t) => 0,
    e: (t) => `'One of' is followed by plural noun ('friends') and singular verb ('is').`
  },
  {
    q: (t) => `Fill in the blank: "He had a hard time coping ______ his new job."`,
    o: (t) => ["with", "up with", "against", "to"],
    c: (t) => 0,
    e: (t) => `The correct idiom is 'cope with' (handle successfully). 'Cope up with' is grammatically incorrect.`
  },
  {
    q: (t) => `What is the meaning of 'Achilles' heel'?`,
    o: (t) => ["A weak point", "A strong shield", "A fast runner", "A physical deformity"],
    c: (t) => 0,
    e: (t) => `'Achilles' heel' is a mythological reference meaning a vulnerable or weak spot in an otherwise strong character.`
  },
  {
    q: (t) => `What is the antonym of 'Zenith'?`,
    o: (t) => ["Nadir", "Peak", "Apex", "Summit"],
    c: (t) => 0,
    e: (t) => `'Zenith' means the highest point. Its exact opposite is 'Nadir', which means the lowest point.`
  },
  {
    q: (t) => `Choose the correct spelling:`,
    o: (t) => ["Maintenance", "Maintainance", "Maintanance", "Maintenence"],
    c: (t) => 0,
    e: (t) => `The correct spelling is 'Maintenance' (M-A-I-N-T-E-N-A-N-C-E).`
  },
  {
    q: (t) => `Fill in the blank: "He went to Dhaka with a view to ______ a book."`,
    o: (t) => ["buying", "buy", "bought", "to buy"],
    c: (t) => 0,
    e: (t) => `'With a view to' is a prepositional phrase that takes a gerund (verb + ing) after it.`
  },
  {
    q: (t) => `What is the synonym of 'Altruistic'?`,
    o: (t) => ["Selfless", "Selfish", "Greedy", "Unkind"],
    c: (t) => 0,
    e: (t) => `'Altruistic' means showing a disinterested and selfless concern for the well-being of others (Selfless/Philanthropic).`
  },
  {
    q: (t) => `Complete the sentence: "I have no money ______ hand."`,
    o: (t) => ["in", "on", "at", "by"],
    c: (t) => 0,
    e: (t) => `The appropriate phrase is 'in hand' (available for use).`
  },
  {
    q: (t) => `Change the narration: She said, "Let us go out for a walk."`,
    o: (t) => ["She proposed that they should go out for a walk.", "She said to go out for a walk.", "She told that they go for a walk.", "She requested to go out for a walk."],
    c: (t) => 0,
    e: (t) => `'Let us' in direct speech changes to 'proposed/suggested + that + they/we + should + verb' in indirect speech.`
  },
  {
    q: (t) => `What is the meaning of 'At daggers drawn'?`,
    o: (t) => ["On the verge of fighting", "Friendly", "Playing a game", "Drawing a painting"],
    c: (t) => 0,
    e: (t) => `'At daggers drawn' means in a state of open hostility or ready to fight.`
  },
  {
    q: (t) => `Choose the correct word: "The climate of Cox's Bazar is better than ______."`,
    o: (t) => ["that of Dhaka", "Dhaka", "those of Dhaka", "Dhaka's climate"],
    c: (t) => 0,
    e: (t) => `To maintain parallel comparison, compare 'climate' with 'that of Dhaka' (not directly with city 'Dhaka').`
  },
  {
    q: (t) => `Identify the correct spelling:`,
    o: (t) => ["Accommodation", "Accomodation", "Acommodation", "Acomodation"],
    c: (t) => 0,
    e: (t) => `The correct spelling is 'Accommodation' (double c, double m).`
  },
  {
    q: (t) => `Fill in the blank: "No sooner had I reached the station ______ the train left."`,
    o: (t) => ["than", "then", "when", "before"],
    c: (t) => 0,
    e: (t) => `The correlation 'No sooner had...' is followed by 'than' in the next clause.`
  },
  {
    q: (t) => `What type of noun is 'Commitee'?`,
    o: (t) => ["Collective Noun", "Common Noun", "Proper Noun", "Material Noun"],
    c: (t) => 0,
    e: (t) => `Committee is a collective noun because it refers to a group of people acting as a single body.`
  }
];

// ─────────────────────────────────────────────────────────────────────────
// 7. GENERAL KNOWLEDGE TEMPLATES (30 Items)
// ─────────────────────────────────────────────────────────────────────────
const gkTemplates = [
  {
    q: (t) => t === 1 ? "মুজিবনগর সরকার কত তারিখে শপথ গ্রহণ করেছিল?" : t === 2 ? "মুজিবনগর সরকারের প্রধানমন্ত্রী কে ছিলেন?" : t === 3 ? "মুজিবনগর সরকারের রাষ্ট্রপতি কে ছিলেন?" : t === 4 ? "মুজিবনগর সরকার কোন জেলায় গঠিত হয়েছিল?" : "মুজিবনগর দিবস কবে পালিত হয়?",
    o: (t) => t === 1 ? ["১৭ এপ্রিল, ১৯৭১", "১০ এপ্রিল, ১৯৭১", "২৬ মার্চ, ১৯৭১", "১৬ ডিসেম্বর, ১৯৭১"] : t === 2 ? ["তাজউদ্দীন আহমদ", "বঙ্গবন্ধু শেখ মুজিবুর রহমান", "সৈয়দ নজরুল ইসলাম", "এম মনসুর আলী"] : t === 3 ? ["বঙ্গবন্ধু শেখ মুজিবুর রহমান", "সৈয়দ নজরুল ইসলাম", "তাজউদ্দীন আহমদ", "কামারুজ্জামান"] : t === 4 ? ["মেহেরপুর", "কুষ্টিয়া", "চুয়াডাঙ্গা", "যশোর"] : ["১৭ এপ্রিল", "১০ এপ্রিল", "২৬ মার্চ", "১৬ ডিসেম্বর"],
    c: (t) => 0,
    e: (t) => t === 1 ? "মুজিবনগর সরকার ১০ এপ্রিল গঠিত হয় এবং ১৭ এপ্রিল ১৯৭১ মেহেরপুরের বৈদ্যনাথতলায় শপথ গ্রহণ করে।" : t === 2 ? "তাজউদ্দীন আহমদ ছিলেন স্বাধীন বাংলাদেশের প্রথম অস্থায়ী মুজিবনগর সরকারের প্রধানমন্ত্রী।" : t === 3 ? "বঙ্গবন্ধু শেখ মুজিবুর রহমান ছিলেন মুজিবনগর সরকারের রাষ্ট্রপতি।" : t === 4 ? "মেহেরপুর জেলার বৈদ্যনাথতলার আম্রকাননে (বর্তমান মুজিবনগর) এই সরকার শপথ নেয়।" : "প্রতি বছর ১৭ এপ্রিল মুজিবনগর দিবস পালিত হয়।"
  },
  {
    q: (t) => `বাংলাদেশের সংবিধান কত তারিখে গণপরিষদে গৃহীত হয়? (What date Bangladesh Constitution was adopted in Constituent Assembly?)`,
    o: (t) => ["৪ নভেম্বর, ১৯৭২", "১৬ ডিসেম্বর, ১৯৭২", "১২ অক্টোবর, ১৯৭২", "২৬ মার্চ, ১৯৭২"],
    c: (t) => 0,
    e: (t) => `সংবিধান ৪ নভেম্বর ১৯৭২ সালে গণপরিষদে গৃহীত হয় (তাই এটি সংবিধান দিবস) এবং ১৬ ডিসেম্বর ১৯৭২ থেকে কার্যকর হয়।`
  },
  {
    q: (t) => `স্বাধীনতার ঘোষণাপত্র প্রথম কে পাঠ করেন? (Who read out proclamation of independence first?)`,
    o: (t) => ["এম এ হান্নান", "বঙ্গবন্ধু শেখ মুজিবুর রহমান", "জিয়াউর রহমান", "তাজউদ্দীন আহমদ"],
    c: (t) => 0,
    e: (t) => `চট্টগ্রাম কালুরঘাট বেতার কেন্দ্র থেকে ২৬ মার্চ ১৯৭১ সালে প্রথম স্বাধীনতার ঘোষণাপত্র পাঠ করেন এম এ হান্নান।`
  },
  {
    q: (t) => `মুক্তিযুদ্ধে অবদানের জন্য কতজনকে বীরশ্রেষ্ঠ উপাধি দেওয়া হয়েছে? (How many received Bir Sreshtho award?)`,
    o: (t) => ["৭ জন (7)", "৬৮ জন", "১৭৫ জন", "৪২৬ জন"],
    c: (t) => 0,
    e: (t) => `সর্বোচ্চ সামরিক সম্মান বীরশ্রেষ্ঠ দেওয়া হয়েছে ৭ জনকে। বীরউত্তম ৬৮ জন, বীরবিক্রম ১৭৫ জন।`
  },
  {
    q: (t) => `বাংলাদেশের একমাত্র প্রবাল দ্বীপ কোনটি? (Which is the only coral island of Bangladesh?)`,
    o: (t) => ["সেন্টমার্টিন (St. Martin)", "কুতুবদিয়া", "মহেশখালী", "হাতিয়া"],
    c: (t) => 0,
    e: (t) => `সেন্টমার্টিন হলো বাংলাদেশের একমাত্র প্রবাল দ্বীপ (নারকেল জিঞ্জিরা)।`
  },
  {
    q: (t) => `পদ্মা বহুমুখী সেতুর মোট দৈর্ঘ্য কত কিমি? (What is the length of Padma Bridge in km?)`,
    o: (t) => ["৬.১৫ কিমি", "৫.১৫ কিমি", "৭.১৫ কিমি", "৯.১৮ কিমি"],
    c: (t) => 0,
    e: (t) => `পদ্মা সেতুর মূল দৈর্ঘ্য ৬.১৫ কিমি (স্প্যান সংখ্যা ৪১টি, পিলার ৪২টি)।`
  },
  {
    q: (t) => `বাংলাদেশের সংবিধানের অভিভাবক ও চরম ব্যাখ্যাকারক কে? (Who is the guardian of Bangladesh Constitution?)`,
    o: (t) => ["সুপ্রিম কোর্ট (Supreme Court)", "রাষ্ট্রপতি", "সংসদ", "আইন মন্ত্রণালয়"],
    c: (t) => 0,
    e: (t) => `সুপ্রিম কোর্ট হলো সংবিধানের অভিভাবক ও চরম ব্যাখ্যাকারক।`
  },
  {
    q: (t) => `ইউনেস্কো সুন্দরবনকে কত সালে বিশ্ব ঐতিহ্য ঘোষণা করে? (What year UNESCO declared Sundarbans as World Heritage?)`,
    o: (t) => ["১৯৯৭", "১৯৯৯", "১৯৭১", "২০০১"],
    c: (t) => 0,
    e: (t) => `ইউনেস্কো ১৯৯৭ সালের ৬ ডিসেম্বর সুন্দরবনকে ৭৯৮তম বিশ্ব ঐতিহ্য হিসেবে ঘোষণা করে।`
  },
  {
    q: (t) => `জাতিসংঘের বর্তমান সদস্য সংখ্যা কতটি দেশ? (How many member countries in UN?)`,
    o: (t) => ["১৯৩টি (193)", "১৯২টি", "১৯৫টি", "১৯৪টি"],
    c: (t) => 0,
    e: (t) => `জাতিসংঘের বর্তমান সাধারণ পরিষদের সদস্য সংখ্যা ১৯৩। সর্বশেষ সদস্য দেশ দক্ষিণ সুদান।`
  },
  {
    q: (t) => `আন্তর্জাতিক আদালতের (ICJ) সদর দপ্তর কোথায় অবস্থিত? (Headquarters of ICJ is in?)`,
    o: (t) => ["হেগ, নেদারল্যান্ডস (The Hague)", "নিউইয়র্ক, ইউএসএ", "জেনেভা, সুইজারল্যান্ড", "প্যারিস, ফ্রান্স"],
    c: (t) => 0,
    e: (t) => `International Court of Justice (ICJ) নেদারল্যান্ডসের দ্য হেগ শহরে অবস্থিত।`
  },
  {
    q: (t) => `ইউরোপীয় ইউনিয়নের (EU) একক মুদ্রা 'ইউরো' কত সালে চালু হয়? (What year Euro currency was launched by EU?)`,
    o: (t) => ["১৯৯৯", "২০০২", "১৯৯৫", "২০০০"],
    c: (t) => 0,
    e: (t) => `ইউরো মুদ্রা আনুষ্ঠানিকভাবে ১৯৯৯ সালের ১ জানুয়ারি হিসাবরক্ষণের জন্য চালু হয় এবং কাগজের মুদ্রা হিসেবে ২০০২ সালের ১ জানুয়ারি চালু হয়।`
  },
  {
    q: (t) => `কোন প্রণালী এশিয়া ও উত্তর আমেরিকা মহাদেশকে পৃথক করেছে? (Which strait separates Asia from North America?)`,
    o: (t) => ["বেরিং প্রণালী (Bering Strait)", "জিব্রাল্টার প্রণালী", "মালাক্কা প্রণালী", "বসফরাস প্রণালী"],
    c: (t) => 0,
    e: (t) => `বেরিং প্রণালী এশিয়া (রাশিয়া) ও উত্তর আমেরিকা (আলাস্কা) মহাদেশকে বিভক্ত করেছে।`
  },
  {
    q: (t) => `গ্রিনউইচ মান সময় অপেক্ষা বাংলাদেশের সময় কত ঘণ্টা এগিয়ে? (Bangladesh time is how many hours ahead of GMT?)`,
    o: (t) => ["+৬ ঘণ্টা (+6 hours)", "+৫ ঘণ্টা", "-৬ ঘণ্টা", "+৮ ঘণ্টা"],
    c: (t) => 0,
    e: (t) => `বাংলাদেশের প্রমাণ সময় গ্রিনউইচ মান সময় (GMT) অপেক্ষা ৬ ঘণ্টা এগিয়ে (+6 hours)।`
  },
  {
    q: (t) => `বিশ্বের দীর্ঘতম নদী কোনটি? (Which is the longest river in the world?)`,
    o: (t) => ["নীলনদ (Nile)", "অ্যামাজন (Amazon)", "মিসিসিপি", "ইয়াংসি"],
    c: (t) => 0,
    e: (t) => `নীলনদ বিশ্বের দীর্ঘতম নদী (আফ্রিকা মহাদেশে)। তবে পানি প্রবাহ ও আয়তনের দিক থেকে অ্যামাজন বৃহত্তম নদী।`
  },
  {
    q: (t) => `এসডিজি (SDG) বা টেকসই উন্নয়ন লক্ষ্যমাত্রার লক্ষ্য কতটি? (How many goals in Sustainable Development Goals SDG?)`,
    o: (t) => ["১৭টি (17)", "৮টি", "১৫টি", "৩০টি"],
    c: (t) => 0,
    e: (t) => `টেকসই উন্নয়ন লক্ষ্যমাত্রা (SDG) এর মোট ১৭টি লক্ষ্য এবং ১৬৯টি সুনির্দিষ্ট টার্গেট রয়েছে, যা ২০৩০ সালের মধ্যে অর্জনের লক্ষ্য রাখা হয়েছে।`
  },
  {
    q: (t) => `নোবেল পুরস্কার প্রথম কত সালে দেওয়া হয়? (What year Nobel Prizes were awarded first?)`,
    o: (t) => ["১৯০১", "১৯০৫", "১৮৯৫", "১৯১৩"],
    c: (t) => 0,
    e: (t) => `আলফ্রেড নোবেলের উইল অনুযায়ী ১৯০১ সাল থেকে পদার্থ, রসায়ন, চিকিৎসাবিজ্ঞান, সাহিত্য ও শান্তিতে নোবেল দেওয়া শুরু হয়। ১৯৬৯ সালে অর্থনীতি যুক্ত হয়।`
  },
  {
    q: (t) => `গ্রিনহাউজ গ্যাসের প্রধান উপাদান কোনটি? (What is the main component of Greenhouse gas?)`,
    o: (t) => ["কার্বন ডাই অক্সাইড (CO₂)", "মিথেন", "সিএফসি (CFC)", "নাইট্রাস অক্সাইড"],
    c: (t) => 0,
    e: (t) => `গ্রিনহাউস প্রতিক্রিয়ার জন্য কার্বন ডাই অক্সাইড (CO₂) প্রায় ৬০% দায়ী।`
  },
  {
    q: (t) => `বিখ্যাত চিত্রকর্ম "মোনালিসা" কার আঁকা? (Who painted the famous artwork "Monalisa"?)`,
    o: (t) => ["লিওনার্দো দা ভিঞ্চি", "পাবলো পিকাসো", "মাইকেল এঞ্জেলো", "ভ্যান গগ"],
    c: (t) => 0,
    e: (t) => `ইতালীয় রেনেসাঁ শিল্পী লিওনার্দো দা ভিঞ্চি ১৫০৩-১৫০৬ সালের দিকে মোনালিসা চিত্রকর্মটি আঁকেন।`
  },
  {
    q: (t) => `বিশ্ব পরিবেশ দিবস কবে পালিত হয়? (When is World Environment Day celebrated?)`,
    o: (t) => ["৫ জুন (June 5)", "২২ এপ্রিল", "১ মে", "১০ ডিসেম্বর"],
    c: (t) => 0,
    e: (t) => `প্রতি বছর ৫ জুন বিশ্ব পরিবেশ দিবস পালিত হয়। ২২ এপ্রিল ধরিত্রী দিবস।`
  },
  {
    q: (t) => `ওপেক (OPEC) কোন ধরণের সংস্থা? (What type of organization is OPEC?)`,
    o: (t) => ["তেল রপ্তানিকারক দেশগুলোর সংস্থা", "পরিবেশবাদী সংস্থা", "পারমাণবিক শক্তি সংস্থা", "মানবাধিকার সংস্থা"],
    c: (t) => 0,
    e: (t) => `OPEC (Organization of the Petroleum Exporting Countries) হলো জ্বালানি তেল রপ্তানিকারক দেশসমূহের জোট। এর সদর দপ্তর অস্ট্রিয়ার ভিয়েনায় অবস্থিত।`
  },
  {
    q: (t) => `ইতিহাসের জনক বলা হয় কাকে? (Who is called the Father of History?)`,
    o: (t) => ["হেরোডোটাস (Herodotus)", "অ্যারিস্টটল", "সক্রেটিস", "প্লেটো"],
    c: (t) => 0,
    e: (t) => `গ্রিক লেখক হেরোডোটাসকে ইতিহাসের জনক এবং হিপোক্রেটিসকে চিকিৎসাবিজ্ঞানের জনক বলা হয়।`
  },
  {
    q: (t) => `লৌহমানবী (Iron Lady) বলা হতো কাকে? (Who was known as the Iron Lady?)`,
    o: (t) => ["মার্গারেট থ্যাচার (Margaret Thatcher)", "ইন্দিরা গান্ধী", "অং সান সু চি", "বেনজীর ভুট্টো"],
    c: (t) => 0,
    e: (t) => `যুক্তরাজ্যের প্রথম নারী প্রধানমন্ত্রী মার্গারেট থ্যাচারকে তার অনমনীয় নীতি ও অনমনীয় রাজনৈতিক নেতৃত্বশৈলীর কারণে 'লৌহমানবী' বলা হতো।`
  },
  {
    q: (t) => `সূর্য থেকে পৃথিবীতে আলো আসতে কত সময় লাগে? (How long does sunlight take to reach Earth?)`,
    o: (t) => ["৮ মিনিট ২০ সেকেন্ড", "১০ মিনিট", "৫ মিনিট", "১২ মিনিট"],
    c: (t) => 0,
    e: (t) => `সূর্য থেকে আলো পৃথিবীতে আসতে আনুমানিক ৫০০ সেকেন্ড বা ৮ মিনিট ২০ সেকেন্ড সময় নেয়।`
  },
  {
    q: (t) => `কম্পিউটারের মস্তিষ্ক (Brain) বলা হয় কোন অংশটিকে? (Which part is called the brain of computer?)`,
    o: (t) => ["সিপিইউ (CPU)", "র‍্যাম (RAM)", "হার্ডডিস্ক", "মাদারবোর্ড"],
    c: (t) => 0,
    e: (t) => `Central Processing Unit (CPU) কে কম্পিউটারের মস্তিষ্ক বলা হয় কারণ এটি সমস্ত ডাটা প্রসেস করে।`
  },
  {
    q: (t) => `পোলিও টিকা কে আবিষ্কার করেন? (Who discovered Polio vaccine?)`,
    o: (t) => ["জোনাস সল্ক (Jonas Salk)", "এডওয়ার্ড জেনার", "লুই পাস্তুর", "আলেকজান্ডার ফ্লেমিং"],
    c: (t) => 0,
    e: (t) => `জোনাস সল্ক ১৯৫২ সালে নিষ্ক্রিয় পোলিও ভাইরাস ভ্যাকসিন তৈরি করেন। এডওয়ার্ড জেনার জলবসন্তের টিকা আবিষ্কার করেন।`
  },
  {
    q: (t) => `বাংলাদেশের জাতীয় পতাকার দৈর্ঘ্য ও প্রস্থের অনুপাত কত? (Ratio of length and width of Bangladesh national flag?)`,
    o: (t) => ["১০:৬ (বা ৫:৩)", "১০:৫ (বা ২:১)", "৪:৩", "৫:৪"],
    c: (t) => 0,
    e: (t) => `বাংলাদেশের পতাকার অনুপাত ১০:৬ বা লঘিষ্ঠ আকারে ৫:৩। বৃত্তের ব্যাসার্ধ দৈর্ঘ্যের ৫ ভাগের ১ ভাগ।`
  },
  {
    q: (t) => `সার্ক (SAARC) এর সদর দপ্তর কোথায় অবস্থিত? (Headquarters of SAARC is in?)`,
    o: (t) => ["কাঠমান্ডু, নেপাল (Kathmandu)", "ঢাকা, বাংলাদেশ", "নয়াদিল্লি, ভারত", "কলম্বো, শ্রীলঙ্কা"],
    c: (t) => 0,
    e: (t) => `সার্ক ১৯৮৫ সালে ঢাকায় গঠিত হলেও এর স্থায়ী সচিবালয় বা সদর দপ্তর নেপালের কাঠমান্ডুতে অবস্থিত।`
  },
  {
    q: (t) => `বিশ্ব স্বাস্থ্য সংস্থার (WHO) সদর দপ্তর কোথায় অবস্থিত? (Headquarters of WHO is in?)`,
    o: (t) => ["জেনেভা, সুইজারল্যান্ড (Geneva)", "নিউইয়র্ক, ইউএসএ", "লন্ডন, যুক্তরাজ্য", "রোম, ইতালি"],
    c: (t) => 0,
    e: (t) => `World Health Organization (WHO) সুইজারল্যান্ডের জেনেভা শহরে অবস্থিত।`
  },
  {
    q: (t) => `প্রথম নোবেলজয়ী বাঙালি কে? (Who is the first Bengali to win a Nobel Prize?)`,
    o: (t) => ["রবীন্দ্রনাথ ঠাকুর", "ড. অমর্ত্য সেন", "ড. মুহাম্মদ ইউনূস", "সত্যেন্দ্রনাথ বসু"],
    c: (t) => 0,
    e: (t) => `রবীন্দ্রনাথ ঠাকুর ১৯১৩ সালে সাহিত্যে নোবেল পেয়ে প্রথম বাঙালি হিসেবে এই সম্মান লাভ করেন।`
  },
  {
    q: (t) => `মানবদেহের স্বাভাবিক তাপমাত্রা কত ডিগ্রি ফারেনহাইট? (Normal human body temperature in Fahrenheit?)`,
    o: (t) => ["৯৮.৪° F", "৯৭° F", "৯৯° F", "৯৮.৬° F"],
    c: (t) => 0,
    e: (t) => `মানবদেহের স্বাভাবিক গড় তাপমাত্রা ৯৮.৪° F বা ৩৭° C।`
  }
];

// ─────────────────────────────────────────────────────────────────────────
// 8. ACCOUNTING TEMPLATES (25 Items)
// ─────────────────────────────────────────────────────────────────────────
const accountingTemplates = [
  {
    q: (t) => `হিসাববিজ্ঞানের মূল ভিত্তি কোনটি? (What is the foundation of accounting?)`,
    o: (t) => ["লেনদেন (Transaction)", "হিসাব বই", "দাখিলা", "আর্থিক বিবরণী"],
    c: (t) => 0,
    e: (t) => `লেনদেনই হিসাববিজ্ঞানের মূল ভিত্তি। কারণ লেনদেন ছাড়া হিসাবভুক্তির কোনো কাজ শুরু হতে পারে না।`
  },
  {
    q: (t) => `দুতরফা দাখিলা পদ্ধতি (Double Entry System) কে প্রবর্তন করেন? (Who introduced Double Entry System?)`,
    o: (t) => ["লুকা প্যাসিওলি (Luca Pacioli)", "অ্যাডাম স্মিথ", "এফ ডব্লিউ টেইলর", "হেনরি ফায়োল"],
    c: (t) => 0,
    e: (t) => `১৪৯৪ সালে ইতালীয় গণিতবিদ লুকা প্যাসিওলি তার সুপরিচিত গণিতশাস্ত্রে দুতরফা দাখিলা পদ্ধতির দ্বৈত সত্তার আলোচনা করেন।`
  },
  {
    q: (t) => `হিসাব সমীকরণ A = L + OE তে A দ্বারা কী নির্দেশ করে? (In A = L + OE, what does A represent?)`,
    o: (t) => ["সম্পদ (Assets)", "দায় (Liabilities)", "মালিকানা স্বত্ব (Equity)", "আয় (Revenues)"],
    c: (t) => 0,
    e: (t) => `A = Assets (সম্পদ), L = Liabilities (দায়), OE = Owner's Equity (মালিকানা স্বত্ব)।`
  },
  {
    q: (t) => `নিচের কোনটি অস্পর্শনীয় সম্পদ? (Which of the following is an Intangible Asset?)`,
    o: (t) => ["সুনাম (Goodwill)", "আসবাবপত্র (Furniture)", "দালানকোঠা", "মজুদ পণ্য"],
    c: (t) => 0,
    e: (t) => `সুনাম, ট্রেডমার্ক, কপিরাইট, পেটেন্ট হলো অস্পর্শনীয় সম্পদ। আসবাবপত্র ও দালানকোঠা দৃশ্যমান স্থায়ী সম্পদ।`
  },
  {
    q: (t) => `রেওয়ামিলের ডেবিট ও ক্রেডিট পাশের যোগফল সমান না হলে তাৎক্ষণিকভাবে কোন হিসাব খোলা হয়? (Which temporary account is opened if Trial Balance doesn't match?)`,
    o: (t) => ["গরমিল/অনিশ্চিত হিসাব (Suspense Account)", "লাভ-ক্ষতি হিসাব", "নগদান হিসাব", "মূলধন হিসাব"],
    c: (t) => 0,
    e: (t) => `সাময়িকভাবে রেওয়ামিল মেলানোর জন্য অনিশ্চিত হিসাব (Suspense Account) খোলা হয়, যা পরে ভুল চিহ্নিত হলে বন্ধ করা হয়।`
  },
  {
    q: (t) => `ক্রয়কৃত স্থায়ী সম্পদের পরিবহন খরচ কোন জাতীয় ব্যয়? (Transportation cost of purchased fixed asset is which type of expenditure?)`,
    o: (t) => ["মূলধন জাতীয় ব্যয় (Capital Expenditure)", "মুনাফা জাতীয় ব্যয় (Revenue)", "বিলম্বিত ব্যয়", "চলতি ব্যয়"],
    c: (t) => 0,
    e: (t) => `স্থায়ী সম্পদ ব্যবহারের উপযোগী করার পূর্ব পর্যন্ত সমস্ত আনুষঙ্গিক খরচ (যেমন পরিবহন, সংস্থাপন) মূলধন জাতীয় ব্যয় এবং তা সংশ্লিষ্ট সম্পদের মূল্যের সাথে যোগ হয়।`
  },
  {
    q: (t) => `হিসাববিজ্ঞানের কোন নীতি অনুযায়ী অবচয় ধার্য করা হয়? (Which accounting principle governs charging Depreciation?)`,
    o: (t) => ["মিলকরণ নীতি (Matching Principle)", "চলমান প্রতিষ্ঠান নীতি", "ঐতিহাসিক মূল্য নীতি", "সত্তা নীতি"],
    c: (t) => 0,
    e: (t) => `মিলকরণ নীতি অনুযায়ী একটি হিসাবকালের আয়ের বিপরীতে ওই সময়ের ব্যবহৃত সম্পদের অবচয় ব্যয় হিসেবে সমন্বয় করা হয়।`
  },
  {
    q: (t) => `আসবাবপত্রের ওপর অবচয় ধার্য করা হলে জাবেদা দাখিলা কী হবে? (What is the journal entry for depreciation on furniture?)`,
    o: (t) => ["অবচয় হিসাব ডেবিট, পুঞ্জীভূত অবচয় হিসাব ক্রেডিট", "আসবাবপত্র হিসাব ডেবিট, অবচয় হিসাব ক্রেডিট", "অবচয় হিসাব ডেবিট, আসবাবপত্র হিসাব ক্রেডিট", "নগদান হিসাব ডেবিট, অবচয় হিসাব ক্রেডিট"],
    c: (t) => 0,
    e: (t) => `আধুনিক নিয়মে অবচয়ের জাবেদা হলো: অবচয় হিসাব (ব্যয়) ডেবিট এবং পুঞ্জীভূত অবচয় হিসাব (বিপরীত সম্পদ) ক্রেডিট।`
  },
  {
    q: (t) => `চলতি অনুপাতের (Current Ratio) আদর্শ মান কত? (What is the ideal standard of Current Ratio?)`,
    o: (t) => ["২:১ (2:1)", "১:১", "৩:১", "১:২"],
    c: (t) => 0,
    e: (t) => `চলতি সম্পদের সাথে চলতি দায়ের অনুপাতকে চলতি অনুপাত বলে। এর সন্তোষজনক আদর্শ মান হলো ২:১।`
  },
  {
    q: (t) => `তারল্য অনুপাতের (Liquid/Acid-test Ratio) আদর্শ মান কত? (Ideal standard of Acid-test Ratio?)`,
    o: (t) => ["১:১ (1:1)", "২:১", "৩:১", "১:২"],
    c: (t) => 0,
    e: (t) => `তারল্য বা ত্বরিত অনুপাতের আদর্শ মান ১:১। এটি কোম্পানির অতি দ্রুত দায় মেটানোর ক্ষমতা পরিমাপ করে।`
  },
  {
    q: (t) => `বিক্রিত পণ্যের ব্যয়ের (COGS) সমীকরণ কোনটি? (Equation of Cost of Goods Sold?)`,
    o: (t) => ["প্রারম্ভিক মজুদ + নিট ক্রয় + প্রত্যক্ষ খরচ - সমাপনী মজুদ", "প্রারম্ভিক মজুদ + নিট বিক্রয় - সমাপনী মজুদ", "ক্রয় + বিক্রয় - মজুদ", "চলতি সম্পদ - চলতি দায়"],
    c: (t) => 0,
    e: (t) => `COGS = Opening Inventory + Net Purchases + Direct Expenses - Closing Inventory.`
  },
  {
    q: (t) => `ব্যাংক সমন্বয় বিবরণী (Bank Reconciliation) কে প্রস্তুত করেন? (Who prepares Bank Reconciliation Statement?)`,
    o: (t) => ["আমানতকারী / গ্রাহক (Depositor)", "ব্যাংক কর্তৃপক্ষ", "সরকার", "নিরীক্ষক"],
    c: (t) => 0,
    e: (t) => `আমানতকারী তার নিজস্ব নগদান বইয়ের ব্যাংক কলামের সাথে ব্যাংকের দেওয়া পাসবইয়ের গরমিল মেলাতে ব্যাংক সমন্বয় বিবরণী তৈরি করে।`
  },
  {
    q: (t) => `অবচয় নির্ধারণের সরলরৈখিক পদ্ধতিতে প্রতি বছরের অবচয়ের পরিমাণ কেমন থাকে? (In straight-line depreciation method, annual depreciation remains?)`,
    o: (t) => ["সমান থাকে (Constant)", "হ্রাস পায়", "বৃদ্ধি পায়", "পরিবর্তনশীল হয়"],
    c: (t) => 0,
    e: (t) => `সরলরৈখিক বা স্থির কিস্তি পদ্ধতিতে প্রতি বছর অবচয়ের পরিমাণ সমান বা অপরিবর্তিত থাকে।`
  },
  {
    q: (t) => `মালিকানা স্বত্ব হ্রাস পায় নিচের কোনটির দ্বারা? (Owner's equity decreases due to?)`,
    o: (t) => ["উত্তোলন ও খরচ (Drawings and Expenses)", "মূলধন বিনিয়োগ", "আয়", "সম্পদ ক্রয়"],
    c: (t) => 0,
    e: (t) => `মালিকের উত্তোলন ও ব্যবসার খরচের কারণে মালিকানা স্বত্ব হ্রাস পায়। আয় ও মূলধন বিনিয়োগের ফলে মালিকানা স্বত্ব বৃদ্ধি পায়।`
  },
  {
    q: (t) => `আর্থিক অবস্থার বিবরণী (Balance Sheet) কোন উদ্দেশ্যে প্রস্তুত করা হয়? (Why Balance Sheet is prepared?)`,
    o: (t) => ["নির্দিষ্ট তারিখে আর্থিক অবস্থা যাচাই করতে", "মুনাফা নির্ণয় করতে", "নগদ প্রবাহ দেখতে", "ব্যয় নিয়ন্ত্রণ করতে"],
    c: (t) => 0,
    e: (t) => `ব্যালেন্স শিট বা আর্থিক অবস্থার বিবরণী নির্দিষ্ট তারিখে কারবারের মোট সম্পদ, দায় ও মালিকানা স্বত্ব প্রদর্শন করে আর্থিক চিত্র তুলে ধরে।`
  },
  {
    q: (t) => `অনাদায়ী পাওনা সঞ্চিতি (Provision for Bad Debts) হিসাববিজ্ঞানের কোন নীতি অনুসারে তৈরি করা হয়? (Which principle dictates bad debt provision?)`,
    o: (t) => ["রক্ষণশীলতার নীতি (Conservatism)", "চলমান প্রতিষ্ঠান নীতি", "পূর্ণ প্রকাশ নীতি", "সত্তা নীতি"],
    c: (t) => 0,
    e: (t) => `রক্ষণশীলতার নীতি অনুযায়ী সম্ভাব্য ক্ষতি বা ব্যয়ের জন্য আগে থেকেই সঞ্চিতি রাখা হয়, কিন্তু সম্ভাব্য লাভকে হিসাবভুক্ত করা হয় না।`
  },
  {
    q: (t) => `মজুদ পণ্য মূল্যায়নে FIFO পদ্ধতির পূর্ণরূপ কী? (Full form of FIFO in inventory valuation?)`,
    o: (t) => ["First In, First Out", "Fast In, Fast Out", "Final In, First Out", "First In, Final Out"],
    c: (t) => 0,
    e: (t) => `FIFO = First In, First Out (আগে আসা পণ্য আগে ছাড়া হবে)। LIFO = Last In, First Out।`
  },
  {
    q: (t) => `কারবারি বাট্টা (Trade Discount) হিসাবের বইতে কেমন প্রভাব ফেলে? (How trade discount affects accounts book?)`,
    o: (t) => ["হিসাবভুক্ত করা হয় না (Not recorded)", "ডেবিট করা হয়", "ক্রেডিট করা হয়", "আলাদা জাবেদা হয়"],
    c: (t) => 0,
    e: (t) => `কারবারি বাট্টা পণ্য ক্রয়-বিক্রয়ের চালানি মূল্য থেকে সরাসরি বাদ দেওয়া হয়, এটি হিসাবের বইতে কোনো পক্ষেই হিসাবভুক্ত বা রেকর্ড করা হয় না।`
  },
  {
    q: (t) => `নগদ বাট্টা (Cash Discount) কখন পাওয়া যায়? (When cash discount is received?)`,
    o: (t) => ["দ্রুত দেনা পাওনা নিষ্পত্তির সময়", "পণ্য ক্রয়ের সময়", "পণ্য বিক্রয়ের সময়", "অবচয় ধার্যের সময়"],
    c: (t) => 0,
    e: (t) => `বাকিতে কেনাবেচার দেনা-পাওনা দ্রুত আদায় বা পরিশোধের জন্য দেনাদারকে যে ছাড় দেওয়া হয় তা নগদ বাট্টা।`
  },
  {
    q: (t) => `মুনাফা অর্জনের উদ্দেশ্যে ব্যবসায় নিজস্ব ব্যবহারের জন্য কাগজের খাতা বা কলম ক্রয় করা হলে কোন হিসাব ডেবিট হবে? (If paper/pen purchased for office use, which account is debited?)`,
    o: (t) => ["মনিহারি হিসাব (Stationery Account)", "ক্রয় হিসাব", "নগদান হিসাব", "অফিস সরঞ্জাম হিসাব"],
    c: (t) => 0,
    e: (t) => `কাগজ, কলম, কার্বন, ফাইল ইত্যাদি ক্রয় করলে তা 'মনিহারি ব্যয়' হিসেবে গণ্য হয় এবং মনিহারি হিসাব ডেবিট হয়।`
  },
  {
    q: (t) => `কম্পিউটার বা এসি ক্রয় করা হলে কোন হিসাব ডেবিট করতে হবে? (If AC or computer is purchased, which account is debited?)`,
    o: (t) => ["অফিস সরঞ্জাম হিসাব (Office Equipment)", "মনিহারি হিসাব", "ক্রয় হিসাব", "আসবাবপত্র হিসাব"],
    c: (t) => 0,
    e: (t) => `কম্পিউটার, প্রিন্টার, এসি, টাইপরাইটার ইত্যাদি ব্যবহারের জন্য কেনা স্থায়ী টেকনিক্যাল ডিভাইসগুলোকে 'অফিস সরঞ্জাম' হিসেবে ডেবিট করা হয়।`
  },
  {
    q: (t) => `হিসাববিজ্ঞানের কোন ধারণা অনুযায়ী মালিক ও ব্যবসা প্রতিষ্ঠানকে পৃথক ভাবা হয়? (Which concept separates owner from business?)`,
    o: (t) => ["ব্যবসায়িক সত্তা ধারণা (Entity concept)", "হিসাবকাল ধারণা", "অর্থের মাপকাঠি ধারণা", "দ্বৈত সত্তা ধারণা"],
    c: (t) => 0,
    e: (t) => `সত্তা ধারণা অনুযায়ী মালিক ও ব্যবসায়িক প্রতিষ্ঠান সম্পূর্ণ আলাদা দুটি ভিন্ন সত্তা। তাই মালিকের মূলধনকে ব্যবসার দায় ভাবা হয়।`
  },
  {
    q: (t) => `নগদান বই সবসময় কোন ব্যালেন্স প্রকাশ করে? (Cash book always shows which balance?)`,
    o: (t) => ["ডেবিট ব্যালেন্স বা শূন্য", "ক্রেডিট ব্যালেন্স", "সবসময় ক্রেডিট", "ঋণাত্মক ব্যালেন্স"],
    c: (t) => 0,
    e: (t) => `হাতে নগদ টাকা যতটুকু আছে তার চেয়ে বেশি খরচ করা সম্ভব নয়। তাই নগদান বই সর্বদা ডেবিট ব্যালেন্স প্রকাশ করে অথবা শূন্য হয়।`
  },
  {
    q: (t) => `বিক্রয় বইতে (Sales Book) কোন লেনদেন লিপিবদ্ধ করা হয়? (Which transaction is recorded in Sales Book?)`,
    o: (t) => ["বাকিতে পণ্য বিক্রয় (Credit sales of goods)", "নগদে পণ্য বিক্রয়", "আসবাবপত্র বিক্রয়", "সব ধরণের বিক্রয়"],
    c: (t) => 0,
    e: (t) => `বিক্রয় বইতে শুধুমাত্র বাকিতে বা ধারে পণ্য বিক্রয় লিপিবদ্ধ করা হয়। নগদ বিক্রয় নগদান বইতে যায়।`
  },
  {
    q: (t) => `হিসাববিজ্ঞানের আন্তর্জাতিক মান নিয়ন্ত্রণকারী সংস্থা কোনটি? (Global regulatory body for accounting standards?)`,
    o: (t) => ["IASB", "IFRS", "GAAP", "AICPA"],
    c: (t) => 0,
    e: (t) => `International Accounting Standards Board (IASB) আন্তর্জাতিক হিসাবমান (IFRS) প্রণয়ন ও নিয়ন্ত্রণ করে।`
  }
];

// ─────────────────────────────────────────────────────────────────────────
// 9. BUSINESS STUDIES TEMPLATES (25 Items)
// ─────────────────────────────────────────────────────────────────────────
const businessStudiesTemplates = [
  {
    q: (t) => `ব্যবসার অন্যতম প্রধান ও মৌলিক উদ্দেশ্য কোনটি? (What is the primary and basic objective of business?)`,
    o: (t) => ["মুনাফা অর্জন (Profit Making)", "জনসেবা", "উৎপাদন", "কর্মসংস্থান সৃষ্টি"],
    c: (t) => 0,
    e: (t) => `ব্যবসায়ের প্রধান চালিকাশক্তি ও মৌলিক উদ্দেশ্য হলো আইনিভাবে পণ্য বা সেবা লেনদেনের মাধ্যমে মুনাফা অর্জন।`
  },
  {
    q: (t) => `একমালিকানা ব্যবসায়ের দায় কেমন? (What is the liability in Sole Proprietorship business?)`,
    o: (t) => ["অসীম (Unlimited)", "সীমাবদ্ধ", "মূলধন সমপরিমাণ", "দায় থাকে না"],
    c: (t) => 0,
    e: (t) => `একমালিকানা ও অংশীদারি ব্যবসায়ের দায় অসীম। অর্থাৎ ব্যবসায়িক দেনার জন্য মালিকের ব্যক্তিগত সম্পত্তিও দায়ী হতে পারে।`
  },
  {
    q: (t) => `অংশীদারি ব্যবসায়ের চুক্তিপত্র মৌখিক হতে পারে কি? (Can a partnership agreement be verbal?)`,
    o: (t) => ["হ্যাঁ, তবে লিখিত ও নিবন্ধিত হওয়া উত্তম", "না, কখনোই নয়", "শুধু নিবন্ধিত হতে হবে", "আইনত অবৈধ"],
    c: (t) => 0,
    e: (t) => `১৯৩২ সালের অংশীদারি আইন অনুযায়ী অংশীদারি চুক্তিপত্র মৌখিক, লিখিত বা নিবন্ধিত হতে পারে। তবে প্রমাণস্বরূপ লিখিত ও নিবন্ধিত হওয়া সর্বোত্তম।`
  },
  {
    q: (t) => `অংশীদারি ব্যবসায় সর্বোচ্চ অংশীদার সংখ্যা কতজন? (What is the maximum number of partners in a general partnership?)`,
    o: (t) => ["২০ জন (20)", "১০ জন", "৫০ জন", "অসীম"],
    c: (t) => 0,
    e: (t) => `সাধারণ অংশীদারি ব্যবসায়ের অংশীদার সংখ্যা সর্বনিম্ন ২ এবং সর্বোচ্চ ২০ জন। ব্যাংকিং ব্যবসায়ের ক্ষেত্রে সর্বোচ্চ ১০ জন।`
  },
  {
    q: (t) => `যৌথ মূলধনী কোম্পানির মূল দলিলের নাম কী, যা কোম্পানির গঠনতন্ত্র নির্দেশ করে? (Constitutional document of Joint Stock Company?)`,
    o: (t) => ["স্মারক লিপি / পরিমেলবন্ধ (Memorandum of Association)", "পরিমেল নিয়মাবলী (Articles)", "কার্যারম্ভের অনুমতিপত্র", "নিবন্ধন পত্র"],
    c: (t) => 0,
    e: (t) => `Memorandum of Association (MoA) হলো কোম্পানির মূল সনদ বা সংবিধান, যেখানে কোম্পানির নাম, উদ্দেশ্য, মূলধন ও সীমাবদ্ধতা লেখা থাকে।`
  },
  {
    q: (t) => `পাবলিক লিমিটেড কোম্পানির সর্বনিম্ন শেয়ারহোল্ডার সংখ্যা কতজন? (Minimum shareholders in Public Limited Company?)`,
    o: (t) => ["৭ জন (7)", "২ জন", "৫০ জন", "শেয়ার সংখ্যা দ্বারা সীমাবদ্ধ"],
    c: (t) => 0,
    e: (t) => `পাবলিক লিমিটেড কোম্পানিতে সর্বনিম্ন সদস্য ৭ জন এবং সর্বোচ্চ সদস্য সংখ্যা শেয়ার সংখ্যা দ্বারা সীমাবদ্ধ। প্রাইভেট লিমিটেডে সর্বনিম্ন ২ এবং সর্বোচ্চ ৫০ জন।`
  },
  {
    q: (t) => `কোম্পানি কৃত্রিম ব্যক্তি সত্তার অধিকারী বলতে কী বোঝায়? (What does artificial personality of a company mean?)`,
    o: (t) => ["নিজের নামে অন্যের সাথে চুক্তি ও মামলা করতে পারা", "কোম্পানি কখনো মরে না", "শেয়ার হস্তান্তর করতে পারা", "মালিকের পৃথক সত্তা থাকা"],
    c: (t) => 0,
    e: (t) => `কোম্পানি আইনের মাধ্যমে সৃষ্ট এক ধরণের ব্যক্তি সত্তা যা রক্ত-মাংসের মানুষ না হয়েও নিজের নামে সিল ব্যবহার করে অন্যের সাথে লেনদেন, চুক্তি ও মামলা করতে পারে।`
  },
  {
    q: (t) => `ব্যবস্থাপনার জনক বলা হয় কাকে? (Who is called the Father of Modern Management?)`,
    o: (t) => ["হেনরি ফায়োল (Henri Fayol)", "এফ ডব্লিউ টেইলর", "এলটন মেও", "অ্যাডাম স্মিথ"],
    c: (t) => 0,
    e: (t) => `হেনরি ফায়োলকে আধুনিক ব্যবস্থাপনার জনক বলা হয়। তিনি ব্যবস্থাপনার ১৪টি মূল নীতি প্রবর্তন করেন। এফ ডব্লিউ টেইলর হলেন বৈজ্ঞানিক ব্যবস্থাপনার জনক।`
  },
  {
    q: (t) => `ব্যবস্থাপনার প্রথম ও প্রধান কাজ কোনটি? (First and primary function of management?)`,
    o: (t) => ["পরিকল্পনা (Planning)", "সংগঠন", "কর্মীসংস্থান", "নিয়ন্ত্রণ (Controlling)"],
    c: (t) => 0,
    e: (t) => `যেকোনো উদ্দেশ্য অর্জনের জন্য অগ্রিম সিদ্ধান্ত গ্রহণই হলো পরিকল্পনা, যা ব্যবস্থাপনার প্রথম ও মৌলিক ধাপ।`
  },
  {
    q: (t) => `ব্যবস্থাপনার সর্বশেষ কাজ কোনটি? (What is the last function of management?)`,
    o: (t) => ["নিয়ন্ত্রণ (Controlling)", "সমন্বয় সাধন", "কর্মীসংস্থান", "প্রেষণা (Motivation)"],
    c: (t) => 0,
    e: (t) => `পরিকল্পনা অনুযায়ী কাজ হচ্ছে কি না তা তদারকি করা এবং বিচ্যুতি হলে সংশোধনমূলক ব্যবস্থা গ্রহণই হলো নিয়ন্ত্রণ (Controlling), যা সর্বশেষ ধাপ।`
  },
  {
    q: (t) => `ব্যবসায়ে 'CSR' বলতে কী বোঝায়? (What does CSR stand for in business?)`,
    o: (t) => ["Corporate Social Responsibility", "Customer Sales Relations", "Common Share Return", "Company Social Rights"],
    c: (t) => 0,
    e: (t) => `CSR = Corporate Social Responsibility (কর্পোরেট সামাজিক দায়বদ্ধতা)। সমাজের ও পরিবেশের প্রতি ব্যবসায়ের কল্যাণমূলক দায়িত্ব পালন।`
  },
  {
    q: (t) => `কর্মী নির্বাচনের (Staff Selection) জন্য বুদ্ধিমত্তা বা দক্ষতা যাচাইয়ের প্রক্রিয়াকে কী বলে? (Process of evaluating candidates?)`,
    o: (t) => ["কর্মী পরীক্ষা / পরীক্ষা গ্রহণ (Testing)", "কর্মী নিয়োগ", "কর্মী সংগ্রহ (Recruitment)", "প্রশিক্ষণ"],
    c: (t) => 0,
    e: (t) => `কর্মী সংগ্রহের পর আবেদনকারীদের মধ্য থেকে যোগ্য কর্মী বাছাই করার জন্য বিভিন্ন লিখিত, মৌখিক বা মনস্তাত্ত্বিক পরীক্ষা গ্রহণকে কর্মী নির্বাচন বলা হয়।`
  },
  {
    q: (t) => `ম্যাসলোর চাহিদা সোপান তত্ত্বের (Maslow's Hierarchy of Needs) প্রথম বা সর্বনিম্ন স্তর কোনটি? (Lowest level in Maslow's pyramid?)`,
    o: (t) => ["জৈবিক চাহিদা (Physiological needs)", "নিরাপত্তার চাহিদা", "সামাজিক চাহিদা", "আত্মপ্রতিষ্ঠার চাহিদা"],
    c: (t) => 0,
    e: (t) => `আব্রাহাম ম্যাসলোর তত্ত্বে ৫টি স্তর রয়েছে। সর্বনিম্ন বা প্রথম স্তর হলো জৈবিক বা শারীরবৃত্তীয় চাহিদা (খাদ্য, বস্ত্র, বাসস্থান)। সর্বোচ্চ স্তর হলো আত্মপ্রতিষ্ঠার চাহিদা।`
  },
  {
    q: (t) => `নেতৃত্বের কোন শৈলীতে নেতা কর্মীদের সাথে আলোচনা করে সিদ্ধান্ত নেন? (Which leadership style involves consulting subordinates?)`,
    o: (t) => ["গণতান্ত্রিক নেতৃত্ব (Democratic)", "স্বৈরতান্ত্রিক নেতৃত্ব", "মুক্ত/লাগামহীন নেতৃত্ব", "পিতৃসুলভ নেতৃত্ব"],
    c: (t) => 0,
    e: (t) => `গণতান্ত্রিক বা অংশগ্রহণমূলক নেতৃত্বে কর্মীদের মতামতের মূল্যায়ন করা হয় এবং সিদ্ধান্ত গ্রহণে তাদের অংশীদার করা হয়।`
  },
  {
    q: (t) => `মার্কেটিং মিক্সের ৪টি 'P' এর অংশ নয় কোনটি? (Which is NOT one of the 4 Ps of Marketing Mix?)`,
    o: (t) => ["People", "Product", "Price", "Place"],
    c: (t) => 0,
    e: (t) => `ম্যাককার্থি প্রবর্তিত ৪টি P হলো: Product, Price, Place, Promotion। People পরবর্তীতে সেবামূলক মার্কেটিংয়ে যুক্ত হলেও প্রথাগত ৪P-এর অংশ নয়।`
  },
  {
    q: (t) => `ব্যবসায়ের সামাজিক পরিবেশের উপাদান কোনটি? (Component of social environment of business?)`,
    o: (t) => ["জনসংখ্যা ও সংস্কৃতি (Population & Culture)", "জলবায়ু ও মাটি", "অর্থনৈতিক নীতিমালা", "আইন শৃঙ্খলা পরিস্থিতি"],
    c: (t) => 0,
    e: (t) => `মানুষের বিশ্বাস, প্রথা, সংস্কৃতি ও জনসংখ্যা হলো সামাজিক পরিবেশের অংশ। জলবায়ু প্রাকৃতিক পরিবেশের অংশ।`
  },
  {
    q: (t) => `সমবায় সমিতির মূল উদ্দেশ্য কী? (Main objective of Cooperative Society?)`,
    o: (t) => ["সদস্যদের কল্যাণ সাধন (Welfare of members)", "সর্বোচ্চ মুনাফা অর্জন", "টাকা ঋণ দেওয়া", "একচেটিয়া ব্যবসা করা"],
    c: (t) => 0,
    e: (t) => `সমবায় সমিতির মূল উদ্দেশ্য মুনাফা অর্জন নয়, বরং পারস্পরিক সহযোগিতা ও একতাবদ্ধতার মাধ্যমে সদস্যদের অর্থনৈতিক কল্যাণ নিশ্চিত করা।`
  },
  {
    q: (t) => `বিশ্ব বাণিজ্য সংস্থা (WTO) এর সদর দপ্তর কোথায় অবস্থিত? (Headquarters of WTO is in?)`,
    o: (t) => ["জেনেভা, সুইজারল্যান্ড", "ওয়াশিংটন, ইউএসএ", "লন্ডন, যুক্তরাজ্য", "ভিয়েনা, অস্ট্রিয়া"],
    c: (t) => 0,
    e: (t) => `World Trade Organization (WTO) ১৯৯৫ সালে প্রতিষ্ঠিত হয় এবং এর সদর দপ্তর সুইজারল্যান্ডের জেনেভায় অবস্থিত।`
  },
  {
    q: (t) => `ব্যবসায়ের অভ্যন্তরীণ পরিবেশের উপাদান কোনটি? (Component of internal business environment?)`,
    o: (t) => ["প্রতিষ্ঠানের নিজস্ব কর্মী ও সুযোগ সুবিধা", "প্রতিযোগী", "ক্রেতা সাধারণ", "সরকারি নীতি"],
    c: (t) => 0,
    e: (t) => `প্রতিষ্ঠানের নিজস্ব পরিচালনা পর্ষদ, মূলধন, কর্মী ও সুযোগ-সুবিধা হলো অভ্যন্তরীণ পরিবেশ, যা নিয়ন্ত্রণযোগ্য। ক্রেতা ও প্রতিযোগী বাহ্যিক পরিবেশ।`
  },
  {
    q: (t) => `কোনটি ব্যবসায়ের ঝুঁকি হ্রাসের বা বীমাকরণের মাধ্যমে দূর করা যায়? (Which barrier can be resolved by Insurance?)`,
    o: (t) => ["ঝুঁকি ও ক্ষতি সংক্রান্ত বাধা (Risk barrier)", "স্থানগত বাধা", "কালগত বাধা", "জ্ঞানগত বাধা"],
    c: (t) => 0,
    e: (t) => `ঝুঁকিজনিত বাধা দূর করে বীমা (Insurance), স্থানগত বাধা দূর করে পরিবহন এবং কালগত বা সময়গত বাধা দূর করে গুদামজাতকরণ।`
  },
  {
    q: (t) => `ব্যবসায়ের আইনগত পরিবেশের গুরুত্বপূর্ণ আইন কোনটি? (Important act in legal environment?)`,
    o: (t) => ["ভোক্তা অধিকার সংরক্ষণ আইন (Consumer protection act)", "ঋণ ও কর নীতি", "জাতীয় সংস্কৃতি নীতি", "পরিবেশ নীতি"],
    c: (t) => 0,
    e: (t) => `ভোক্তা অধিকার সংরক্ষণ আইন, ট্রেডমার্ক আইন, পেটেন্ট ও ডিজাইন আইন আইনগত পরিবেশের মূল অঙ্গ।`
  },
  {
    q: (t) => `অংশীদারি ব্যবসায়ের নিবন্ধন বাংলাদেশে বাধ্যতামূলক কি? (Is partnership registration compulsory in Bangladesh?)`,
    o: (t) => ["না, এটি ঐচ্ছিক (Optional)", "হ্যাঁ, বাধ্যতামূলক", "নিবন্ধন না করলে ব্যবসা অবৈধ", "শুধুমাত্র ব্যাংক অংশীদারিতে বাধ্যতামূলক"],
    c: (t) => 0,
    e: (t) => `১৯৩২ সালের আইন অনুযায়ী অংশীদারি অংশীদারের নিবন্ধন ঐচ্ছিক। তবে অনিবন্ধিত অংশীদারি প্রতিষ্ঠান কিছু আইনি সুবিধা থেকে বঞ্চিত হয়।`
  },
  {
    q: (t) => `ই-কমার্স (E-commerce) এর পূর্ণরূপ কী? (Full form of E-commerce?)`,
    o: (t) => ["Electronic Commerce", "Electric Commerce", "Easy Commerce", "Effective Commerce"],
    c: (t) => 0,
    e: (t) => `E-commerce = Electronic Commerce (ইন্টারনেটের মাধ্যমে পণ্য ক্রয়-বিক্রয় ও সেবা বিনিময়)।`
  },
  {
    q: (t) => `ব্যবস্থাপনার কোন নীতি অনুসারে একজন কর্মীর আদেশদাতা শুধুমাত্র একজন হওয়া উচিত? (Which principle dictates a worker should have only one boss?)`,
    o: (t) => ["আদেশের ঐক্য নীতি (Unity of Command)", "নির্দেশের ঐক্য নীতি", "নিয়মানুবর্তিতার নীতি", "শ্রম বিভাজন নীতি"],
    c: (t) => 0,
    e: (t) => `আদেশের ঐক্য (Unity of Command) নীতি অনুযায়ী দ্বৈত শাসন এড়াতে একজন অধীনস্থ কর্মীর সরাসরি আদেশদাতা শুধুমাত্র একজন ঊর্ধ্বতন কর্মকর্তা হওয়া উচিত।`
  },
  {
    q: (t) => `পাবলিক লিমিটেড কোম্পানি কখন শেয়ার বিক্রির জন্য আমন্ত্রণ জানাতে পারে? (When can a public limited company issue shares?)`,
    o: (t) => ["বিবরণপত্র বা প্রস্পেক্টাস প্রকাশের মাধ্যমে (Prospectus)", "পরিমেল নিয়মাবলী প্রকাশের সাথে সাথে", "কার্যারম্ভের পূর্বে গোপনে", "ট্রেড লাইসেন্স পেলেই"],
    c: (t) => 0,
    e: (t) => `জনসাধারণের কাছে শেয়ার বিক্রির জন্য আমন্ত্রণ জানাতে পাবলিক লিমিটেড কোম্পানিকে প্রস্পেক্টাস বা বিবরণপত্র ইস্যু করতে হয়।`
  }
];

// ─────────────────────────────────────────────────────────────────────────
// 10. FINANCE & ICT TEMPLATES (20 Items)
// ─────────────────────────────────────────────────────────────────────────
const financeIctTemplates = [
  {
    q: (t) => `অর্থের সময় মূল্যের মূল কারণ কোনটি? (What is the primary cause of time value of money?)`,
    o: (t) => ["সুদের হার (Interest Rate)", "মুদ্রাস্ফীতি", "অর্থের যোগান", "সরকারি ট্যাক্স"],
    c: (t) => 0,
    e: (t) => `সুদের হার (Interest Rate) হলো অর্থের সময় মূল্যের প্রধান কারণ। আজ ১ টাকা পাওয়ার চেয়ে ভবিষ্যতে ১ টাকা পাওয়ার উপযোগিতা কম।`
  },
  {
    q: (t) => `১০% চক্রবৃদ্ধি সুদে আজকের ১০০ টাকার ৩ বছর পরের ভবিষ্যৎ মূল্য কত? (What is the FV of 100 TK after 3 years at 10% compound interest?)`,
    o: (t) => ["১৩৩.১০ টাকা (133.10)", "১৩০ টাকা", "১৩৫ টাকা", "১২১ টাকা"],
    c: (t) => 0,
    e: (t) => `FV = PV * (1 + r)^n = 100 * (1.10)³ = 100 * 1.331 = 133.10 TK.`
  },
  {
    q: (t) => `দ্বিমিক বা বাইনারি (Binary) সংখ্যা পদ্ধতির ভিত্তি বা বেস কত? (What is the base of Binary number system?)`,
    o: (t) => ["২ (Base 2)", "১০", "৮", "১৬"],
    c: (t) => 0,
    e: (t) => `Binary base is 2 (0 and 1). Octal is 8 (0-7). Decimal is 10 (0-9). Hexadecimal is 16 (0-9, A-F).`
  },
  {
    q: (t) => `হেক্সাডেসিমেল পদ্ধতিতে 'F' এর সমতুল্য দশমিক মান কত? (Equivalent decimal value of 'F' in Hexadecimal?)`,
    o: (t) => ["১৫ (15)", "১৬", "১০", "১১"],
    c: (t) => 0,
    e: (t) => `A=10, B=11, C=12, D=13, E=14, F=15 in Hexadecimal system.`
  },
  {
    q: (t) => `লজিক গেটের ক্ষেত্রে NAND গেট কোন দুটি গেটের সমন্বয়ে তৈরি হয়? (Which two gates combine to form a NAND gate?)`,
    o: (t) => ["AND এবং NOT (AND + NOT)", "OR এবং NOT", "AND এবং OR", "XOR এবং NOT"],
    c: (t) => 0,
    e: (t) => `NAND = NOT + AND. It is a universal gate outputting inverted AND result.`
  },
  {
    q: (t) => `কম্পিউটার নেটওয়ার্কিংয়ের স্টার (Star) টপোলজির কেন্দ্রস্থলে কী ব্যবহৃত হয়? (What is used at the center of a Star topology?)`,
    o: (t) => ["হাব বা সুইচ (Hub/Switch)", "রাউটার", "গেটওয়ে", "কো-অ্যাক্সিয়াল ক্যাবল"],
    c: (t) => 0,
    e: (t) => `স্টার টপোলজিতে সব কম্পিউটার একটি কেন্দ্রীয় হাব বা সুইচের (Hub/Switch) সাথে সংযুক্ত থাকে।`
  },
  {
    q: (t) => `HTML ডকুমেন্টের শুরুতে ফাইলটি নির্দেশ করতে কোন ট্যাগ ব্যবহার করা হয়? (HTML document starts with which indicator?)`,
    o: (t) => ["<!DOCTYPE html>", "<html>", "<head>", "<body>"],
    c: (t) => 0,
    e: (t) => `HTML5 ফাইলে ডকুমেন্ট টাইপ ঘোষণা করতে শুরুতে <!DOCTYPE html> লেখা হয়।`
  },
  {
    q: (t) => `ডাটাবেজ ম্যানেজমেন্ট সিস্টেমে (DBMS) একটি টেবিলের রেকর্ডগুলোকে অনন্যভাবে সনাক্ত করার কী-কে কী বলে? (Which key uniquely identifies records in DBMS?)`,
    o: (t) => ["প্রাইমারি কী (Primary Key)", "ফরেন কী", "কম্পোজিট কী", "ক্যান্ডিডেট কী"],
    c: (t) => 0,
    e: (t) => `Primary Key দ্বারা টেবিলের প্রতিটি রেকর্ডকে ইউনিকভাবে বা অনন্যভাবে সনাক্ত করা যায় (যেমন: রোল নম্বর)।`
  },
  {
    q: (t) => `নিচের কোনটি ক্লাউড কম্পিউটিংয়ের উদাহরণ? (Which of the following is an example of Cloud Computing?)`,
    o: (t) => ["গুগল ড্রাইভ (Google Drive)", "মাইক্রোসফট এক্সেল অফলাইন", "কম্পিউটার র‍্যাম", "পেনড্রাইভ"],
    c: (t) => 0,
    e: (t) => `Google Drive, Dropbox, AWS হলো ক্লাউড স্টোরেজ ও কম্পিউটিংয়ের বাস্তব উদাহরণ, যেখানে ডাটা ইন্টারনেটে সংরক্ষিত থাকে।`
  },
  {
    q: (t) => `মোবাইল ব্যাংকিং বা এমএফএস (MFS) এর উদাহরণ কোনটি? (Example of Mobile Financial Services MFS?)`,
    o: (t) => ["বিকাশ / নগদ (bKash/Nagad)", "অনলাইন ক্রেডিট কার্ড", "এটিএম বুথ", "ব্যাংক চেক বই"],
    c: (t) => 0,
    e: (t) => `bKash, Nagad, Rocket হলো বাংলাদেশে বহুল ব্যবহৃত মোবাইল আর্থিক সেবা (MFS)।`
  },
  {
    q: (t) => `ঝুঁকিহীন বিনিয়োগের আয়কে কী বলা হয়? (Return on risk-free investment is called?)`,
    o: (t) => ["ঝুঁকিহীন আয়ের হার (Risk-free rate of return)", "ঝুঁকি প্রিমিয়াম", "বাজার আয়ের হার", "লভ্যাংশ"],
    c: (t) => 0,
    e: (t) => `সরকারি ট্রেজারি বিল বা বন্ডের মতো বিনিয়োগ যেখানে কোনো ডিফল্ট ঝুঁকি থাকে না, তার আয়ের হারকে ঝুঁকিহীন আয়ের হার (R_f) বলা হয়।`
  },
  {
    q: (t) => `নিচের কোনটি দীর্ঘমেয়াদী অর্থায়নের উৎস? (Which of the following is a source of long-term finance?)`,
    o: (t) => ["ডিবেঞ্চার বা ঋণপত্র (Debentures)", "ব্যাংক ওভারড্রাফট", "বাণিজ্যিক পত্র", "ক্রয় বাট্টা"],
    c: (t) => 0,
    e: (t) => `শেয়ার ও ডিবেঞ্চার (ঋণপত্র) হলো দীর্ঘমেয়াদী অর্থায়নের উৎস। ব্যাংক জমাতিরিক্ত (Overdraft) ও বাণিজ্যিক পত্র স্বল্পমেয়াদী অর্থায়ন।`
  },
  {
    q: (t) => `আইপি অ্যাড্রেস (IP Address) দিয়ে মূলত কী সনাক্ত করা হয়? (What does an IP address identify?)`,
    o: (t) => ["ইন্টারনেটে সংযুক্ত ডিভাইস (Device on internet)", "ব্যবহারকারীর নাম", "ইমেইল পাসওয়ার্ড", "ইন্টারনেটের গতি"],
    c: (t) => 0,
    e: (t) => `IP (Internet Protocol) Address হলো ইন্টারনেটে সংযুক্ত প্রতিটি ডিভাইস বা কম্পিউটারের একটি ইউনিক ঠিকানা বা আইডি।`
  },
  {
    q: (t) => `সি (C) প্রোগ্রামিং ভাষায় লুপ ঘোরানোর জন্য ব্যবহৃত কীওয়ার্ড কোনটি? (Looping keyword in C programming language?)`,
    o: (t) => ["for / while", "if / else", "switch / case", "void / main"],
    c: (t) => 0,
    e: (t) => `'for', 'while' এবং 'do-while' হলো সি প্রোগ্রামিংয়ে নির্দিষ্ট কোড বারবার এক্সিকিউট করতে বা লুপ ঘোরাতে ব্যবহৃত কীওয়ার্ড।`
  },
  {
    q: (t) => `একটি নেটওয়ার্কের কম্পিউটারগুলোকে বৃত্তাকারে সংযোগ দেওয়ার পদ্ধতিকে কী বলে? (Connecting computers in a circle is called?)`,
    o: (t) => ["রিং টপোলজি (Ring Topology)", "বাস টপোলজি", "স্টার টপোলজি", "মেশ টপোলজি"],
    c: (t) => 0,
    e: (t) => `রিং টপোলজিতে প্রতিটি কম্পিউটার তার দুই পাশের দুটি কম্পিউটারের সাথে বৃত্তাকারে সংযুক্ত থাকে।`
  },
  {
    q: (t) => `বিনিয়োগ সিদ্ধান্তের সাথে কোনটি সরাসরি জড়িত? (Which is directly related to investment decision?)`,
    o: (t) => ["মূলধন বাজেটিং (Capital Budgeting)", "লভ্যাংশ ঘোষণা", "স্বল্পমেয়াদী ঋণ গ্রহণ", "শেয়ার ইস্যু"],
    c: (t) => 0,
    e: (t) => `মূলধন বাজেটিং (Capital Budgeting) হলো দীর্ঘমেয়াদী বিনিয়োগ সিদ্ধান্তের মূল্যায়ন ও নির্বাচন প্রক্রিয়া (যেমন নতুন মেশিন কেনা)।`
  },
  {
    q: (t) => `বাণিজ্যিক ব্যাংকগুলোর ঋণ নিয়ন্ত্রক ও অভিভাবক কে? (Regulator and guardian of commercial banks?)`,
    o: (t) => ["কেন্দ্রীয় ব্যাংক (Central Bank)", "অর্থ মন্ত্রণালয়", "পরিকল্পনা কমিশন", "বিশ্বব্যাংক"],
    c: (t) => 0,
    e: (t) => `সরাসরি মুদ্রা সরবরাহ ও সমস্ত বাণিজ্যিক ব্যাংকের ঋণ নিয়ন্ত্রণ এবং তাদের শেষ আশ্রয়স্থল বা অভিভাবক হলো বাংলাদেশ ব্যাংক (কেন্দ্রীয় ব্যাংক)।`
  },
  {
    q: (t) => `কোন সংখ্যা পদ্ধতির বেস বা ভিত্তি ১৬? (Which number system base is 16?)`,
    o: (t) => ["Hexadecimal", "Decimal", "Octal", "Binary"],
    c: (t) => 0,
    e: (t) => `Hexadecimal system uses 16 digits (0 to 9, A to F) to represent values.`
  },
  {
    q: (t) => `ডাটাবেজ টেবিলে যেকোনো দুটি ফাইলের মধ্যে সম্পর্ক স্থাপনকে কী বলে? (Establishing a relationship between table files is called?)`,
    o: (t) => ["Relationship (রিলেশনশিপ)", "ফরেন কী", "ইনডেক্সিং", "কুয়েরি"],
    c: (t) => 0,
    e: (t) => `দুটি টেবিলের কমন ফিল্ড বা কলামের ভিত্তিতে তাদের মধ্যে সংযোগ তৈরি করাকে ডাটাবেজ রিলেশনশিপ (1:1, 1:M, M:N) বলা হয়।`
  },
  {
    q: (t) => `WACC এর পূর্ণরূপ কী? (Full form of WACC?)`,
    o: (t) => ["Weighted Average Cost of Capital", "Weighted Annual Cost of Cash", "Weekly Average Cost of Capital", "Weighted Average Credit Cost"],
    c: (t) => 0,
    e: (t) => `WACC = Weighted Average Cost of Capital (ভারিত গড় মূলধন ব্যয়)। এটি শেয়ার ও ঋণের সম্মিলিত ব্যয়ের গড় হার।`
  }
];


// ─────────────────────────────────────────────────────────────────────────
// GENERIC EXAM CONSTRUCTORS
// ─────────────────────────────────────────────────────────────────────────

// Dynamically generate 100 questions for Science (Ka Unit / Engineering)
function generateScienceQuestions(testNum, idPrefix) {
  const qs = [];
  // 20 Physics questions
  for (let i = 0; i < 20; i++) {
    qs.push(getQuestion(physicsTemplates[i], testNum, idPrefix, qs.length + 1));
  }
  // 20 Chemistry questions
  for (let i = 0; i < 20; i++) {
    qs.push(getQuestion(chemistryTemplates[i], testNum, idPrefix, qs.length + 1));
  }
  // 20 Mathematics questions
  for (let i = 0; i < 20; i++) {
    qs.push(getQuestion(mathematicsTemplates[i], testNum, idPrefix, qs.length + 1));
  }
  // 20 Biology questions
  for (let i = 0; i < 20; i++) {
    qs.push(getQuestion(biologyTemplates[i], testNum, idPrefix, qs.length + 1));
  }
  // 20 English questions
  for (let i = 0; i < 20; i++) {
    qs.push(getQuestion(englishTemplates[i], testNum, idPrefix, qs.length + 1));
  }
  return qs;
}

// Dynamically generate 100 questions for Arts (Kha Unit)
function generateArtsQuestions(testNum, idPrefix) {
  const qs = [];
  // 35 Bangla questions
  for (let i = 0; i < 35; i++) {
    qs.push(getQuestion(banglaTemplates[i], testNum, idPrefix, qs.length + 1));
  }
  // 35 English questions
  for (let i = 0; i < 35; i++) {
    qs.push(getQuestion(englishTemplates[i], testNum, idPrefix, qs.length + 1));
  }
  // 30 General Knowledge questions
  for (let i = 0; i < 30; i++) {
    qs.push(getQuestion(gkTemplates[i], testNum, idPrefix, qs.length + 1));
  }
  return qs;
}

// Dynamically generate 100 questions for Commerce (Ga Unit)
function generateCommerceQuestions(testNum, idPrefix) {
  const qs = [];
  // 25 Accounting questions
  for (let i = 0; i < 25; i++) {
    qs.push(getQuestion(accountingTemplates[i], testNum, idPrefix, qs.length + 1));
  }
  // 25 Business Studies questions
  for (let i = 0; i < 25; i++) {
    qs.push(getQuestion(businessStudiesTemplates[i], testNum, idPrefix, qs.length + 1));
  }
  // 20 Finance & ICT questions
  for (let i = 0; i < 20; i++) {
    qs.push(getQuestion(financeIctTemplates[i], testNum, idPrefix, qs.length + 1));
  }
  // 15 Bangla questions (reusing first 15 Bangla templates)
  for (let i = 0; i < 15; i++) {
    qs.push(getQuestion(banglaTemplates[i], testNum, idPrefix, qs.length + 1));
  }
  // 15 English questions (reusing first 15 English templates)
  for (let i = 0; i < 15; i++) {
    qs.push(getQuestion(englishTemplates[i], testNum, idPrefix, qs.length + 1));
  }
  return qs;
}


// Assemble the final 15 tests (5 Science, 5 Arts, 5 Commerce)
export const generatedMockTests = [
  // ─── SCIENCE (5 Tests) ───
  {
    id: "test-science-01",
    title: "Science (Ka Unit) Mock Test #1",
    subject: "Phy + Chem + Math + Bio + Eng",
    group: "Science",
    duration: 90, // minutes for 100 questions
    totalMarks: 100,
    negativeMarking: -0.25,
    badge: "🔥 Most Attempted",
    examTarget: "DU Ka Unit, BUET, JU A Unit",
    questions: generateScienceQuestions(1, "sci-01")
  },
  {
    id: "test-science-02",
    title: "Science (Ka Unit) Mock Test #2",
    subject: "Phy + Chem + Math + Bio + Eng",
    group: "Science",
    duration: 90,
    totalMarks: 100,
    negativeMarking: -0.25,
    badge: "⚡ Weekly Special",
    examTarget: "DU Ka Unit, RU C Unit, GST",
    questions: generateScienceQuestions(2, "sci-02")
  },
  {
    id: "test-science-03",
    title: "Science (Ka Unit) Mock Test #3",
    subject: "Phy + Chem + Math + Bio + Eng",
    group: "Science",
    duration: 90,
    totalMarks: 100,
    negativeMarking: -0.25,
    badge: "🎯 Practice Set",
    examTarget: "BUET written prep, JU A Unit",
    questions: generateScienceQuestions(3, "sci-03")
  },
  {
    id: "test-science-04",
    title: "Science (Ka Unit) Mock Test #4",
    subject: "Phy + Chem + Math + Bio + Eng",
    group: "Science",
    duration: 90,
    totalMarks: 100,
    negativeMarking: -0.25,
    badge: "🧠 Hard Level",
    examTarget: "DU, RU, KU engineering standards",
    questions: generateScienceQuestions(4, "sci-04")
  },
  {
    id: "test-science-05",
    title: "Science (Ka Unit) Mock Test #5",
    subject: "Phy + Chem + Math + Bio + Eng",
    group: "Science",
    duration: 90,
    totalMarks: 100,
    negativeMarking: -0.25,
    badge: "🏁 Final Grand Mock",
    examTarget: "Ultimate DU & engineering standard",
    questions: generateScienceQuestions(5, "sci-05")
  },

  // ─── ARTS (5 Tests) ───
  {
    id: "test-arts-01",
    title: "Arts (Kha Unit) Mock Test #1",
    subject: "Bangla + English + GK",
    group: "Arts",
    duration: 60, // minutes
    totalMarks: 100,
    negativeMarking: -0.25,
    badge: "✍️ Top Choice",
    examTarget: "DU Kha Unit, JU B & C Units, RU A Unit",
    questions: generateArtsQuestions(1, "arts-01")
  },
  {
    id: "test-arts-02",
    title: "Arts (Kha Unit) Mock Test #2",
    subject: "Bangla + English + GK",
    group: "Arts",
    duration: 60,
    totalMarks: 100,
    negativeMarking: -0.25,
    badge: "⚡ Revision Pack",
    examTarget: "DU Kha Unit, JU B Unit, RU A Unit",
    questions: generateArtsQuestions(2, "arts-02")
  },
  {
    id: "test-arts-03",
    title: "Arts (Kha Unit) Mock Test #3",
    subject: "Bangla + English + GK",
    group: "Arts",
    duration: 60,
    totalMarks: 100,
    negativeMarking: -0.25,
    badge: "🎯 Core Prep",
    examTarget: "JU Arts & Social Sciences, GST B Unit",
    questions: generateArtsQuestions(3, "arts-03")
  },
  {
    id: "test-arts-04",
    title: "Arts (Kha Unit) Mock Test #4",
    subject: "Bangla + English + GK",
    group: "Arts",
    duration: 60,
    totalMarks: 100,
    negativeMarking: -0.25,
    badge: "🔥 Rank Booster",
    examTarget: "DU & JU C-Unit Literature special",
    questions: generateArtsQuestions(4, "arts-04")
  },
  {
    id: "test-arts-05",
    title: "Arts (Kha Unit) Mock Test #5",
    subject: "Bangla + English + GK",
    group: "Arts",
    duration: 60,
    totalMarks: 100,
    negativeMarking: -0.25,
    badge: "🏁 Grand Finale",
    examTarget: "DU Kha Unit & Arts overall standards",
    questions: generateArtsQuestions(5, "arts-05")
  },

  // ─── COMMERCE (5 Tests) ───
  {
    id: "test-commerce-01",
    title: "Commerce (Ga Unit) Mock Test #1",
    subject: "Acc + Bus + Fin/ICT + Ban + Eng",
    group: "Commerce",
    duration: 60,
    totalMarks: 100,
    negativeMarking: -0.25,
    badge: "📊 Most Popular",
    examTarget: "DU Ga Unit, JU E Unit, RU B Unit",
    questions: generateCommerceQuestions(1, "comm-01")
  },
  {
    id: "test-commerce-02",
    title: "Commerce (Ga Unit) Mock Test #2",
    subject: "Acc + Bus + Fin/ICT + Ban + Eng",
    group: "Commerce",
    duration: 60,
    totalMarks: 100,
    negativeMarking: -0.25,
    badge: "⚡ Business Focus",
    examTarget: "DU Ga Unit, RU B Unit, GST C Unit",
    questions: generateCommerceQuestions(2, "comm-02")
  },
  {
    id: "test-commerce-03",
    title: "Commerce (Ga Unit) Mock Test #3",
    subject: "Acc + Bus + Fin/ICT + Ban + Eng",
    group: "Commerce",
    duration: 60,
    totalMarks: 100,
    negativeMarking: -0.25,
    badge: "🎯 Concept builder",
    examTarget: "JU Business Studies (E Unit)",
    questions: generateCommerceQuestions(3, "comm-03")
  },
  {
    id: "test-commerce-04",
    title: "Commerce (Ga Unit) Mock Test #4",
    subject: "Acc + Bus + Fin/ICT + Ban + Eng",
    group: "Commerce",
    duration: 60,
    totalMarks: 100,
    negativeMarking: -0.25,
    badge: "🔥 High Standard",
    examTarget: "DU Ga Unit & Accounting major prep",
    questions: generateCommerceQuestions(4, "comm-04")
  },
  {
    id: "test-commerce-05",
    title: "Commerce (Ga Unit) Mock Test #5",
    subject: "Acc + Bus + Fin/ICT + Ban + Eng",
    group: "Commerce",
    duration: 60,
    totalMarks: 100,
    negativeMarking: -0.25,
    badge: "🏁 Grand Mock",
    examTarget: "Ultimate Ga Unit & general commerce standard",
    questions: generateCommerceQuestions(5, "comm-05")
  }
];
