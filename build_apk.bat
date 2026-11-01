@echo off
echo ========================================================
echo       EduFast - 1-Click Android APK Builder
echo ========================================================
echo.
set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo [1/3] Building frontend web assets...
cd /d "%~dp0Forntend"
call npm run build

echo [2/3] Syncing assets with Android project...
call npx cap sync android

echo [3/3] Compiling native Android APK...
cd /d "%~dp0Forntend\android"
call gradlew.bat assembleDebug

set APK_SRC=
if exist "%~dp0Forntend\android\app\build_app\outputs\apk\debug\app-debug.apk" set APK_SRC=%~dp0Forntend\android\app\build_app\outputs\apk\debug\app-debug.apk
if exist "%~dp0Forntend\android\app\build_apk\outputs\apk\debug\app-debug.apk" set APK_SRC=%~dp0Forntend\android\app\build_apk\outputs\apk\debug\app-debug.apk
if exist "%~dp0Forntend\android\app\build\outputs\apk\debug\app-debug.apk" set APK_SRC=%~dp0Forntend\android\app\build\outputs\apk\debug\app-debug.apk

if defined APK_SRC (
    copy /y "%APK_SRC%" "%~dp0EduFast.apk" >nul
    echo.
    echo ========================================================
    echo  SUCCESS! Android APK built successfully:
    echo  Location: %~dp0EduFast.apk
    echo ========================================================
) else (
    echo.
    echo [ERROR] APK build failed. Check error messages above.
)
pause
