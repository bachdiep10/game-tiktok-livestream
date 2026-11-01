@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist node_modules (
  echo Dang cai thu vien lan dau...
  call npm install
)
start "" http://127.0.0.1:3000/control.html
node server.js
pause
