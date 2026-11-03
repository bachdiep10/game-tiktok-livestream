@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul || (echo Chua cai Node.js. Tai tai https://nodejs.org && pause && exit /b)
if not exist node_modules (echo Dang cai thu vien... && call npm install --omit=dev)
start "" http://localhost:8080/admin/
node server.js
pause
