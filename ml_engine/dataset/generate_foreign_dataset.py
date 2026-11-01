"""
EduFast Higher Education & Study Abroad Dataset Generator
Generates realistic training data for foreign university admission prediction:
Features: CGPA, IELTS, GRE, Publications, Extracurriculars, Work Experience, Target Country, Degree Level
Target: Admission Category (Safe = 2, Target = 1, Ambitious = 0)
"""

import os
import csv
import random
import math

random.seed(42)

COUNTRIES = ['USA', 'Canada', 'Germany', 'UK', 'Australia', 'Sweden', 'Japan']
DEGREES = ['Masters', 'PhD', 'Undergraduate']

def generate_record():
    country = random.choice(COUNTRIES)
    degree = random.choice(DEGREES)
    
    # CGPA distribution (scaled 2.50 to 4.00)
    cgpa = round(min(4.0, max(2.5, random.gauss(3.40, 0.35))), 2)
    
    # IELTS score (5.5 to 8.5)
    ielts = round(min(8.5, max(5.5, random.gauss(6.8, 0.7) * 2) / 2), 1)
    
    # GRE score (290 to 335, mostly for USA/Germany Masters/PhD)
    has_gre = (country in ['USA', 'Canada', 'Germany'] or random.random() < 0.4)
    gre = round(min(338, max(290, random.gauss(312, 10)))) if has_gre else 300
    
    # Publications count (0 to 6)
    pubs = random.choices([0, 1, 2, 3, 4, 5], weights=[50, 25, 12, 7, 4, 2])[0]
    
    # Extracurricular score (1 to 10)
    extra = round(min(10, max(1, random.gauss(6.0, 2.0))))
    
    # Work Experience in years (0 to 6)
    work_exp = round(min(7, max(0, random.gauss(1.8, 1.4))))

    # Profile Competitiveness Scoring Formula
    profile_score = (
        (cgpa / 4.0) * 40.0 +
        ((ielts - 5.0) / 3.5) * 25.0 +
        ((gre - 290) / 45.0) * 15.0 +
        min(pubs * 3.5, 12.0) +
        (extra * 0.5) +
        min(work_exp * 0.8, 4.0)
    )

    # Classify into Safe (2), Target (1), Ambitious (0)
    if profile_score >= 78.0 and cgpa >= 3.60 and ielts >= 7.0:
        chance_tier = 2 # Safe / High Profile
        chance_percent = round(min(96, max(80, profile_score + random.uniform(-3, 3))))
    elif profile_score >= 60.0 and cgpa >= 3.00 and ielts >= 6.5:
        chance_tier = 1 # Target / Competitive
        chance_percent = round(min(78, max(52, profile_score + random.uniform(-4, 4))))
    else:
        chance_tier = 0 # Ambitious / Needs profile improvement
        chance_percent = round(min(48, max(15, profile_score + random.uniform(-5, 5))))

    return {
        'cgpa': cgpa,
        'ielts': ielts,
        'gre': gre,
        'publications': pubs,
        'extracurricular': extra,
        'work_exp_years': work_exp,
        'target_country': country,
        'degree': degree,
        'chance_percent': chance_percent,
        'chance_tier': chance_tier # 2: Safe, 1: Target, 0: Ambitious
    }

def main():
    out_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(out_dir, exist_ok=True)
    csv_path = os.path.join(out_dir, 'foreign_admission_dataset.csv')

    records = [generate_record() for _ in range(3000)]
    random.shuffle(records)

    fieldnames = [
        'cgpa', 'ielts', 'gre', 'publications', 'extracurricular',
        'work_exp_years', 'target_country', 'degree',
        'chance_percent', 'chance_tier'
    ]

    with open(csv_path, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    print(f"Generated {len(records)} study abroad candidate records at: {csv_path}")

if __name__ == '__main__':
    main()
