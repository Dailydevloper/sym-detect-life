# ML Model Setup & Usage Guide

This directory contains the Machine Learning components for disease prediction based on symptoms.

## 📁 Directory Structure

```
backend/ml/
├── train_model.py         # ML training script
├── inference_service.py   # Flask API for predictions
├── requirements.txt       # Python dependencies
├── models/               # Trained model files (generated)
│   ├── symptom_classifier.pkl
│   ├── symptoms.json
│   ├── label_encoder.pkl
│   └── metadata.json
└── README.md
```

## 🚀 Quick Start

### 1. Install Python Dependencies

```bash
cd backend/ml
pip install -r requirements.txt
```

### 2. Train the Model

```bash
python train_model.py
```

This will:

- Load the dataset from `backend/dataset/`
- Train a Random Forest classifier
- Save the model to `backend/ml/models/`
- Display training accuracy

Expected output:

```
📂 Loading dataset...
✅ Loaded 41 disease records
🔧 Preparing features...
📊 Found X unique symptoms
🤖 Training Random Forest Classifier...
📈 Model Performance:
   Accuracy: XX.XX%
✅ TRAINING COMPLETE!
```

### 3. Start the Inference Service

```bash
python inference_service.py
```

The Flask API will start on `http://localhost:5001`

### 4. Start the Backend Server

```bash
cd backend
npm run dev
```

The Node.js backend will automatically connect to the ML service if it's running.

## 🔌 API Endpoints

### ML Inference Service (Port 5001)

#### Health Check

```bash
GET http://localhost:5001/health
```

Response:

```json
{
  "status": "healthy",
  "model_loaded": true,
  "n_symptoms": 120,
  "n_diseases": 41
}
```

#### Predict Disease

```bash
POST http://localhost:5001/predict
Content-Type: application/json

{
  "symptoms": ["fever", "cough", "headache"]
}
```

Response:

```json
{
  "predictions": [
    {
      "disease": "Common Cold",
      "confidence": 85,
      "rank": 1
    },
    {
      "disease": "Flu",
      "confidence": 65,
      "rank": 2
    }
  ],
  "top_prediction": {
    "disease": "Common Cold",
    "confidence": 85,
    "rank": 1
  },
  "symptoms_matched": ["fever", "cough", "headache"]
}
```

#### Get All Symptoms

```bash
GET http://localhost:5001/symptoms
```

#### Get All Diseases

```bash
GET http://localhost:5001/diseases
```

#### Get Metadata

```bash
GET http://localhost:5001/metadata
```

## 🔧 How It Works

### Training Pipeline

1. **Data Loading**: Reads `dataset.csv` with disease-symptom mappings
2. **Feature Engineering**: Converts symptoms to binary feature vectors
3. **Model Training**: Trains Random Forest classifier
4. **Evaluation**: Tests on 20% hold-out set
5. **Model Export**: Saves model and metadata

### Inference Pipeline

1. **Symptom Normalization**: Cleans and standardizes input
2. **Feature Vectorization**: Converts to binary vector
3. **Prediction**: Uses trained model to predict disease
4. **Ranking**: Returns top 5 predictions with confidence scores

### Hybrid Analysis (Backend Integration)

The Node.js backend uses a **three-tier approach**:

1. **Rule-Based**: Fast, curated medical rules for common conditions
2. **Dataset-Based**: Matches against Kaggle symptom dataset
3. **ML-Based**: Deep learning predictions when ML service is available

**Selection Logic**:

- ML prediction used if confidence > hybrid confidence
- Falls back to hybrid if ML service unavailable
- Returns analysis method used in response

## 📊 Model Details

- **Algorithm**: Random Forest Classifier
- **Features**: Binary encoding of 120+ symptoms
- **Classes**: 41 diseases
- **Dataset**: Kaggle Disease-Symptom Dataset
- **Accuracy**: ~95% on test set (may vary)

## 🔍 Troubleshooting

### Model Not Loading

```
❌ Failed to load model. Please train the model first:
   python train_model.py
```

**Solution**: Run the training script to generate model files.

### ML Service Not Available

```
⚠️  ML Service is not available
```

**Solution**: Start the inference service:

```bash
cd backend/ml
python inference_service.py
```

### Backend Can't Connect to ML Service

**Check**:

1. ML service is running on port 5001
2. No firewall blocking localhost:5001
3. Set environment variable if using different port:
   ```bash
   export ML_SERVICE_URL=http://localhost:5001
   ```

## 🛠️ Configuration

### Environment Variables

- `ML_SERVICE_URL`: URL of the ML inference service (default: `http://localhost:5001`)

### Model Hyperparameters

Edit `train_model.py`:

```python
model = RandomForestClassifier(
    n_estimators=100,      # Number of trees
    max_depth=20,          # Maximum tree depth
    min_samples_split=5,   # Min samples to split node
    min_samples_leaf=2,    # Min samples in leaf
    random_state=42        # For reproducibility
)
```

## 📈 Improving the Model

### Add More Data

Add new disease-symptom mappings to `backend/dataset/dataset.csv`

### Retrain

```bash
python train_model.py
```

### Update Symptom Severity

Edit `backend/dataset/Symptom-severity.csv` to adjust symptom weights

### Add Descriptions/Precautions

Update:

- `symptom_Description.csv` - Disease descriptions
- `symptom_precaution.csv` - Medical precautions

## 🎓 Next Steps

1. **Monitor Performance**: Track prediction accuracy in production
2. **Collect Feedback**: Gather user feedback on diagnoses
3. **Retrain Periodically**: Update model with new data
4. **A/B Testing**: Compare rule-based vs ML performance
5. **Model Versioning**: Track model versions and performance metrics

## 📚 Resources

- [Kaggle Disease Symptom Dataset](https://www.kaggle.com/datasets/itachi9604/disease-symptom-description-dataset)
- [scikit-learn Random Forest](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestClassifier.html)
- [Flask API Documentation](https://flask.palletsprojects.com/)

## ⚠️ Disclaimer

**This ML model is for educational/demonstration purposes only.**

- Not for medical diagnosis
- Always consult healthcare professionals
- Not a substitute for professional medical advice
