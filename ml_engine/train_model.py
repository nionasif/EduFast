"""
EduFast Machine Learning Model Trainer
Uses Scikit-Learn to train realistic admission prediction models on Bangladeshi University admission dataset.
Saves model pipeline to joblib and outputs performance metrics (Accuracy, F1, ROC-AUC).
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import joblib

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(base_dir, 'dataset', 'admission_dataset.csv')
    models_dir = os.path.join(base_dir, 'models')
    os.makedirs(models_dir, exist_ok=True)

    print(f"[1/5] Loading admission dataset from: {dataset_path}...")
    df = pd.read_csv(dataset_path)
    print(f"Dataset shape: {df.shape} (Rows: {len(df)}, Features: {len(df.columns)})")

    # Define feature columns
    numerical_features = [
        'ssc_gpa', 'hsc_gpa', 'combined_gpa',
        'math_gp', 'physics_gp', 'chem_gp', 'bio_gp', 'eng_gp',
        'mock_score', 'study_hours'
    ]
    categorical_features = ['target_uni']
    
    X = df[numerical_features + categorical_features]
    y = df['admitted']

    # Train-test split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=X['target_uni']
    )
    print(f"[2/5] Split completed: {len(X_train)} train samples, {len(X_test)} test samples.")

    # Preprocessing pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_features),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features)
        ]
    )

    # 1. Baseline Model: Logistic Regression
    print("[3/5] Evaluating Baseline Logistic Regression model...")
    baseline_pipe = Pipeline([
        ('prep', preprocessor),
        ('clf', LogisticRegression(max_iter=1000, random_state=42))
    ])
    baseline_pipe.fit(X_train, y_train)
    base_preds = baseline_pipe.predict(X_test)
    base_acc = accuracy_score(y_test, base_preds)
    base_f1 = f1_score(y_test, base_preds)
    print(f"Logistic Regression -> Accuracy: {base_acc*100:.2f}%, F1: {base_f1:.4f}")

    # 2. Main Model: Random Forest Classifier
    print("[4/5] Training Random Forest Classifier (n_estimators=150, max_depth=12)...")
    rf_pipe = Pipeline([
        ('prep', preprocessor),
        ('clf', RandomForestClassifier(n_estimators=150, max_depth=12, random_state=42, n_jobs=-1))
    ])
    rf_pipe.fit(X_train, y_train)
    rf_preds = rf_pipe.predict(X_test)
    rf_proba = rf_pipe.predict_proba(X_test)[:, 1]

    rf_acc = accuracy_score(y_test, rf_preds)
    rf_prec = precision_score(y_test, rf_preds)
    rf_rec = recall_score(y_test, rf_preds)
    rf_f1 = f1_score(y_test, rf_preds)
    cm = confusion_matrix(y_test, rf_preds).tolist()

    # Cross-validation
    cv_scores = cross_val_score(rf_pipe, X, y, cv=5, scoring='accuracy')

    print(f"Random Forest -> Accuracy: {rf_acc*100:.2f}% (5-Fold CV: {cv_scores.mean()*100:.2f}% ± {cv_scores.std()*100:.2f}%)")
    print(f"Precision: {rf_prec:.4f}, Recall: {rf_rec:.4f}, F1-Score: {rf_f1:.4f}")

    # Extract Feature Importances
    encoder = rf_pipe.named_steps['prep'].named_transformers_['cat']
    cat_feature_names = encoder.get_feature_names_out(categorical_features).tolist()
    all_feature_names = numerical_features + cat_feature_names
    importances = rf_pipe.named_steps['clf'].feature_importances_

    feature_ranking = sorted(
        [{'feature': name, 'importance': round(float(imp), 4)} for name, imp in zip(all_feature_names, importances)],
        key=lambda x: x['importance'],
        reverse=True
    )

    # Save trained model artifact
    model_save_path = os.path.join(models_dir, 'admission_model.joblib')
    joblib.dump(rf_pipe, model_save_path, compress=3)
    print(f"[5/5] Model saved successfully: {model_save_path}")

    # Save metrics and metadata
    metrics_path = os.path.join(models_dir, 'model_metrics.json')
    metrics_data = {
        'model_name': 'RandomForestClassifier',
        'library': 'scikit-learn 1.9.1 / Python 3.13',
        'training_samples': int(len(X_train)),
        'test_samples': int(len(X_test)),
        'metrics': {
            'accuracy': round(float(rf_acc), 4),
            'precision': round(float(rf_prec), 4),
            'recall': round(float(rf_rec), 4),
            'f1_score': round(float(rf_f1), 4),
            'cv_mean_accuracy': round(float(cv_scores.mean()), 4),
            'cv_std_accuracy': round(float(cv_scores.std()), 4),
            'confusion_matrix': cm
        },
        'comparison': {
            'logistic_regression_accuracy': round(float(base_acc), 4),
            'logistic_regression_f1': round(float(base_f1), 4)
        },
        'feature_importance_top10': feature_ranking[:10],
        'features': numerical_features,
        'categories': list(df['target_uni'].unique())
    }

    with open(metrics_path, 'w', encoding='utf-8') as f:
        json.dump(metrics_data, f, indent=2, ensure_ascii=False)

    print(f"Metrics saved to: {metrics_path}")
    print("\nTraining complete! Ready for high-precision inference.")

if __name__ == '__main__':
    main()
