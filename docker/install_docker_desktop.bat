@echo off
echo ========================================================
echo       Install Docker Desktop via Windows Package Manager
echo ========================================================
echo.
echo Installing Docker Desktop...
winget install --id Docker.DockerDesktop --accept-package-agreements --accept-source-agreements

echo.
echo ========================================================
echo Installation completed!
echo NOTE: Please restart your computer if prompted, and open
echo Docker Desktop from your Start menu before running containers.
echo ========================================================
pause
