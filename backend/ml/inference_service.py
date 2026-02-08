"""
Flask Inference Service for ML Model
Provides REST API for symptom-disease predictions
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import json
import numpy as np
import os

app = Flask(__name__)
CORS(app)

# Global model variables
model = None
symptom_list = None
label_encoder = None
symptom_to_idx = None
metadata = None

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')

def load_model_files():
    """Load trained model and supporting files"""
    global model, symptom_list, label_encoder, symptom_to_idx, metadata
    
    try:
        print("📂 Loading ML model...")
        
        # Load model
        with open(os.path.join(MODEL_DIR, 'symptom_classifier.pkl'), 'rb') as f:
            model = pickle.load(f)
        print("✅ Model loaded")
        
        # Load symptom list
        with open(os.path.join(MODEL_DIR, 'symptoms.json'), 'r') as f:
            symptom_list = json.load(f)
        symptom_to_idx = {symptom: idx for idx, symptom in enumerate(symptom_list)}
        print(f"✅ Loaded {len(symptom_list)} symptoms")
        
        # Load label encoder
        with open(os.path.join(MODEL_DIR, 'label_encoder.pkl'), 'rb') as f:
            label_encoder = pickle.load(f)
        print(f"✅ Loaded {len(label_encoder.classes_)} disease classes")
        
        # Load metadata
        with open(os.path.join(MODEL_DIR, 'metadata.json'), 'r') as f:
            metadata = json.load(f)
        print("✅ Metadata loaded")
        
        return True
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return False

def normalize_symptom(symptom):
    """Normalize symptom text for matching"""
    return symptom.lower().strip().replace('_', ' ')

def symptom_to_vector(symptoms):
    """Convert list of symptoms to binary feature vector"""
    vector = np.zeros(len(symptom_list))
    
    normalized_symptoms = [normalize_symptom(s) for s in symptoms]
    
    for user_symptom in normalized_symptoms:
        # Try exact match
        if user_symptom in symptom_to_idx:
            vector[symptom_to_idx[user_symptom]] = 1
        else:
            # Try fuzzy matching
            for known_symptom, idx in symptom_to_idx.items():
                if user_symptom in known_symptom or known_symptom in user_symptom:
                    vector[idx] = 1
                    break
    
    return vector

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'n_symptoms': len(symptom_list) if symptom_list else 0,
        'n_diseases': len(label_encoder.classes_) if label_encoder else 0
    })

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict disease from symptoms with intelligent filtering
    
    Request body:
    {
        "symptoms": ["fever", "cough", "headache"]
    }
    
    Response:
    {
        "predictions": [
            {
                "disease": "Flu",
                "confidence": 72,
                "rank": 1
            },
            ...
        ],
        "top_prediction": {
            "disease": "Flu",
            "confidence": 72
        }
    }
    """
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        data = request.get_json()
        
        if not data or 'symptoms' not in data:
            return jsonify({'error': 'Missing symptoms field'}), 400
        
        symptoms = data['symptoms']
        
        if not symptoms or len(symptoms) == 0:
            return jsonify({'error': 'No symptoms provided'}), 400
        
        # Convert symptoms to feature vector
        X = symptom_to_vector(symptoms).reshape(1, -1)
        
        # Get prediction probabilities
        probabilities = model.predict_proba(X)[0]
        
        # Get top predictions (sorted by confidence)
        top_indices = np.argsort(probabilities)[::-1][:10]  # Top 10
        
        predictions = []
        for rank, idx in enumerate(top_indices, 1):
            disease = label_encoder.classes_[idx]
            confidence = float(probabilities[idx])
            confidence_percent = round(confidence * 100)
            
            # Filter: only include predictions with confidence > 10%
            # and only if it's in top 5 OR confidence > 25%
            if confidence_percent > 10 and (rank <= 5 or confidence_percent > 25):
                predictions.append({
                    'disease': disease,
                    'confidence': confidence_percent,
                    'rank': len(predictions) + 1
                })
        
        if len(predictions) == 0:
            return jsonify({
                'predictions': [],
                'top_prediction': None,
                'message': 'No confident predictions found. Please provide more symptoms.',
                'debug_info': {
                    'symptoms_provided': len(symptoms),
                    'top_raw_confidence': round(probabilities[top_indices[0]] * 100)
                }
            })
        
        return jsonify({
            'predictions': predictions,
            'top_prediction': predictions[0],
            'symptoms_matched': symptoms,
            'confidence_note': 'Lower confidence predictions may be less reliable'
        })
        
    except Exception as e:
        print(f"❌ Prediction error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/symptoms', methods=['GET'])
def get_symptoms():
    """Get list of all known symptoms"""
    if symptom_list is None:
        return jsonify({'error': 'Model not loaded'}), 500
    
    return jsonify({
        'symptoms': symptom_list,
        'count': len(symptom_list)
    })

@app.route('/diseases', methods=['GET'])
def get_diseases():
    """Get list of all known diseases"""
    if label_encoder is None:
        return jsonify({'error': 'Model not loaded'}), 500
    
    return jsonify({
        'diseases': label_encoder.classes_.tolist(),
        'count': len(label_encoder.classes_)
    })

@app.route('/metadata', methods=['GET'])
def get_metadata():
    """Get model metadata"""
    if metadata is None:
        return jsonify({'error': 'Model not loaded'}), 500
    
    return jsonify(metadata)

if __name__ == '__main__':
    print("=" * 60)
    print("🏥 ML INFERENCE SERVICE")
    print("=" * 60)
    
    # Load model on startup
    if not load_model_files():
        print("❌ Failed to load model. Please train the model first:")
        print("   python train_model.py")
        exit(1)
    
    print("\n🚀 Starting Flask server...")
    print("📡 Endpoints:")
    print("   GET  /health    - Health check")
    print("   POST /predict   - Predict disease from symptoms")
    print("   GET  /symptoms  - Get all known symptoms")
    print("   GET  /diseases  - Get all known diseases")
    print("   GET  /metadata  - Get model metadata")
    print("\n" + "=" * 60)
    
    app.run(host='0.0.0.0', port=5001, debug=False)
