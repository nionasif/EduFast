@echo off
echo ========================================================
echo       EduFast Mobile App - 1-Click APK Builder
echo ========================================================
echo.
set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo [1/3] Building Web Assets...
cd /d "%~dp0..\Forntend"
call npm run build

echo [2/3] Syncing with Android Shell...
call npx cap sync android

echo [3/3] Compiling Native Android APK...
cd /d "%~dp0..\Forntend\android"
call gradlew.bat assembleDebug

set APK_SRC=
if exist "%~dp0..\Forntend\android\app\build_app\outputs\apk\debug\app-debug.apk" set APK_SRC=%~dp0..\Forntend\android\app\build_app\outputs\apk\debug\app-debug.apk
if exist "%~dp0..\Forntend\android\app\build_apk\outputs\apk\debug\app-debug.apk" set APK_SRC=%~dp0..\Forntend\android\app\build_apk\outputs\apk\debug\app-debug.apk
if exist "%~dp0..\Forntend\android\app\build\outputs\apk\debug\app-debug.apk" set APK_SRC=%~dp0..\Forntend\android\app\build\outputs\apk\debug\app-debug.apk

if defined APK_SRC (
    copy /y "%APK_SRC%" "%~dp0EduFast.apk" >nul
    copy /y "%APK_SRC%" "%~dp0..\EduFast.apk" >nul
    echo.
    echo ========================================================
    echo  SUCCESS! New Android APK built and saved to:
    echo  %~dp0EduFast.apk
    echo ========================================================
) else (
    echo.
    echo [ERROR] APK build failed. Check the error log above.
)
pause
