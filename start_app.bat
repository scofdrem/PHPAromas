@echo off
cd /d %~dp0

if "%1"=="" goto help
if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
goto help

:start
echo Starting PHP Aromas (with auto-reload)...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0start_app.ps1" start
goto end

:stop
echo Stopping PHP Aromas...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0start_app.ps1" stop
goto end

:restart
echo Restarting PHP Aromas...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0start_app.ps1" restart
goto end

:help
echo Usage: start_app.bat [start^|stop^|restart]
echo.
echo Commands:
echo   start_app.bat start    - Start backend ^& frontend with auto-reload
echo   start_app.bat stop    - Stop all running services
echo   start_app.bat restart - Restart all services
echo   start_app.bat         - Show this help
echo.
echo Auto-reload: Backend restarts on PHP file changes in app/, routes/, config/, database/
echo Frontend hot-reloads via Vite HMR on .tsx/.ts/.css changes.

:end