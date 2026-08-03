@echo off
title Cravelle POS Launcher
echo.
echo   Starting Cravelle POS...
echo.

rem Start the Laravel backend in its own window
start "Cravelle POS - Backend (do not close)" cmd /k "cd /d %~dp0backend && php artisan serve"

rem Start the React frontend in its own window
start "Cravelle POS - Frontend (do not close)" cmd /k "cd /d %~dp0frontend && npm run dev"

rem On a cold boot the dev server can take half a minute to warm up. Opening
rem the browser on a fixed timer lands on ERR_CONNECTION_REFUSED, so wait until
rem the till is actually listening before opening it.
echo   Waiting for the till to come up (this can take up to a minute)...
set /a tries=0

:wait
set /a tries+=1
timeout /t 2 /nobreak >nul
netstat -an | findstr "LISTENING" | findstr ":5173" >nul 2>&1
if not errorlevel 1 goto ready
if %tries% lss 60 goto wait

echo.
echo   The till did not start within two minutes.
echo   Look at the two windows that opened - one of them will show the error.
echo.
pause
exit

:ready
start http://localhost:5173
exit
