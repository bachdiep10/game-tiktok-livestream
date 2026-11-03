@echo off
chcp 65001 >nul
cd /d "%~dp0"
rem Tat ban game cu neu con chay ngam
taskkill /F /IM node.exe >nul 2>&1
if not exist node_modules\msedge-tts (
  echo Dang cai thu vien lan dau...
  call npm install
)
start "" http://127.0.0.1:3000/cau-ca-control.html
node server.js
pause
