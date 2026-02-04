@echo off
setlocal
cd /d "%~dp0"

echo ==========================================
echo   Gym Management System - Setup and Demo
echo ==========================================

echo [INFO] Cleaning up old processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM electron.exe >nul 2>&1

:: Clean Next.js lock file if it exists
if exist ".next\dev\lock" del ".next\dev\lock"

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check dependencies
if not exist "node_modules" (
    echo [INFO] node_modules not found. Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
) else (
    echo [INFO] Dependencies found. Skipping install.
)

echo.
echo [INFO] Starting Application...
echo.

:: Run the dev script
call npm run dev

pause
