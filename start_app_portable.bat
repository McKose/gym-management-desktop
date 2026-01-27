@echo off
SETLOCAL EnableDelayedExpansion

:: Change directory to the script's location
cd /d "%~dp0"

echo ===================================================
echo Gym Management System Baslatiliyor...
echo ===================================================

:: Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [HATA] Node.js bulunamadi! Lutfen Node.js yukleyin: https://nodejs.org/
    pause
    exit /b
)

:: Check if dependencies are installed
if not exist "node_modules" (
    echo [BILGI] Gerekli kutuphaneler yukleniyor...
    call npm install
    if %errorlevel% neq 0 (
        echo [HATA] Kutuphaneler yuklenemedi. Internet baglantinizi kontrol edin.
        pause
        exit /b
    )
)

echo [BILGI] Uygulama baslatiliyor...
echo Tarayiciniz otomatik olarak acilacaktir: http://localhost:3000

:: Start the application
call npm run dev

pause
