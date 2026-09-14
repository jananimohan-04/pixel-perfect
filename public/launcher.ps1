param([string]$Url)

$logDir = "$env:USERPROFILE\.cncvault"
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
$logFile = "$logDir\launcher.log"

function Log($msg) {
    "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg" | Out-File $logFile -Append
}

Log "=== Launcher triggered with URL: $Url ==="

try {
    if ([string]::IsNullOrWhiteSpace($Url)) {
        Log "No URL provided."
        exit
    }

    # Extract base64 payload from URL
    $b64 = $null
    if ($Url -match 'b64payload=([^&/ "]+)') {
        $b64 = $matches[1]
    } elseif ($Url -match 'b64path=([^&/ "]+)') {
        $b64 = $matches[1]
    }

    if ([string]::IsNullOrWhiteSpace($b64)) {
        Log "Could not extract b64payload or b64path from: $Url"
        exit
    }

    # Decode base64
    $decoded = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($b64))
    Log "Decoded payload: $decoded"

    $fileName = $null
    $expectedPath = $null
    $documentNumber = $null
    $versionNumber = $null
    $downloadUrl = $null
    $authToken = $null

    # Try parsing as JSON
    if ($decoded.StartsWith("{") -and $decoded.EndsWith("}")) {
        try {
            $json = $decoded | ConvertFrom-Json
            $fileName = $json.fileName
            $expectedPath = $json.fullPath
            $documentNumber = $json.documentNumber
            $versionNumber = $json.versionNumber
            $downloadUrl = $json.downloadUrl
            $authToken = $json.authToken
        } catch {}
    }

    if (!$fileName) {
        if ($decoded -match 'filename=(.+)$') {
            $fileName = $matches[1].Trim()
        } elseif ($decoded -match '\\([^\\]+)$') {
            $fileName = $matches[1].Trim()
            $expectedPath = $decoded.Trim()
        } else {
            $fileName = $decoded.Trim()
        }
    }

    Log "Target fileName: '$fileName', expectedPath: '$expectedPath'"

    Add-Type -AssemblyName System.Windows.Forms

    # 1. Check exact expected path first if given
    if (![string]::IsNullOrWhiteSpace($expectedPath) -and (Test-Path $expectedPath)) {
        Log "Found exact match at: $expectedPath"
        Start-Process -FilePath $expectedPath
        exit
    }

    # 2. Check fallback (Shared with me <-> My Drive)
    if (![string]::IsNullOrWhiteSpace($expectedPath)) {
        $fallback = $expectedPath -replace '\\My Drive\\', '\Shared with me\'
        if (Test-Path $fallback) {
            Log "Found fallback match at: $fallback"
            Start-Process -FilePath $fallback
            exit
        }
    }

    # 3. Search across all local Google Drive drives
    $foundFile = $null
    $drivesToSearch = @()

    foreach ($letter in [char[]](67..90)) { # C to Z
        $driveRoot = "$($letter):\"
        if (Test-Path $driveRoot) {
            $myDrive = "$driveRoot\My Drive"
            $sharedWithMe = "$driveRoot\Shared with me"
            if (Test-Path $myDrive) { $drivesToSearch += $myDrive }
            if (Test-Path $sharedWithMe) { $drivesToSearch += $sharedWithMe }
        }
    }

    if (Test-Path "G:\") {
        if (!($drivesToSearch -contains "G:\My Drive") -and (Test-Path "G:\My Drive")) {
            $drivesToSearch += "G:\My Drive"
        }
        $drivesToSearch += "G:\"
    }

    $drivesToSearch = $drivesToSearch | Select-Object -Unique

    Log "Searching drives: $($drivesToSearch -join ', ') for '$fileName'"

    foreach ($searchDir in $drivesToSearch) {
        if (Test-Path $searchDir) {
            Log "Scanning: $searchDir"
            $candidate = Get-ChildItem -Path $searchDir -Filter $fileName -Recurse -File -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($candidate) {
                $foundFile = $candidate.FullName
                Log "Found file via search: $foundFile"
                break
            }
        }
    }

    if ($foundFile) {
        Log "Launching local file: $foundFile"
        Start-Process -FilePath $foundFile
        exit
    }

    # 4. If not found locally on disk, AUTO-DOWNLOAD directly from cloud
    if (![string]::IsNullOrWhiteSpace($downloadUrl)) {
        Log "File not found locally on disk. Attempting auto-download from cloud: $downloadUrl"
        $docFolder = if (![string]::IsNullOrWhiteSpace($documentNumber)) { $documentNumber } else { "general" }
        $verFolder = if (![string]::IsNullOrWhiteSpace($versionNumber)) { "V$versionNumber" } else { "V1" }
        $cacheDir = "$env:USERPROFILE\.cncvault\cache\$docFolder\$verFolder"
        if (!(Test-Path $cacheDir)) { New-Item -ItemType Directory -Path $cacheDir -Force | Out-Null }
        $cachedFile = "$cacheDir\$fileName"

        try {
            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
            $headers = @{}
            if (![string]::IsNullOrWhiteSpace($authToken)) {
                $headers["Authorization"] = "Bearer $authToken"
            }
            Log "Downloading to cache: $cachedFile"
            Invoke-WebRequest -Uri $downloadUrl -Headers $headers -OutFile $cachedFile -UseBasicParsing
            if (Test-Path $cachedFile) {
                $fileSize = (Get-Item $cachedFile).Length
                Log "Download complete (Size: $fileSize bytes). Launching: $cachedFile"
                Start-Process -FilePath $cachedFile
                exit
            }
        } catch {
            Log "Auto-download failed: $_`n$($_.ScriptStackTrace)"
        }
    }

    # 5. If both local search and cloud auto-download fail, show helpful alert
    Log "File '$fileName' could not be opened."
    $msg = "File could not be opened locally:`n`n$fileName`n`nGoogle Drive Desktop has not synced this file, and the cloud download could not be completed.`n`nTip: You can use the 'Download' or 'Preview' button directly in CNC Vault."
    [System.Windows.Forms.MessageBox]::Show($msg, "CNC Vault - Notice", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information, [System.Windows.Forms.MessageBoxDefaultButton]::Button1, [System.Windows.Forms.MessageBoxOptions]::DefaultDesktopOnly)

} catch {
    Log "CRITICAL ERROR: $_`n$($_.ScriptStackTrace)"
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show("CNC Vault Launcher Error:`n`n$_", "CNC Vault Error", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error, [System.Windows.Forms.MessageBoxDefaultButton]::Button1, [System.Windows.Forms.MessageBoxOptions]::DefaultDesktopOnly)
}
