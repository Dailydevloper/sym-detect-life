"""
ML Model Training Script for Symptom-Disease Prediction
Uses scikit-learn to train a classifier on the symptom dataset
Includes probability calibration for better confidence scores
"""

import pandas as pd
import numpy as np
import pickle
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import json
import os

# Paths
DATASET_DIR = os.path.join(os.path.dirname(__file__), '..', 'dataset')
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
os.makedirs(MODEL_DIR, exist_ok=True)

def load_dataset():
    """Load and preprocess the symptom dataset"""
    print("📂 Loading dataset...")
    
    # Load main dataset
    df = pd.read_csv(os.path.join(DATASET_DIR, 'dataset.csv'))
    print(f"✅ Loaded {len(df)} disease records")
    
    return df

def prepare_features(df):
    """
    Convert symptom columns to binary feature vectors
    Returns: X (features), y (labels), symptom_list, label_encoder
    """
    print("\n🔧 Preparing features...")
    
    # Extract disease names (target variable)
    diseases = df['Disease'].values
    
    # Extract all symptoms from columns
    symptom_columns = [col for col in df.columns if col.startswith('Symptom_')]
    
    # Get unique symptoms
    all_symptoms = set()
    for col in symptom_columns:
        symptoms = df[col].dropna().str.strip().str.replace('_', ' ').str.lower()
        all_symptoms.update(symptoms)
    
    all_symptoms = sorted(list(all_symptoms))
    print(f"📊 Found {len(all_symptoms)} unique symptoms")
    
    # Create symptom to index mapping
    symptom_to_idx = {symptom: idx for idx, symptom in enumerate(all_symptoms)}
    
    # Build feature matrix (binary encoding)
    X = np.zeros((len(df), len(all_symptoms)))
    
    for i, row in df.iterrows():
        for col in symptom_columns:
            symptom = row[col]
            if pd.notna(symptom):
                symptom_clean = symptom.strip().replace('_', ' ').lower()
                if symptom_clean in symptom_to_idx:
                    X[i, symptom_to_idx[symptom_clean]] = 1
    
    # Encode disease labels
    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(diseases)
    
    print(f"✅ Feature matrix shape: {X.shape}")
    print(f"✅ Number of classes: {len(label_encoder.classes_)}")
    
    return X, y, all_symptoms, label_encoder

def train_model(X, y):
    """Train Random Forest classifier with calibration for better confidence scores"""
    print("\n🤖 Training Random Forest Classifier...")
    
    # Split data - larger test set for calibration
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42, stratify=y
    )
    
    # Further split test set for calibration
    X_train, X_calib, y_train, y_calib = train_test_split(
        X_train, y_train, test_size=0.2, random_state=42, stratify=y_train
    )
    
    print(f"📊 Training set: {len(X_train)} samples")
    print(f"📊 Calibration set: {len(X_calib)} samples")
    print(f"📊 Test set: {len(X_test)} samples")
    
    # Calculate class weights to handle imbalance
    from sklearn.utils.class_weight import compute_class_weight
    class_weights = compute_class_weight(
        'balanced',
        classes=np.unique(y_train),
        y=y_train
    )
    class_weight_dict = dict(enumerate(class_weights))
    
    print(f"\n⚖️  Using balanced class weights to handle imbalance")
    
    # Train base model with optimized hyperparameters
    base_model = RandomForestClassifier(
        n_estimators=250,           # Increased trees
        max_depth=30,               # Deeper trees
        min_samples_split=2,        # Finer splits
        min_samples_leaf=1,         # Single samples in leaves
        max_features='sqrt',        # Feature selection
        class_weight=class_weight_dict,  # Handle class imbalance
        random_state=42,
        n_jobs=-1,
        verbose=0
    )
    
    base_model.fit(X_train, y_train)
    print("✅ Base model trained!")
    
    # Calibrate probabilities for better confidence scores
    print("🔧 Calibrating probability estimates...")
    model = CalibratedClassifierCV(base_model, method='sigmoid', cv=5)
    model.fit(X_calib, y_calib)
    print("✅ Probability calibration complete!")
    
    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\n📈 Model Performance:")
    print(f"   Accuracy: {accuracy * 100:.2f}%")
    
    # Detailed metrics
    print(f"\n📊 Classification Metrics:")
    from sklearn.metrics import precision_recall_fscore_support
    precision, recall, f1, support = precision_recall_fscore_support(
        y_test, y_pred, average='weighted'
    )
    print(f"   Precision: {precision:.3f}")
    print(f"   Recall: {recall:.3f}")
    print(f"   F1-Score: {f1:.3f}")
    
    # Base model feature importance
    feature_importance = base_model.feature_importances_
    print(f"\n🎯 Feature Statistics:")
    print(f"   Mean importance: {feature_importance.mean():.4f}")
    print(f"   Max importance: {feature_importance.max():.4f}")
    
    return model, X_test, y_test, y_pred

def save_model(model, symptom_list, label_encoder):
    """Save trained model and metadata"""
    print("\n💾 Saving model...")
    
    # Save model
    model_path = os.path.join(MODEL_DIR, 'symptom_classifier.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    print(f"✅ Model saved to {model_path}")
    
    # Save symptom list
    symptom_path = os.path.join(MODEL_DIR, 'symptoms.json')
    with open(symptom_path, 'w') as f:
        json.dump(symptom_list, f, indent=2)
    print(f"✅ Symptom list saved to {symptom_path}")
    
    # Save label encoder
    encoder_path = os.path.join(MODEL_DIR, 'label_encoder.pkl')
    with open(encoder_path, 'wb') as f:
        pickle.dump(label_encoder, f)
    print(f"✅ Label encoder saved to {encoder_path}")
    
    # Save metadata
    metadata = {
        'n_symptoms': len(symptom_list),
        'n_diseases': len(label_encoder.classes_),
        'disease_classes': label_encoder.classes_.tolist(),
        'model_type': 'RandomForestClassifier',
        'feature_encoding': 'binary'
    }
    
    metadata_path = os.path.join(MODEL_DIR, 'metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"✅ Metadata saved to {metadata_path}")

def main():
    """Main training pipeline"""
    print("=" * 60)
    print("🏥 SYMPTOM-DISEASE ML MODEL TRAINING")
    print("=" * 60)
    
    # Load data
    df = load_dataset()
    
    # Prepare features
    X, y, symptom_list, label_encoder = prepare_features(df)
    
    # Train model
    model, X_test, y_test, y_pred = train_model(X, y)
    
    # Save model
    save_model(model, symptom_list, label_encoder)
    
    print("\n" + "=" * 60)
    print("✅ TRAINING COMPLETE!")
    print("=" * 60)
    print(f"\n📦 Model files saved in: {MODEL_DIR}")
    print("\n🚀 Next steps:")
    print("   1. Use the model for predictions via inference service")
    print("   2. Integrate with backend API endpoint")
    print("   3. Monitor performance and retrain as needed")

if __name__ == "__main__":
    main()
