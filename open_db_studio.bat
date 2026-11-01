@echo off
title EduFast SQLite Database Studio
echo ============================================================
echo   EduFast SQLite Database Studio (Interactive Web GUI)
echo   Database: backend\database\students.db
echo   Opening: http://localhost:8080
echo ============================================================
start "" "http://localhost:8080"
"C:\Python314\python.exe" -m sqlite_web.sqlite_web "%~dp0backend\database\students.db" --port 8080
pause
