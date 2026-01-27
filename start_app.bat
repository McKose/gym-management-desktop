@echo off
cd /d "%~dp0"
echo Baslatiliyor...
SET PATH=C:\Program Files\nodejs;%PATH%
npm run dev
pause
