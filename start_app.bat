@echo off
cd /d %~dp0laravel-backend

if "%1"=="" goto help
if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
goto help

:start
echo Starting PHP Aromas...
start "PHP Aromas Server" cmd /c "php artisan serve --host=127.0.0.1 --port=8000"
goto end

:stop
echo Stopping PHP Aromas server...
taskkill /F /IM php.exe 2>nul
goto end

:restart
echo Restarting PHP Aromas...
call :stop
timeout /t 2 >nul
call :start
goto end

:help
echo Usage: start_app.bat [start^|stop^|restart]
echo.
echo Commands:
echo   start_app.bat start    - Start the server
echo   start_app.bat stop     - Stop the server
echo   start_app.bat restart  - Restart the server
echo   start_app.bat          - Show this help

:end