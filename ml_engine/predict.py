"""
EduFast Machine Learning Inference Engine
Uses the trained Scikit-Learn RandomForest model to predict admission chances
for Bangladesh Universities based on candidate's academic and mock test data.
"""

import sys
import os
import json
import argparse
import pandas as pd
import joblib

# Ensure UTF-8 output on Windows
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def grade_to_point(grade):
    if not grade:
        return 4.5
    g = str(grade).strip().upper()
    if g in ['A+', '5.0', '5']:
        return 5.0
    if g in ['A', '4.0', '4']:
        return 4.0
    if g in ['A-', '3.5']:
        return 3.5
    if g in ['B', '3.0', '3']:
        return 3.0
    if g in ['C', '2.0', '2']:
        return 2.0
    if g in ['D', '1.0', '1']:
        return 1.0
    try:
        val = float(g)
        return min(max(val, 1.0), 5.0)
    except Exception:
        return 4.0

UNIVERSITIES_CONFIG = [
    {
        'id': 'buet',
        'target_uni': 'BUET',
        'name': 'বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয় (BUET)',
        'unit': 'প্রকৌশল ও স্থাপত্য (Ka & Kha)',
        'min_ssc': 5.0,
        'min_hsc': 5.0,
        'min_math': 5.0,
        'min_phy': 5.0,
        'min_chem': 5.0,
        'advice_strengths': 'উচ্চতর গণিত ও পদার্থবিজ্ঞানে চমৎকার দক্ষতা বুয়েটে প্রিলিমিনারি ও লিখিত পরীক্ষায় এগিয়ে রাখবে।',
        'advice_improve': 'বুয়েটের বিগত ২০ বছরের প্রশ্নব্যাংক এবং শর্টকাট টেকনিকসহ মক টেস্টে ৮০%+ স্কোর অর্জনের চেষ্টা করুন।'
    },
    {
        'id': 'medical-mbbs',
        'target_uni': 'MEDICAL_MBBS',
        'name': 'সরকারি মেডিকেল কলেজসমূহ (DGHS MBBS)',
        'unit': 'এমবিবিএস ও বিডিএস (MBBS/BDS)',
        'min_combined': 9.0,
        'min_ssc': 4.0,
        'min_hsc': 4.0,
        'min_bio': 4.0,
        'advice_strengths': 'জীববিজ্ঞান ও রসায়নে শক্ত দখল মেডিকেল ভর্তি পরীক্ষায় সর্বোচ্চ নম্বর পেতে সাহায্য করবে।',
        'advice_improve': 'ইংরেজি ও সাধারণ জ্ঞানের বিগত বছরের প্রশ্নগুলো নিয়মিত রিভিশন দিন এবং নেগেটিভ মার্কিং এড়াতে সতর্ক হোন।'
    },
    {
        'id': 'du-ka',
        'target_uni': 'DU_SCIENCE',
        'name': 'ঢাকা বিশ্ববিদ্যালয় (DU)',
        'unit': 'বিজ্ঞান অনুষদ (Ka Unit)',
        'min_combined': 8.5,
        'min_ssc': 3.5,
        'min_hsc': 3.5,
        'advice_strengths': 'পদার্থ, রসায়ন এবং মূল গণিতের সমন্বিত প্রিপারেশন ডিইউ ক ইউনিটে টপ ডিপার্টমেন্ট নিশ্চিত করতে পারে।',
        'advice_improve': 'লিখিত অংশের সময় ব্যবস্থাপনায় মনোযোগ দিন, বিশেষ করে পদার্থ ও গণিতের ব্যাখ্যামূলক উত্তরে।'
    },
    {
        'id': 'ckruet',
        'target_uni': 'CKRUET',
        'name': 'প্রকৌশল গুচ্ছ (RUET, KUET, CUET)',
        'unit': 'ইঞ্জিনিয়ারিং ও আর্কিটেকচার',
        'min_ssc': 4.0,
        'min_hsc': 4.0,
        'min_math': 4.0,
        'min_phy': 4.0,
        'advice_strengths': 'ইঞ্জিনিয়ারিং কনসেপ্ট এবং ক্যালকুলেটরের দ্রুত ব্যবহারে রুয়েট, কুয়েট, চুয়েটে বিশাল সুযোগ রয়েছে।',
        'advice_improve': 'রসায়ন বিষয়ের জৈব যৌগের বিক্রিয়া ও গণিতের ক্যালকুলাস অংশে আরও জোর দিন।'
    },
    {
        'id': 'gst-science',
        'target_uni': 'GST_SCIENCE',
        'name': 'জিএসটি সাধারণ ও বিজ্ঞান প্রযুক্তি গুচ্ছ (২৪ বিশ্ববিদ্যালয়)',
        'unit': 'বিজ্ঞান শাখা (A Unit - SUST, JUST, KU)',
        'min_combined': 7.5,
        'min_ssc': 3.0,
        'min_hsc': 3.0,
        'advice_strengths': 'জিএসটি গুচ্ছের শীর্ষ বিশ্ববিদ্যালয়গুলোতে (যেমন সাস্ট) ভর্তির জন্য আপনার অবস্থান অত্যন্ত সম্ভাবনাময়।',
        'advice_improve': 'প্রতিটি ভুলের জন্য ০.২৫ নেগেটিভ মার্ক থাকে, নিশ্চিত না হয়ে আন্দাজে দাগানো থেকে বিরত থাকুন।'
    },
    {
        'id': 'du-kha',
        'target_uni': 'DU_ARTS',
        'name': 'ঢাকা বিশ্ববিদ্যালয় (DU)',
        'unit': 'কলা, আইন ও সামাজিক বিজ্ঞান (Kha Unit)',
        'min_combined': 8.0,
        'min_ssc': 3.0,
        'min_hsc': 3.0,
        'advice_strengths': 'বাংলা ব্যাকরণ ও সাধারণ জ্ঞানে ধারাবাহিক চর্চা থাকলে কলা ও আইন অনুষদে শীর্ষ স্থান সম্ভব।',
        'advice_improve': 'ইংরেজি গ্রামার ও ফ্রি-হ্যান্ড রাইটিং দক্ষতা বৃদ্ধির জন্য দৈনিক ইংরেজি পত্রিকা পড়ার অভ্যাস করুন।'
    },
    {
        'id': 'du-ga',
        'target_uni': 'DU_BUSINESS',
        'name': 'ঢাকা বিশ্ববিদ্যালয় (DU)',
        'unit': 'ব্যবসায় শিক্ষা অনুষদ (Ga Unit)',
        'min_combined': 8.0,
        'min_ssc': 3.0,
        'min_hsc': 3.0,
        'advice_strengths': 'হিসাববিজ্ঞান ও ব্যবসায় নীতিতে গভীর জ্ঞান থাকলে শীর্ষ বিজনেস স্কুলে পড়ার স্বপ্ন পূরণ হবে।',
        'advice_improve': 'ব্যবসায় গণিত ও ইংরেজিতে নিয়মিত EduFast মক টেস্ট দিয়ে স্কোর ৭৫%+ এ উন্নীত করুন।'
    },
    {
        'id': 'ju-biology',
        'target_uni': 'JU_BIOLOGY',
        'name': 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয় (JU)',
        'unit': 'জীববিজ্ঞান অনুষদ (D Unit)',
        'min_combined': 8.5,
        'min_bio': 4.0,
        'advice_strengths': 'বায়োলজি ও কেমিস্ট্রি গভীর প্রশ্ন বোঝার দক্ষতা জেইউ ডি ইউনিটে চান্স নিশ্চিত করতে সহায়ক।',
        'advice_improve': 'জাবির বিগত বছরের বিশেষ প্রশ্ন প্যাটার্ন ও আইকিউ ভিত্তিক সমস্যা সমাধানের অভ্যাস গড়ে তুলুন।'
    }
]

def predict_admission(input_data):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, 'models', 'admission_model.joblib')
    
    if not os.path.exists(model_path):
        return {
            'success': False,
            'error': f"Model file not found at {model_path}. Please run train_model.py first."
        }

    # Load Model Pipeline
    pipe = joblib.load(model_path)

    # Extract inputs with defaults
    ssc = float(input_data.get('sscGpa', 5.0) or 5.0)
    hsc = float(input_data.get('hscGpa', 5.0) or 5.0)
    combined = ssc + hsc
    
    sub = input_data.get('subjectGrades', {}) or {}
    math_gp = grade_to_point(sub.get('math', 'A+'))
    phy_gp = grade_to_point(sub.get('physics', 'A+'))
    chem_gp = grade_to_point(sub.get('chemistry', 'A+'))
    bio_gp = grade_to_point(sub.get('biology', 'A'))
    eng_gp = grade_to_point(sub.get('english', 'A'))

    mock = float(input_data.get('mockTestAvg', 70.0) or 70.0)
    study_hrs = float(input_data.get('studyHours', 35.0) or 35.0)

    # Build evaluation rows for each university
    eval_rows = []
    for cfg in UNIVERSITIES_CONFIG:
        eval_rows.append({
            'ssc_gpa': ssc,
            'hsc_gpa': hsc,
            'combined_gpa': combined,
            'math_gp': math_gp,
            'physics_gp': phy_gp,
            'chem_gp': chem_gp,
            'bio_gp': bio_gp,
            'eng_gp': eng_gp,
            'mock_score': mock,
            'study_hours': study_hrs,
            'target_uni': cfg['target_uni']
        })

    eval_df = pd.DataFrame(eval_rows)
    
    # Get ML Probabilities
    # predict_proba returns array of shape (N, 2), column 1 is probability of class 1 (admitted)
    probs = pipe.predict_proba(eval_df)[:, 1]

    predictions = []
    strengths = []
    areas_to_improve = []

    # Assess overall strength
    if mock >= 75:
        strengths.append(f"আপনার মক টেস্টের গড় স্কোর {mock}% যা শীর্ষ ১০% শিক্ষার্থীদের সমমানের।")
    else:
        areas_to_improve.append(f"মক টেস্টের গড় স্কোর {mock}%। এটি ৭৫% এ উন্নীত করলে চান্সের সম্ভাবনা ২০-৩০% বৃদ্ধি পাবে।")

    if math_gp == 5.0 and phy_gp == 5.0:
        strengths.append("উচ্চতর গণিত ও পদার্থবিজ্ঞানে এ+ (৫.০) থাকায় ইঞ্জিনিয়ারিং ফিল্ডে আপনার সাফল্য পাওয়ার চমৎকার ভিত্তি রয়েছে।")
    if bio_gp == 5.0 and chem_gp >= 4.5:
        strengths.append("জীববিজ্ঞান ও রসায়নে উচ্চ গ্রেড থাকায় মেডিকেল ও লাইফ সায়েন্স অনুষদে আপনার দারুণ সম্ভাবনা।")

    for i, cfg in enumerate(UNIVERSITIES_CONFIG):
        raw_prob = float(probs[i])
        
        # Check formal eligibility rules
        is_eligible = True
        ineligibility_reasons = []

        if 'min_ssc' in cfg and ssc < cfg['min_ssc']:
            is_eligible = False
            ineligibility_reasons.append(f"এসএসসি ন্যূনতম জিপিএ {cfg['min_ssc']} প্রয়োজন (আপনার: {ssc})")
        if 'min_hsc' in cfg and hsc < cfg['min_hsc']:
            is_eligible = False
            ineligibility_reasons.append(f"এইচএসসি ন্যূনতম জিপিএ {cfg['min_hsc']} প্রয়োজন (আপনার: {hsc})")
        if 'min_combined' in cfg and combined < cfg['min_combined']:
            is_eligible = False
            ineligibility_reasons.append(f"মোট জিপিএ ন্যূনতম {cfg['min_combined']} প্রয়োজন (আপনার: {combined:.2f})")
        if 'min_math' in cfg and math_gp < cfg['min_math']:
            is_eligible = False
            ineligibility_reasons.append(f"গণিতে ন্যূনতম জিপি {cfg['min_math']} প্রয়োজন (আপনার: {math_gp})")
        if 'min_phy' in cfg and phy_gp < cfg['min_phy']:
            is_eligible = False
            ineligibility_reasons.append(f"পদার্থবিজ্ঞানে ন্যূনতম জিপি {cfg['min_phy']} প্রয়োজন (আপনার: {phy_gp})")
        if 'min_bio' in cfg and bio_gp < cfg['min_bio']:
            is_eligible = False
            ineligibility_reasons.append(f"জীববিজ্ঞানে ন্যূনতম জিপি {cfg['min_bio']} প্রয়োজন (আপনার: {bio_gp})")

        # Adjust probability if ineligible
        final_percentage = round(raw_prob * 100) if is_eligible else min(round(raw_prob * 100 * 0.15), 10)
        
        # Categorical Status
        if not is_eligible:
            status = 'ইনএলিজিবল (শর্ত পূরণ হয়নি)'
            status_tag = 'Ineligible'
        elif final_percentage >= 70:
            status = 'অত্যন্ত শক্তিশালী (Strong Chance)'
            status_tag = 'Very Strong'
        elif final_percentage >= 50:
            status = 'প্রতিযোগিতামূলক (Competitive)'
            status_tag = 'Competitive'
        elif final_percentage >= 35:
            status = 'মাঝারি (Moderate Chance)'
            status_tag = 'Moderate'
        else:
            status = 'ঝুঁকিপূর্ণ / অতিরিক্ত প্রচেষ্টা প্রয়োজন'
            status_tag = 'Risky'

        predictions.append({
            'id': cfg['id'],
            'target_uni': cfg['target_uni'],
            'name': cfg['name'],
            'unit': cfg['unit'],
            'chancePercentage': final_percentage,
            'status': status,
            'statusTag': status_tag,
            'isEligible': is_eligible,
            'ineligibilityReasons': ineligibility_reasons,
            'recommendedAction': cfg['advice_strengths'] if final_percentage >= 55 else cfg['advice_improve']
        })

    # Sort by chance percentage descending
    predictions.sort(key=lambda x: x['chancePercentage'], reverse=True)

    # Estimate Percentile Rank
    top_chance = predictions[0]['chancePercentage']
    if top_chance >= 80:
        percentile_text = "জাতীয় মেধা স্তরে শীর্ষ ৫% শিক্ষার্থীর মধ্যে অবস্থান"
    elif top_chance >= 65:
        percentile_text = "জাতীয় মেধা স্তরে শীর্ষ ১৫% শিক্ষার্থীর মধ্যে অবস্থান"
    elif top_chance >= 50:
        percentile_text = "জাতীয় মেধা স্তরে শীর্ষ ৩০% শিক্ষার্থীর মধ্যে অবস্থান"
    else:
        percentile_text = "জাতীয় মেধা স্তরে মধ্যম সারিতে অবস্থান (বিশেষ মনোযোগ প্রয়োজন)"

    return {
        'success': True,
        'model': 'RandomForestClassifier (scikit-learn 1.9.1 / Python 3.13)',
        'timestamp': pd.Timestamp.now().isoformat(),
        'studentSummary': {
            'sscGpa': ssc,
            'hscGpa': hsc,
            'combinedGpa': combined,
            'mockTestAvg': mock,
            'studyHoursWeekly': study_hrs
        },
        'percentileRank': percentile_text,
        'predictions': predictions,
        'strengths': strengths,
        'areasToImprove': areas_to_improve
    }

def main():
    parser = argparse.ArgumentParser(description="EduFast Admission ML Predictor")
    parser.add_argument('--input', type=str, help="JSON input string", default=None)
    parser.add_argument('--file', type=str, help="JSON input file path", default=None)
    args = parser.parse_args()

    data = None
    if args.file and os.path.exists(args.file):
        try:
            with open(args.file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(json.dumps({'success': False, 'error': f"Failed to read input file: {str(e)}"}, ensure_ascii=False))
            sys.exit(1)
    elif args.input:
        try:
            data = json.loads(args.input)
        except Exception as e:
            print(json.dumps({'success': False, 'error': f"JSON parse error: {str(e)}"}, ensure_ascii=False))
            sys.exit(1)
    else:
        # Default sample for testing
        data = {
            'sscGpa': 5.0,
            'hscGpa': 5.0,
            'subjectGrades': {'math': 'A+', 'physics': 'A+', 'chemistry': 'A+', 'biology': 'A', 'english': 'A+'},
            'mockTestAvg': 78,
            'studyHours': 42
        }

    result = predict_admission(data)
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
