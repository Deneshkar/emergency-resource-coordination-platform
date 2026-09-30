# Emergency Resource Coordination Platform
# Start Backend & Cloudflare Live HTTPS Tunnel

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting ERCP Backend & Cloudflare Tunnel..." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

$env:DATABASE_URL = "postgresql://postgres.elucnjilcahvibuvnzal:ErcpCoordPlatform2026!@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
$env:ASPNETCORE_ENVIRONMENT = "Production"
$env:PORT = "5009"
$env:ALERT_EMAIL = "xpalythanusikan@gmail.com"
$env:SMTP_HOST = "smtp.gmail.com"
$env:SMTP_USER = "xpalythanusikan@gmail.com"
$env:SMTP_PASS = "nonh ncuk pipo mvpi"
$env:SMTP_PORT = "465"
$env:SMTP_FROM = "HEXORA <xpalythanusikan@gmail.com>"

# Start Backend in new window if not already running
$testConn = Test-NetConnection -ComputerName "localhost" -Port 5009 -WarningAction SilentlyContinue
if (!$testConn.TcpTestSucceeded) {
    Write-Host "Launching Backend API on port 5009..." -ForegroundColor Yellow
    Start-Process -FilePath "dotnet" -ArgumentList "run --project backend\ERCP.Api.csproj --no-build" -NoNewWindow
    Start-Sleep -Seconds 4
} else {
    Write-Host "Backend API is already running on port 5009!" -ForegroundColor Green
}

# Start Cloudflare Tunnel
Write-Host "Starting Cloudflare Tunnel..." -ForegroundColor Yellow
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --protocol http2 --url http://localhost:5009
