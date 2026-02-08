# Hybrid ML + Rule-Based Symptom Checker

## 🎯 Overview

This project implements a **three-tier hybrid symptom analysis system** combining:

1. **Rule-Based Analysis** - Fast, curated medical rules for common conditions
2. **Dataset-Based Matching** - Kaggle disease-symptom dataset (41 diseases, 120+ symptoms)
3. **ML Predictions** - Random Forest classifier for advanced diagnosis

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│                    SymptomChecker.tsx                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               Backend API (Node.js/Express)                  │
│                symptom-check.routes.ts                       │
└──────────┬─────────────────┬─────────────────┬─────────────┘
           │                 │                 │
           ▼                 ▼                 ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │ Rule-Based   │  │ Dataset      │  │ ML Service   │
   │ Analyzer     │  │ Loader       │  │ (Python)     │
   └──────────────┘  └──────────────┘  └──────────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │ CSV Dataset      │
                     │ (41 diseases)    │
                     └──────────────────┘
```

## 🚀 Quick Start

### 1. Setup Dataset (Already Done)

Dataset is located in `backend/dataset/`:

- `dataset.csv` - Disease → Symptoms mapping
- `Symptom-severity.csv` - Symptom severity weights
- `symptom_Description.csv` - Disease descriptions
- `symptom_precaution.csv` - Medical precautions

### 2. Install Dependencies

**Backend (Node.js):**

```bash
cd backend
npm install
```

**ML Service (Python):**

```bash
cd backend/ml
pip install -r requirements.txt
```

### 3. Train ML Model

**Option A - Using Batch File (Windows):**

```bash
cd backend\ml
setup.bat
```

**Option B - Manual:**

```bash
cd backend/ml
python train_model.py
```

Expected output:

```
🏥 SYMPTOM-DISEASE ML MODEL TRAINING
====================================
📂 Loading dataset...
✅ Loaded 41 disease records
🔧 Preparing features...
📊 Found 120+ unique symptoms
🤖 Training Random Forest Classifier...
📈 Model Performance:
   Accuracy: ~95%
✅ TRAINING COMPLETE!
```

### 4. Start Services

**Terminal 1 - ML Service:**

```bash
cd backend\ml
start_ml_service.bat
```

Or manually:

```bash
python inference_service.py
```

**Terminal 2 - Backend API:**

```bash
cd backend
npm run dev
```

**Terminal 3 - Frontend:**

```bash
npm run dev
```

## 🔍 How It Works

### Analysis Flow

When a user submits symptoms:

1. **Rule-Based Analysis**
   - Matches against 10 curated medical conditions
   - Uses fuzzy string matching (Levenshtein distance)
   - Confidence scoring based on required/optional symptoms

2. **Dataset-Based Analysis**
   - Searches 41 diseases from Kaggle dataset
   - Weighted matching using symptom severity
   - Returns top matches with confidence scores

3. **ML Prediction** (if service available)
   - Converts symptoms to binary feature vector
   - Random Forest classifier predicts disease
   - Returns top 5 predictions with probabilities

4. **Selection Logic**
   ```
   if (ML_confidence > Hybrid_confidence):
       use ML_prediction
   else:
       use Hybrid_prediction
   ```

### Code Components

#### 1. Dataset Loader

**File:** `backend/src/utils/dataset-loader.ts`

Loads and parses CSV files:

- Disease-symptom mappings
- Symptom severity weights
- Disease descriptions and precautions

```typescript
const loader = getDatasetLoader();
const matches = loader.findMatchingDiseases(["fever", "cough"]);
```

#### 2. Symptom Analyzer (Hybrid)

**File:** `backend/src/utils/symptom-analyzer.ts`

Combines rule-based + dataset matching:

```typescript
const result = analyzeSymptoms(["fever", "headache", "fatigue"]);
// Returns: { condition, severity, confidence, recommendations, ... }
```

#### 3. ML Service Client

**File:** `backend/src/utils/ml-service-client.ts`

Communicates with Python ML service:

```typescript
const mlClient = getMLServiceClient();
const prediction = await mlClient.predict(["fever", "cough"]);
// Returns: { predictions, top_prediction, symptoms_matched }
```

#### 4. API Routes

**File:** `backend/src/routes/symptom-check.routes.ts`

Integrates all three approaches:

```typescript
POST /api/symptom-checks
{
  "symptoms": ["fever", "cough", "headache"]
}

Response:
{
  "ai_diagnosis": "Common Cold",
  "severity_level": "low",
  "confidence": 85,
  "recommendations": [...],
  "matched_symptoms": [...],
  "analysis_method": "ml" | "dataset" | "rule-based",
  "description": "..."
}
```

## 📊 Dataset Statistics

- **Diseases:** 41 conditions
- **Unique Symptoms:** 120+
- **Symptom Columns:** 17 per disease
- **Sources:**
  - Primary: Kaggle Disease-Symptom Dataset
  - Severity: Medical severity weights (1-7 scale)
  - Descriptions: Medical descriptions per disease
  - Precautions: 4 precautions per disease

## 🎯 Confidence Scoring

### Rule-Based

- Required symptoms matched: 50%+ → proceed
- Optional symptoms boost confidence
- Required match ≥80% → +10% bonus
- Cap: 95% (never 100%)

### Dataset-Based

- Match percentage: matched / total_symptoms
- Weighted by symptom severity
- Cap: 85%

### ML-Based

- Random Forest probability output
- Normalized to percentage
- Top 5 predictions returned

## 🧪 Testing

### Test the ML Service Directly

```bash
curl -X POST http://localhost:5001/predict \
  -H "Content-Type: application/json" \
  -d '{"symptoms": ["fever", "cough", "headache"]}'
```

### Test via Backend API

```bash
# First login to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'

# Then use token for symptom check
curl -X POST http://localhost:3000/api/symptom-checks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"symptoms": ["fever", "cough", "fatigue"]}'
```

## 🔧 Configuration

### ML Service URL

Set environment variable:

```bash
# Windows
set ML_SERVICE_URL=http://localhost:5001

# Linux/Mac
export ML_SERVICE_URL=http://localhost:5001
```

### Fallback Behavior

If ML service unavailable:

- Backend logs: `⚠️  ML Service is not available`
- Automatically falls back to hybrid analysis
- User gets result without interruption

## 📈 Performance

### Expected Metrics

| Metric                 | Value         |
| ---------------------- | ------------- |
| ML Model Accuracy      | ~95%          |
| Rule-Based Coverage    | 10 conditions |
| Dataset Coverage       | 41 diseases   |
| Response Time (ML)     | <500ms        |
| Response Time (Hybrid) | <100ms        |

## 🐛 Troubleshooting

### ML Service Won't Start

**Error:** `Model not found`

```bash
cd backend/ml
python train_model.py
```

**Error:** `Port 5001 already in use`

```bash
# Windows
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Change port
set FLASK_PORT=5002
```

### Backend Can't Connect to ML

**Check:**

1. ML service running: `curl http://localhost:5001/health`
2. No firewall blocking
3. Correct URL in environment

### Low Confidence Scores

**Causes:**

- User symptoms too vague
- Symptoms not in dataset
- Symptoms match multiple diseases

**Solutions:**

- Ask user for more specific symptoms
- Add more symptoms to inputs
- Check dataset coverage

## 📚 Adding New Diseases

### 1. Update Dataset CSV

Add row to `backend/dataset/dataset.csv`:

```csv
New Disease,symptom1,symptom2,symptom3,...
```

### 2. Add Description

Add to `backend/dataset/symptom_Description.csv`:

```csv
New Disease,"Medical description here"
```

### 3. Add Precautions

Add to `backend/dataset/symptom_precaution.csv`:

```csv
New Disease,precaution1,precaution2,precaution3,precaution4
```

### 4. Retrain Model

```bash
cd backend/ml
python train_model.py
```

### 5. Restart Services

## 🎓 Future Improvements

### Short-term

- [ ] Add symptom autocomplete in frontend
- [ ] Display matched symptoms in UI
- [ ] Show confidence visualization
- [ ] Add "analysis method" badge

### Medium-term

- [ ] Implement feedback collection
- [ ] A/B test rule-based vs ML
- [ ] Add symptom severity UI input
- [ ] Multi-language support

### Long-term

- [ ] Deep learning model (BERT/transformers)
- [ ] Real-time model updates
- [ ] Personalized recommendations
- [ ] Integration with medical APIs

## ⚠️ Medical Disclaimer

**IMPORTANT:** This system is for educational purposes only.

- Not a substitute for professional medical advice
- Not for actual medical diagnosis
- Always consult healthcare professionals
- Emergency symptoms require immediate medical attention

## 📖 References

- [Kaggle Disease Dataset](https://www.kaggle.com/datasets/itachi9604/disease-symptom-description-dataset)
- [scikit-learn](https://scikit-learn.org/)
- [Random Forest Algorithm](https://en.wikipedia.org/wiki/Random_forest)

## 👥 Support

For issues or questions:

1. Check troubleshooting section
2. Review [ML README](backend/ml/README.md)
3. Check backend logs
4. Review ML service logs

---

**Last Updated:** February 2026
**Version:** 1.0.0
