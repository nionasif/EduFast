@echo off
title EduFast Platform Launcher
cd /d "%~dp0"

echo ====================================================
echo           🚀 EduFast All-in-One Launcher
echo ====================================================

where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    node run.js
    goto :end
)

where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    python run.py
    goto :end
)

echo [ERROR] Neither Node.js nor Python was found on your system!
echo Please install Node.js from https://nodejs.org/ to run EduFast.
pause

:end
