@echo off
title Cravelle POS Launcher
echo.
echo   Starting Cravelle POS...
echo.

rem PHP and Node live inside Laragon and are not on the Windows PATH, so a
rem plain cmd window cannot see them. Prefer whatever is installed system-wide
rem and fall back to the copies Laragon ships.
where php >nul 2>&1
if errorlevel 1 (
  for /d %%D in ("C:\laragon\bin\php\php-*") do set "PATH=%%D;%PATH%"
)

where npm >nul 2>&1
if errorlevel 1 (
  for /d %%D in ("C:\laragon\bin\nodejs\node-*") do set "PATH=%%D;%PATH%"
)

where php >nul 2>&1
if errorlevel 1 (
  echo   PHP was not found. Start Laragon once, or install PHP, then try again.
  pause
  exit
)

where npm >nul 2>&1
if errorlevel 1 (
  echo   Node.js was not found. Install it from nodejs.org, restart Windows,
  echo   then try again.
  pause
  exit
)

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
