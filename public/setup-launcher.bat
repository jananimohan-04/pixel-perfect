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
echo $b64 = ($url -split 'b64payload=')[1].TrimEnd('/') >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo $payload = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($b64)) >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo $filename = ($payload -split 'filename=')[1] >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo if (!$filename) { exit } >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo Add-Type -AssemblyName PresentationCore,PresentationFramework >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo $found = $false >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo $searchPaths = @("G:\My Drive", "G:\Shared with me") >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo foreach ($path in $searchPaths) { >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo     if (Test-Path $path) { >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo         $file = Get-ChildItem -Path $path -Filter $filename -Recurse -ErrorAction SilentlyContinue ^| Select-Object -First 1 >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo         if ($file) { >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo             Start-Process -FilePath $file.FullName >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo             $found = $true >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo             break >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo         } >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo     } >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo } >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo if (!$found) { >> "%USERPROFILE%\.cncvault\launcher.ps1"
echo     [System.Windows.MessageBox]::Show(("File not found on G:\ drive: " + $filename + "`n`nPlease make sure Google Drive Desktop is running, and if this is a shared folder, ensure you have clicked 'Add shortcut to My Drive' on Google Drive web."), "CNC Vault Launcher Error", 0, 16) >> "%USERPROFILE%\.cncvault\launcher.ps1"
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
