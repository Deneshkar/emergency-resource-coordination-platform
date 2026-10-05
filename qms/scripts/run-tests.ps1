param(
  [string]$PostgresConnection = 'Host=127.0.0.1;Port=55432;Database=ercp_qms_verified;Username=qms',
  [string]$MigrationAdminConnection = 'Host=127.0.0.1;Port=55432;Database=postgres;Username=qms',
  [string]$ApiUrl = 'http://127.0.0.1:5009',
  [string]$PostgresBin = 'C:/Program Files/PostgreSQL/17/bin',
  [string]$K6 = 'k6'
)
$ErrorActionPreference = 'Stop'
$qmsRoot = Split-Path $PSScriptRoot -Parent
$parent = Split-Path $qmsRoot -Parent
$repoRoot = if (Test-Path (Join-Path $parent 'backend')) { $parent } else { Join-Path $parent 'SEF/emergency-resource-coordination-platform' }
$results = Join-Path $qmsRoot ('evidence/rerun-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
foreach ($command in @('dotnet','python','npm.cmd','flutter',$K6)) { Get-Command $command -ErrorAction Stop | Out-Null }
$health = Invoke-RestMethod "$($ApiUrl.TrimEnd('/'))/api/health"
if ($health.environment -ne 'Qms' -or $health.database -ne 'PostgreSQL' -or $health.appliedMigrations -ne 8 -or $health.pendingMigrations -ne 0) {
  throw 'Start the migrated PostgreSQL QMS API with start-qms.ps1. A normal or in-memory API cannot supply QMS database evidence.'
}
New-Item -ItemType Directory -Force $results | Out-Null
$health | ConvertTo-Json | Set-Content -Encoding UTF8 (Join-Path $results 'health.json')
$env:QMS_POSTGRES = $PostgresConnection
$env:QMS_MIGRATION_ADMIN = $MigrationAdminConnection
$env:QMS_API = $ApiUrl.TrimEnd('/')
$env:ConnectionStrings__DefaultConnection = $PostgresConnection
$env:DATABASE_URL = ' '
$env:GEMINI_API_KEY = ''
$env:SMTP_USER = ' '
$env:SMTP_PASS = ' '
$env:QMS_PERF_OUTPUT = Join-Path $results 'performance.json'
$env:QMS_WORKFLOW_OUTPUT = Join-Path $results 'workflow.json'
$failures = @()
function Run-Check([string]$Name, [scriptblock]$Action) {
  Write-Host "Running $Name ..."
  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    & $Action 2>&1 | Tee-Object -FilePath (Join-Path $results "$Name.log") | Out-Host
    $script:lastCheckExit = $LASTEXITCODE
  } finally { $ErrorActionPreference = $previousPreference }
  if ($script:lastCheckExit -ne 0) { $script:failures += $Name }
}
Push-Location $repoRoot
try {
  # TestServer fixtures manage their own provider; only the separate live process runs in Qms.
  $env:DOTNET_ENVIRONMENT = 'Testing'
  $env:ASPNETCORE_ENVIRONMENT = 'Testing'
  Run-Check 'backend' { dotnet test backend-tests/ERCP.Api.Tests.csproj --logger 'trx;LogFileName=backend.trx' --collect:'XPlat Code Coverage' --results-directory (Join-Path $results 'backend') }
  Run-Check 'backend-counts' { python (Join-Path $PSScriptRoot 'summarize_results.py') $results --backend-only }
  Push-Location frontend-react
  try {
    $reactOutput = Join-Path $results 'react.json'
    Run-Check 'react' { npm.cmd test -- --reporter=default --reporter=json "--outputFile=$reactOutput" }
    Run-Check 'react-lint' { npm.cmd run lint }
    Run-Check 'react-build' { npm.cmd run build }
  } finally { Pop-Location }
  Push-Location mobile-flutter
  try {
    flutter test --machine | Out-File -Encoding utf8 (Join-Path $results 'flutter.jsonl')
    if ($LASTEXITCODE -ne 0) { $failures += 'flutter' }
    Run-Check 'flutter-analyze' { flutter analyze }
  } finally { Pop-Location }
  $agentOutput = Join-Path $results 'agents.xml'
  Run-Check 'agents' { python -m pytest (Join-Path $PSScriptRoot 'test_agents.py') -q "--junitxml=$agentOutput" }
  $liveOutput = Join-Path $results 'live-api.xml'
  Run-Check 'live-api' { python -m pytest (Join-Path $PSScriptRoot 'test_live_api.py') -q "--junitxml=$liveOutput" }
  Run-Check 'performance' { & $K6 run (Join-Path $PSScriptRoot 'performance.js') }
  $env:ConnectionStrings__DefaultConnection = $PostgresConnection
  $env:DATABASE_URL = ' '
  Run-Check 'migrations' { dotnet ef database update --project backend --connection $PostgresConnection --no-build }
  $migrationExit = $script:lastCheckExit
  $env:QMS_PSQL = Join-Path $PostgresBin 'psql.exe'
  Run-Check 'database-evidence' { python (Join-Path $PSScriptRoot 'verify_database.py') $results --cli-exit $migrationExit }
  $coverage = Get-ChildItem -LiteralPath (Join-Path $results 'backend') -Recurse -Filter coverage.cobertura.xml | Select-Object -First 1
  if ($coverage) { Copy-Item -LiteralPath $coverage.FullName -Destination (Join-Path $results 'backend/coverage.cobertura.xml') }
  Run-Check 'summary' { python (Join-Path $PSScriptRoot 'summarize_results.py') $results }
} finally { Pop-Location }
if ($failures.Count) { throw ('Failed checks: ' + ($failures -join ', ') + '. Evidence: ' + $results) }
Write-Host "All suites passed with no skips. Evidence: $results"
