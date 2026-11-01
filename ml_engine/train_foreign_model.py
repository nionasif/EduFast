"""
EduFast Higher Education ML Model Trainer
Trains a Scikit-Learn RandomForestClassifier to classify foreign admission chances
into Safe (High Chance), Target (Competitive), and Ambitious (High Profile/Reach).
"""

import os
import json
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(base_dir, 'dataset', 'foreign_admission_dataset.csv')
    models_dir = os.path.join(base_dir, 'models')
    os.makedirs(models_dir, exist_ok=True)

    print(f"Loading study abroad dataset from: {dataset_path}...")
    df = pd.read_csv(dataset_path)

    numerical_features = ['cgpa', 'ielts', 'gre', 'publications', 'extracurricular', 'work_exp_years']
    categorical_features = ['target_country', 'degree']

    X = df[numerical_features + categorical_features]
    y = df['chance_tier']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_features),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features)
        ]
    )

    rf_pipe = Pipeline([
        ('prep', preprocessor),
        ('clf', RandomForestClassifier(n_estimators=120, max_depth=10, random_state=42, n_jobs=-1))
    ])

    print("Training Foreign Admission Random Forest Model...")
    rf_pipe.fit(X_train, y_train)

    preds = rf_pipe.predict(X_test)
    acc = accuracy_score(y_test, preds)
    cv_scores = cross_val_score(rf_pipe, X, y, cv=5, scoring='accuracy')

    print(f"Foreign Model Accuracy: {acc*100:.2f}% (5-Fold CV: {cv_scores.mean()*100:.2f}%)")

    model_path = os.path.join(models_dir, 'foreign_admission_model.joblib')
    joblib.dump(rf_pipe, model_path, compress=3)

    metrics_path = os.path.join(models_dir, 'foreign_model_metrics.json')
    with open(metrics_path, 'w', encoding='utf-8') as f:
        json.dump({
            'model': 'RandomForestClassifier (Higher Education Support)',
            'training_samples': len(X_train),
            'test_samples': len(X_test),
            'accuracy': round(float(acc), 4),
            'cv_accuracy': round(float(cv_scores.mean()), 4),
            'features': numerical_features + categorical_features
        }, f, indent=2)

    print(f"Model saved to: {model_path}")

if __name__ == '__main__':
    main()
