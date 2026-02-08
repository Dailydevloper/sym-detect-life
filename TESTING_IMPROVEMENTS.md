# Testing the Improved Hybrid System

## 🚀 Quick Test Steps

### 1. Make sure backend is running

```bash
cd backend
npm run dev
```

(Should be running on port 3000)

### 2. Start ML Service (in new terminal)

```bash
cd backend\ml
python inference_service.py
```

(Should start on port 5001)

### 3. Test with Your Symptoms

**Common Cold Symptoms:**

```bash
curl -X POST http://localhost:3000/api/symptom-checks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "symptoms": ["headache", "fever", "runny nose"]
  }'
```

Expected Result: Should show **Common Cold or similar** with ~80%+ confidence  
❌ Before: Showed "Chickenpox 25%"  
✅ After: Should show "Common Cold" with higher confidence

**Flu Symptoms:**

```json
{
  "symptoms": ["fever", "cough", "runny nose", "fatigue"]
}
```

Expected: **Flu** with 75%+ confidence  
❌ Before: Showed "Tuberculosis"  
✅ After: Should correctly identify Flu

## 🔧 What Was Improved

### 1. **ML Model Training** ✅

- Added **class weight balancing** to handle disease imbalance
- Implemented **probability calibration** (sigmoid method) for realistic confidence scores
- Increased trees: 100 → 250
- Better hyperparameters for splitting
- Larger test set (30%) for better evaluation

### 2. **Symptom Analyzer** ✅

- Improved dataset confidence calculation (0-90% scale)
- Better match quality scoring
- Boosts confidence for good matches
- More sensible severity mapping

### 3. **Backend API** ✅

- ML only used if:
  - Confidence > 45%
  - AND >8% better than hybrid analysis
  - Prevents poor ML predictions from overriding good hybrid analysis

### 4. **ML Service** ✅

- Filters predictions < 10% confidence
- Returns top 10 instead of top 5
- Better debugging info

## 📊 Expected Improvements

| Before                             | After                       |
| ---------------------------------- | --------------------------- |
| "Chickenpox 25%" for cold symptoms | "Common Cold 85%" ✅        |
| "Tuberculosis" for flu             | "Flu 80%" ✅                |
| Unreliable confidences             | Calibrated probabilities ✅ |
| Random predictions                 | More specific matches ✅    |

## 🧪 How to Debug

### Check ML Service Output

The inference service logs will show:

```
📂 Loading ML model...
✅ Model loaded
✅ Loaded 131 symptoms
✅ Loaded 41 disease classes
🚀 Starting Flask server...
```

### Check Backend Logs

```
📊 Preferring hybrid analysis (confidence: 65%) over ML (40%)
🤖 Using ML prediction: Flu (72%)
```

### If Still Getting Bad Results

1. **Check dataset loading:**

   ```bash
   cd backend
   node -e "const {getDatasetLoader} = require('./src/utils/dataset-loader.ts'); const l = getDatasetLoader(); console.log(l.getAllDiseases().length);"
   ```

2. **Test ML directly:**

   ```bash
   curl -X POST http://localhost:5001/predict \
     -H "Content-Type: application/json" \
     -d '{"symptoms": ["fever", "cough", "headache"]}'
   ```

3. **Verify model files exist:**
   ```bash
   ls backend\ml\models\
   ```
   Should show: `symptom_classifier.pkl`, `symptoms.json`, `label_encoder.pkl`, `metadata.json`

## 🎯 Next Steps If Issues Persist

1. **Clear model cache** (if any):

   ```bash
   rm backend\ml\models\*
   cd backend\ml
   python train_model.py
   ```

2. **Restart all services:**
   - Close ML service (port 5001)
   - Close backend (port 3000)
   - Restart both

3. **Check logs** for any errors in:
   - Backend console
   - ML service console

## ✅ Success Indicators

✓ ML service starts without errors  
✓ Backend connects to ML service (logs show connection)  
✓ Common symptoms get accurate diagnosis  
✓ Confidence scores are reasonable (40-90%)  
✓ System prefers good hybrid matches over weak ML

Let me know which of your test cases still fails!
