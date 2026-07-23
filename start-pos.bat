@echo off
title Cravelle POS Launcher
echo Starting Cravelle POS...

rem Start the Laravel backend in its own window
start "Cravelle POS - Backend (do not close)" cmd /k "cd /d %~dp0backend && php artisan serve"

rem Start the React frontend in its own window
start "Cravelle POS - Frontend (do not close)" cmd /k "cd /d %~dp0frontend && npm run dev"

rem Give the servers a few seconds, then open the POS in the default browser
timeout /t 6 /nobreak >nul
start http://localhost:5173
exit
