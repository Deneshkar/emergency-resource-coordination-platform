param(
  [string]$PostgresBin = 'C:/Program Files/PostgreSQL/17/bin',
  [ValidatePattern('^ercp_qms(?:_[a-z0-9_]+)?$')][string]$Database = 'ercp_qms_verified',
  [ValidateRange(1024,65535)][int]$DatabasePort = 55432,
  [ValidateRange(1024,65535)][int]$ApiPort = 5009
)
$ErrorActionPreference = 'Stop'
$qmsRoot = Split-Path $PSScriptRoot -Parent
$parent = Split-Path $qmsRoot -Parent
$repoRoot = if (Test-Path (Join-Path $parent 'backend')) { $parent } else { Join-Path $parent 'SEF/emergency-resource-coordination-platform' }
$cluster = Join-Path $qmsRoot '.postgres'
foreach ($tool in @('initdb','pg_ctl','psql','createdb')) {
  if (!(Test-Path (Join-Path $PostgresBin "$tool.exe"))) { throw "Install PostgreSQL or pass -PostgresBin. Missing $tool.exe" }
}
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $ApiPort)
try { $listener.Start() } catch { throw "API port $ApiPort is occupied. Stop that API or pass -ApiPort and the same -ApiUrl to run-tests.ps1." } finally { $listener.Stop() }
if (!(Test-Path (Join-Path $cluster 'PG_VERSION'))) {
  if ((Test-Path $cluster) -and (Get-ChildItem -LiteralPath $cluster -Force | Select-Object -First 1)) { throw 'Cluster directory is not empty. Choose an unused QMS directory.' }
  & "$PostgresBin/initdb.exe" -D $cluster -U qms --auth=trust --encoding=UTF8 --locale=C
  if ($LASTEXITCODE) { throw 'initdb failed.' }
}
& "$PostgresBin/pg_ctl.exe" -D $cluster status *> $null
if ($LASTEXITCODE -ne 0) {
  & "$PostgresBin/pg_ctl.exe" -D $cluster -l (Join-Path $cluster 'server.log') -o "-p $DatabasePort -h 127.0.0.1" -w start
  if ($LASTEXITCODE) { throw 'PostgreSQL did not start.' }
}
$found = & "$PostgresBin/psql.exe" -X -h 127.0.0.1 -p $DatabasePort -U qms -d postgres -At -v ON_ERROR_STOP=1 -c "SELECT 1 FROM pg_database WHERE datname='$Database'"
if ($LASTEXITCODE) { throw 'Cannot reach the isolated PostgreSQL cluster.' }
if ($found -ne '1') {
  & "$PostgresBin/createdb.exe" -h 127.0.0.1 -p $DatabasePort -U qms $Database
  if ($LASTEXITCODE) { throw 'Test database creation failed.' }
}
$env:DOTNET_ENVIRONMENT = 'Qms'
$env:ASPNETCORE_ENVIRONMENT = 'Qms'
$env:ConnectionStrings__DefaultConnection = "Host=127.0.0.1;Port=$DatabasePort;Database=$Database;Username=qms"
$env:DATABASE_URL = ' '
$env:ASPNETCORE_URLS = "http://127.0.0.1:$ApiPort"
$env:GEMINI_API_KEY = ''
$env:SMTP_USER = ' '
$env:SMTP_PASS = ' '
Write-Host "QMS API: $env:ASPNETCORE_URLS | PostgreSQL: $DatabasePort/$Database"
Write-Host 'Startup applies EF migrations and rejects legacy schemas without history. Ctrl+C stops the API.'
Push-Location (Join-Path $repoRoot 'backend')
try {
  dotnet run --no-launch-profile
  if ($LASTEXITCODE) { throw 'QMS startup failed. Read the preceding database/build error.' }
} finally { Pop-Location }
