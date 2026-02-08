@echo off
echo ============================================
echo ML Model Setup Script
echo ============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

echo [1/3] Installing Python dependencies...
cd /d "%~dp0"
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/3] Training ML model...
python train_model.py
if errorlevel 1 (
    echo ERROR: Model training failed
    pause
    exit /b 1
)

echo.
echo [3/3] Setup complete!
echo.
echo ============================================
echo To start the ML inference service, run:
echo   start_ml_service.bat
echo ============================================
pause
