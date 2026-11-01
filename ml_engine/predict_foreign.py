"""
EduFast Higher Education ML Inference Engine
Predicts foreign admission competitiveness (Safe, Target, Ambitious) and gives
profile-based university recommendations.
"""

import sys
import os
import json
import argparse
import pandas as pd
import joblib

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def predict_foreign_admission(data):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, 'models', 'foreign_admission_model.joblib')

    if not os.path.exists(model_path):
        return {'success': False, 'error': 'Foreign admission model not found.'}

    pipe = joblib.load(model_path)

    cgpa = float(data.get('cgpa', 3.5) or 3.5)
    ielts = float(data.get('ielts', 6.5) or 6.5)
    gre = float(data.get('gre', 310) or 310)
    pubs = int(data.get('publications', 0) or 0)
    extra = int(data.get('extracurricular', 5) or 5)
    work_exp = float(data.get('workExpYears', 1) or 1)
    country = str(data.get('targetCountry', 'USA') or 'USA')
    degree = str(data.get('degree', 'Masters') or 'Masters')

    df = pd.DataFrame([{
        'cgpa': cgpa,
        'ielts': ielts,
        'gre': gre,
        'publications': pubs,
        'extracurricular': extra,
        'work_exp_years': work_exp,
        'target_country': country,
        'degree': degree
    }])

    # 2: Safe, 1: Target, 0: Ambitious
    tier_idx = int(pipe.predict(df)[0])
    probs = pipe.predict_proba(df)[0]

    tier_names = {
        2: {'tag': 'Safe', 'label': 'সেফ অপশন (Safe - ৮০%+ সম্ভাবনা)', 'color': '#10b981'},
        1: {'tag': 'Target', 'label': 'টার্গেট অপশন (Target - ৫০-৭৯% সম্ভাবনা)', 'color': '#0d9488'},
        0: {'tag': 'Ambitious', 'label': 'উচ্চাকাঙ্ক্ষী (Ambitious - অতিরিক্ত প্রোফাইল প্রয়োজন)', 'color': '#f59e0b'}
    }

    tier_info = tier_names.get(tier_idx, tier_names[1])

    # Advice Generation
    strengths = []
    recommendations = []

    if cgpa >= 3.65:
        strengths.append(f"আপনার সিজিপিএ {cgpa:.2f} চমৎকার, যা শীর্ষ বিদেশি বিশ্ববিদ্যালয়ে বৃত্তির জন্য যথেষ্ট প্রতিযোগিতামূলক।")
    elif cgpa < 3.20:
        recommendations.append(f"বর্তমান সিজিপিএ {cgpa:.2f}। আইইএলটিএস এবং জিআরই স্কোরে জোর দিয়ে এই ঘাটতি পূরণ করা সম্ভব।")

    if ielts >= 7.5:
        strengths.append(f"আইইএলটিএস ব্যান্ড {ielts:.1f} যেকোনো বিশ্বমানের গবেষণা প্রতিষ্ঠানের টিএ/আরএ ফান্ডিং পাওয়ার সহায়ক।")
    elif ielts < 6.5:
        recommendations.append("আইইএলটিএস ব্যান্ড ন্যূনতম ৬.৫ বা ৭.০ এ উন্নীত করলে ফুল-ফান্ডেড স্কলারশিপের সুযোগ বহুলাংশে বাড়বে।")

    if pubs >= 2:
        strengths.append(f"আপনার {pubs}টি গবেষণা প্রকাশনা রয়েছে, যা সরাসরি পিএইচডি বা থিসিস মাস্টার্সে প্রফেসর কনভিন্স করতে অসাধারণ ভূমিকা রাখবে।")
    else:
        recommendations.append("অন্তত ১টি কনফারেন্স পেপার বা জার্নাল পাবলিকেশন থাকলে টপ র‍্যাংকিং ভার্সিটিতে ফুল স্কলারশিপ নিশ্চিত করা সহজ হবে।")

    return {
        'success': True,
        'model': 'RandomForestClassifier (scikit-learn 1.9.1 / Python 3.13)',
        'profileSummary': {
            'cgpa': cgpa,
            'ielts': ielts,
            'gre': gre,
            'publications': pubs,
            'targetCountry': country,
            'degree': degree
        },
        'predictedTier': tier_info['tag'],
        'tierLabel': tier_info['label'],
        'tierColor': tier_info['color'],
        'confidenceScores': {
            'safe': round(float(probs[2]) * 100, 1),
            'target': round(float(probs[1]) * 100, 1),
            'ambitious': round(float(probs[0]) * 100, 1)
        },
        'strengths': strengths,
        'recommendations': recommendations
    }

def main():
    parser = argparse.ArgumentParser(description="EduFast Foreign Admission ML Predictor")
    parser.add_argument('--input', type=str, help="JSON input string", default=None)
    parser.add_argument('--file', type=str, help="JSON input file path", default=None)
    args = parser.parse_args()

    data = None
    if args.file and os.path.exists(args.file):
        try:
            with open(args.file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(json.dumps({'success': False, 'error': f"Failed to read file: {e}"}))
            sys.exit(1)
    elif args.input:
        try:
            data = json.loads(args.input)
        except Exception as e:
            print(json.dumps({'success': False, 'error': f"JSON parse error: {e}"}))
            sys.exit(1)
    else:
        data = {'cgpa': 3.75, 'ielts': 7.5, 'gre': 320, 'publications': 2, 'targetCountry': 'USA', 'degree': 'Masters'}

    res = predict_foreign_admission(data)
    print(json.dumps(res, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
