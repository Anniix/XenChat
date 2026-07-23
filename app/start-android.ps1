# start-android.ps1
# Starts the Android emulator, waits for it to boot, then launches Expo
# Usage: .\start-android.ps1

$emulatorPath = "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$avdName = "Medium_Phone_API_36.1"

Write-Host "🚀 Starting Android Emulator: $avdName" -ForegroundColor Cyan

# Start emulator in background
Start-Process -FilePath $emulatorPath -ArgumentList "-avd $avdName -no-snapshot-load" -WindowStyle Normal

Write-Host "⏳ Waiting for emulator to boot..." -ForegroundColor Yellow

# Wait until emulator shows as 'device' in adb
$maxWait = 120  # seconds
$elapsed = 0
do {
    Start-Sleep -Seconds 3
    $elapsed += 3
    $devices = & $adbPath devices 2>$null
    $ready = $devices | Where-Object { $_ -match "emulator-\d+\s+device$" }
    if ($ready) {
        Write-Host "✅ Emulator is online! ($elapsed seconds)" -ForegroundColor Green
        break
    }
    Write-Host "   Still booting... ($elapsed/$maxWait s)" -ForegroundColor Gray
} while ($elapsed -lt $maxWait)

if (-not $ready) {
    Write-Host "❌ Emulator did not boot in time. Try starting it manually from Android Studio." -ForegroundColor Red
    exit 1
}

# Extra wait for the Android UI to fully load
Write-Host "⏳ Waiting for Android UI to fully load (10s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "📱 Launching Expo on emulator..." -ForegroundColor Cyan
npx expo start --android --clear
