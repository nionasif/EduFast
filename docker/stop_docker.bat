@echo off
echo ========================================================
echo       EduFast - Stop Docker Containers
echo ========================================================
echo.

where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker is not installed or not in PATH!
    pause
    exit /b 1
)

cd /d "%~dp0"
docker compose down

echo.
echo All EduFast Docker containers stopped cleanly.
pause
