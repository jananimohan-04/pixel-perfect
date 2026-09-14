@echo off
echo =========================================
echo CNC Vault - Local Launcher Setup
echo =========================================
echo.
echo This script registers a custom protocol (cncvault://)
echo so your browser can open CAD files directly in desktop apps.
echo.
echo No admin privileges required.
echo.

mkdir "%USERPROFILE%\.cncvault" 2>nul

echo Installing launcher components...
copy /y "%~dp0launcher.ps1" "%USERPROFILE%\.cncvault\launcher.ps1" >nul 2>&1
copy /y "%~dp0run.vbs" "%USERPROFILE%\.cncvault\run.vbs" >nul 2>&1

echo Registering cncvault:// protocol...
reg add HKCU\SOFTWARE\Classes\cncvault /t REG_SZ /d "URL:CNC Vault Protocol" /f >nul
reg add HKCU\SOFTWARE\Classes\cncvault /v "URL Protocol" /t REG_SZ /d "" /f >nul
reg add HKCU\SOFTWARE\Classes\cncvault\shell\open\command /t REG_EXPAND_SZ /d "wscript.exe \"%USERPROFILE%\.cncvault\run.vbs\" \"%1\"" /f >nul

echo.
echo =========================================
echo Setup complete! 
echo You can now use the "Open Locally" button in CNC Vault.
echo =========================================
pause
