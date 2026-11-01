@echo off
echo ========================================================
echo       EduFast - 1-Click Docker Production Launcher
echo ========================================================
echo.

where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker is not installed or not in your system PATH!
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    echo Or run "install_docker_desktop.bat" in this folder.
    echo.
    pause
    exit /b 1
)

echo [1/2] Building and launching Docker containers...
cd /d "%~dp0"
docker compose up -d --build

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo  SUCCESS! All EduFast services are running in Docker:
    echo.
    echo  - Frontend Web App:   http://localhost (or http://localhost:5173)
    echo  - Backend API:        http://localhost:5000/api
    echo  - SQLite Database GUI: http://localhost:8080
    echo ========================================================
    echo.
) else (
    echo.
    echo [ERROR] Docker Compose failed to start containers. Make sure Docker Desktop is running!
)
pause
