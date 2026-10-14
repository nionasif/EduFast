@echo off
title EduFast Platform Launcher
cd /d "%~dp0"
echo ====================================================
echo           EduFast All-in-One Launcher
echo ====================================================
if exist ".venv\Scripts\python.exe" (
    ".venv\Scripts\python.exe" run.py
) else (
    python run.py
)
pause
