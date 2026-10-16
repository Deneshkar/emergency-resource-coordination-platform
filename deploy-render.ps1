# Emergency Resource Coordination Platform - Render Deploy Script
param (
    [string]$ApiKey = $env:RENDER_API_KEY
)

if (-not $ApiKey) {
    $ApiKey = "rnd_NPJvvMiL61KlaCANQ6OZGxlHsT5J"
}

$env:RENDER_API_KEY = $ApiKey
$renderExe = "C:\Users\thanu\.render-bin\render.exe"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " ERCP Backend Deployment to Render" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

Write-Host "Verifying Render User & Workspace..." -ForegroundColor Yellow
& $renderExe whoami

Write-Host "`nAttempting Backend Service Creation..." -ForegroundColor Yellow
& $renderExe services create `
  --name "ercp-backend" `
  --type "web_service" `
  --repo "https://github.com/Deneshkar/emergency-resource-coordination-platform" `
  --branch "main" `
  --runtime "docker" `
  --root-directory "backend" `
  --plan "free" `
  --region "singapore" `
  --health-check-path "/api/health" `
  --env-var "DATABASE_URL=postgresql://postgres.elucnjilcahvibuvnzal:ErcpCoordPlatform2026!@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres" `
  --env-var "ASPNETCORE_ENVIRONMENT=Production" `
  --env-var "ALERT_EMAIL=xpalythanusikan@gmail.com" `
  --env-var "SMTP_HOST=smtp.gmail.com" `
  --env-var "SMTP_USER=xpalythanusikan@gmail.com" `
  --env-var "SMTP_PASS=nonh ncuk pipo mvpi" `
  --env-var "SMTP_PORT=465" `
  --env-var "SMTP_FROM=HEXORA <xpalythanusikan@gmail.com>"
