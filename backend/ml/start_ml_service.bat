@echo off
echo ============================================
echo Starting ML Inference Service
echo ============================================
echo.

REM Check if model exists
if not exist "models\symptom_classifier.pkl" (
    echo ERROR: Model not found!
    echo Please run setup.bat first to train the model
    pause
    exit /b 1
)

cd /d "%~dp0"
echo Starting Flask server on http://localhost:5001
echo Press Ctrl+C to stop
echo.
python inference_service.py
pause
