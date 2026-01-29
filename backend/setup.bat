@echo off
echo ========================================
echo   Symptom Detection Backend Setup
echo ========================================
echo.

:: Check if .env exists
if exist .env (
    echo [!] .env file already exists
    echo.
    set /p overwrite="Do you want to overwrite it? (y/n): "
    if /i not "%overwrite%"=="y" (
        echo Setup cancelled.
        exit /b
    )
)

:: Copy .env.example to .env
copy .env.example .env >nul

echo [+] Created .env file
echo.
echo Please edit backend\.env and configure:
echo   1. DB_PASSWORD - Your PostgreSQL password
echo   2. JWT_SECRET - A secure random string
echo   3. GOOGLE_CLIENT_ID - Google OAuth Client ID (optional)
echo   4. GOOGLE_CLIENT_SECRET - Google OAuth Client Secret (optional)
echo.
set /p continue="Press Enter to open .env file in notepad..."
notepad .env

echo.
echo ========================================
echo   Next Steps:
echo ========================================
echo.
echo 1. Make sure PostgreSQL is running
echo 2. Create database: CREATE DATABASE symptom_detect;
echo 3. Run migrations: npm run db:migrate
echo 4. Start server: npm run dev
echo.
pause
