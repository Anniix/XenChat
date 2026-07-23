# auto-start.ps1
# Automatically detects your current WiFi IP, updates .env, starts backend + Expo
# Usage: Right-click → Run with PowerShell  OR  .\auto-start.ps1

Write-Host "🔍 Detecting your WiFi IP address..." -ForegroundColor Cyan

# Get the active WiFi/Ethernet IP (not 192.168.56.x which is VirtualBox)
$ip = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "192.168.56.*" -and $_.PrefixOrigin -eq "Dhcp" } |
    Select-Object -First 1).IPAddress

if (-not $ip) {
    Write-Host "❌ Could not detect IP. Are you connected to WiFi?" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Your IP: $ip" -ForegroundColor Green

# Update .env file
$envPath = "$PSScriptRoot\.env"
$content = Get-Content $envPath -Raw
$content = $content -replace 'EXPO_PUBLIC_API_URL=http://[\d.]+:5000/api', "EXPO_PUBLIC_API_URL=http://$ip`:5000/api"
$content = $content -replace 'EXPO_PUBLIC_SOCKET_URL=http://[\d.]+:5000', "EXPO_PUBLIC_SOCKET_URL=http://$ip`:5000"
Set-Content $envPath $content
Write-Host "✅ .env updated with IP: $ip" -ForegroundColor Green

# Start backend in new terminal
Write-Host "🚀 Starting backend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\XenChat\backend'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start Expo
Write-Host "📱 Starting Expo (phone)..." -ForegroundColor Cyan
Write-Host "   Metro URL will be: exp://$ip`:8081" -ForegroundColor Gray
npx expo start --clear
