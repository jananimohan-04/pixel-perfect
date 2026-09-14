@echo off
echo =========================================
echo CNC Vault - Local Launcher Setup
echo =========================================
echo.
echo This script will register a custom secure link (cncvault://) 
echo so your browser can open CAD files directly in your desktop apps.
echo.
echo No admin privileges required.
echo.

mkdir "%USERPROFILE%\.cncvault" 2>nul

echo Creating launcher script...
echo $url = $args[0] > "%USERPROFILE%\.cncvault\launcher.ps1"
echo if (!$url) { exit } >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo $b64 = ($url -split 'b64path=')[1].TrimEnd('/') >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo $path = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($b64)) >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo $fallbackPath = $path -replace "\\My Drive\\", "\Shared with me\" >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo if (Test-Path $path) { >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo     Start-Process -FilePath $path >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo } elseif (Test-Path $fallbackPath) { >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo     Start-Process -FilePath $fallbackPath >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo } else { >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo     Add-Type -AssemblyName PresentationCore,PresentationFramework >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo     [System.Windows.MessageBox]::Show(("File not found at: " + $path + " nor at " + $fallbackPath + "`n`nPlease make sure Google Drive Desktop is running and synced, or check your Local Drive Path settings in CNC Vault."), "CNC Vault Launcher Error", 0, 16) >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo } >> "%USERPROFILE%\.cncvault\launcher.ps1"

echo Registering cncvault:// protocol for current user...
reg add HKCU\SOFTWARE\Classes\cncvault /t REG_SZ /d "URL:CNC Vault Protocol" /f >nul
reg add HKCU\SOFTWARE\Classes\cncvault /v "URL Protocol" /t REG_SZ /d "" /f >nul
reg add HKCU\SOFTWARE\Classes\cncvault\shell\open\command /t REG_EXPAND_SZ /d "powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File \"%%USERPROFILE%%\.cncvault\launcher.ps1\" \"%%1\"" /f >nul

echo.
echo =========================================
echo Setup complete! 
echo You can now use the "Open Locally" button in CNC Vault.
echo =========================================
pause
