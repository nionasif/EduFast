"""
EduFast Bangladesh University Admission Dataset Generator
Generates realistic training data reflecting Bangladesh University Admission patterns:
- BUET (Engineering)
- DU Ka (Science)
- Medical (DGHS MBBS)
- CKRUET (Engineering cluster: RUET, KUET, CUET)
- GST Science (SUST, JUST, etc.)
- DU Kha (Arts & Humanities)
- DU Ga (Business Studies)
- JU D-Unit (Life Sciences)
"""

import os
import csv
import random
import math

random.seed(42)

UNIVERSITIES = [
    'BUET',
    'DU_SCIENCE',
    'MEDICAL_MBBS',
    'CKRUET',
    'GST_SCIENCE',
    'DU_ARTS',
    'DU_BUSINESS',
    'JU_BIOLOGY'
]

def generate_student_record(target_uni):
    # Base GPA generation with realistic skew toward applicants
    # Students applying to BUET/Medical typically have 4.80 - 5.00
    if target_uni in ['BUET', 'MEDICAL_MBBS']:
        ssc_gpa = round(min(5.0, random.gauss(4.95, 0.1)), 2)
        hsc_gpa = round(min(5.0, random.gauss(4.95, 0.1)), 2)
    elif target_uni in ['DU_SCIENCE', 'CKRUET']:
        ssc_gpa = round(min(5.0, max(3.5, random.gauss(4.80, 0.25))), 2)
        hsc_gpa = round(min(5.0, max(3.5, random.gauss(4.75, 0.28))), 2)
    else:
        ssc_gpa = round(min(5.0, max(3.0, random.gauss(4.50, 0.35))), 2)
        hsc_gpa = round(min(5.0, max(3.0, random.gauss(4.45, 0.40))), 2)

    # Subject Grade Points (2.0 to 5.0)
    # 5.0 = A+, 4.0 = A, 3.5 = A-, 3.0 = B, 2.0 = C
    gp_choices = [5.0, 5.0, 5.0, 4.0, 4.0, 3.5, 3.0]
    
    math_gp = random.choice([5.0, 5.0, 5.0, 4.0] if target_uni in ['BUET', 'CKRUET', 'DU_SCIENCE'] else gp_choices)
    physics_gp = random.choice([5.0, 5.0, 5.0, 4.0] if target_uni in ['BUET', 'CKRUET', 'DU_SCIENCE'] else gp_choices)
    chem_gp = random.choice([5.0, 5.0, 4.0, 4.0] if target_uni in ['BUET', 'MEDICAL_MBBS', 'DU_SCIENCE'] else gp_choices)
    bio_gp = random.choice([5.0, 5.0, 5.0, 4.0] if target_uni in ['MEDICAL_MBBS', 'JU_BIOLOGY'] else gp_choices)
    eng_gp = random.choice([5.0, 4.0, 4.0, 3.5, 3.0] if target_uni in ['DU_ARTS', 'DU_BUSINESS'] else gp_choices)

    # Mock Test Average (0 to 100%)
    mock_score = round(min(100.0, max(25.0, random.gauss(65.0, 16.0))), 1)

    # Weekly preparation hours (10 to 60 hrs)
    study_hours = round(min(65, max(12, random.gauss(38.0, 10.0))), 1)

    # Calculate Admission Likelihood Score based on real university criteria
    score = 0.0
    admitted = 0

    if target_uni == 'BUET':
        # Strict eligibility: SSC 5.0, HSC 5.0, Math/Phy/Chem 5.0
        eligible = (ssc_gpa >= 5.0 and hsc_gpa >= 5.0 and math_gp >= 5.0 and physics_gp >= 5.0 and chem_gp >= 5.0)
        # BUET relies heavily on analytical problem solving (mock score) + Math/Physics
        merit_factor = (mock_score * 0.55) + (math_gp * 5.0) + (physics_gp * 4.0) + (chem_gp * 3.0) + (study_hours * 0.15)
        prob = 1 / (1 + math.exp(-(merit_factor - 78.0) / 7.0)) if eligible else 0.05
        admitted = 1 if (eligible and random.random() < prob) else 0

    elif target_uni == 'MEDICAL_MBBS':
        # DGHS criteria: Combined GPA min 9.0, Biology min 4.0
        eligible = (ssc_gpa + hsc_gpa >= 9.0 and ssc_gpa >= 4.0 and hsc_gpa >= 4.0 and bio_gp >= 4.0)
        # Medical relies on Bio, Chem, English, high memory retention & speed (mock score)
        merit_factor = (mock_score * 0.50) + (bio_gp * 6.0) + (chem_gp * 3.5) + (eng_gp * 2.5) + ((ssc_gpa + hsc_gpa) * 2.0)
        prob = 1 / (1 + math.exp(-(merit_factor - 77.0) / 6.5)) if eligible else 0.03
        admitted = 1 if (eligible and random.random() < prob) else 0

    elif target_uni == 'DU_SCIENCE':
        eligible = (ssc_gpa + hsc_gpa >= 8.5 and ssc_gpa >= 3.5 and hsc_gpa >= 3.5)
        merit_factor = (mock_score * 0.48) + (math_gp * 3.5) + (physics_gp * 3.5) + (chem_gp * 3.0) + ((ssc_gpa + hsc_gpa) * 2.2)
        prob = 1 / (1 + math.exp(-(merit_factor - 70.0) / 7.5)) if eligible else 0.05
        admitted = 1 if (eligible and random.random() < prob) else 0

    elif target_uni == 'CKRUET':
        eligible = (ssc_gpa >= 4.0 and hsc_gpa >= 4.0 and math_gp >= 4.0 and physics_gp >= 4.0)
        merit_factor = (mock_score * 0.45) + (math_gp * 4.0) + (physics_gp * 3.5) + (chem_gp * 3.0) + (study_hours * 0.12)
        prob = 1 / (1 + math.exp(-(merit_factor - 66.0) / 8.0)) if eligible else 0.06
        admitted = 1 if (eligible and random.random() < prob) else 0

    elif target_uni == 'GST_SCIENCE':
        eligible = (ssc_gpa + hsc_gpa >= 7.5 and ssc_gpa >= 3.0 and hsc_gpa >= 3.0)
        merit_factor = (mock_score * 0.45) + (math_gp * 2.5) + (physics_gp * 2.5) + ((ssc_gpa + hsc_gpa) * 3.0)
        prob = 1 / (1 + math.exp(-(merit_factor - 60.0) / 8.5)) if eligible else 0.08
        admitted = 1 if (eligible and random.random() < prob) else 0

    elif target_uni == 'DU_ARTS':
        eligible = (ssc_gpa + hsc_gpa >= 8.0 and ssc_gpa >= 3.0 and hsc_gpa >= 3.0)
        merit_factor = (mock_score * 0.50) + (eng_gp * 5.0) + ((ssc_gpa + hsc_gpa) * 3.0)
        prob = 1 / (1 + math.exp(-(merit_factor - 64.0) / 8.0)) if eligible else 0.05
        admitted = 1 if (eligible and random.random() < prob) else 0

    elif target_uni == 'DU_BUSINESS':
        eligible = (ssc_gpa + hsc_gpa >= 8.0 and ssc_gpa >= 3.0 and hsc_gpa >= 3.0 and math_gp >= 3.0)
        merit_factor = (mock_score * 0.50) + (eng_gp * 4.0) + (math_gp * 3.0) + ((ssc_gpa + hsc_gpa) * 3.0)
        prob = 1 / (1 + math.exp(-(merit_factor - 65.0) / 8.0)) if eligible else 0.05
        admitted = 1 if (eligible and random.random() < prob) else 0

    elif target_uni == 'JU_BIOLOGY':
        eligible = (ssc_gpa + hsc_gpa >= 8.5 and bio_gp >= 4.0 and chem_gp >= 3.5)
        merit_factor = (mock_score * 0.48) + (bio_gp * 4.5) + (chem_gp * 3.5) + ((ssc_gpa + hsc_gpa) * 2.5)
        prob = 1 / (1 + math.exp(-(merit_factor - 67.0) / 7.5)) if eligible else 0.06
        admitted = 1 if (eligible and random.random() < prob) else 0

    return {
        'ssc_gpa': ssc_gpa,
        'hsc_gpa': hsc_gpa,
        'combined_gpa': round(ssc_gpa + hsc_gpa, 2),
        'math_gp': math_gp,
        'physics_gp': physics_gp,
        'chem_gp': chem_gp,
        'bio_gp': bio_gp,
        'eng_gp': eng_gp,
        'mock_score': mock_score,
        'study_hours': study_hours,
        'target_uni': target_uni,
        'admitted': admitted
    }

def main():
    out_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(out_dir, exist_ok=True)
    csv_path = os.path.join(out_dir, 'admission_dataset.csv')

    records = []
    # Generate 500 samples per university target = 4,000 realistic student rows
    for uni in UNIVERSITIES:
        for _ in range(500):
            records.append(generate_student_record(uni))

    # Shuffle dataset
    random.shuffle(records)

    fieldnames = [
        'ssc_gpa', 'hsc_gpa', 'combined_gpa',
        'math_gp', 'physics_gp', 'chem_gp', 'bio_gp', 'eng_gp',
        'mock_score', 'study_hours', 'target_uni', 'admitted'
    ]

    with open(csv_path, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    print(f"Successfully generated {len(records)} admission records at: {csv_path}")

if __name__ == '__main__':
    main()
