param([string]$InputFile = '', [string]$Operator = 'Unrecorded', [ValidateSet('practice','personal','ai-assisted')][string]$ExecutionKind = 'practice')
$qmsRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$demoArgs = @((Join-Path $qmsRoot 'scripts/demo_member_agent.py'), '--member', '2', '--operator', $Operator, '--execution-kind', $ExecutionKind)
if ($InputFile) { $demoArgs += @('--samples', $InputFile) }
& python @demoArgs
if ($LASTEXITCODE -ne 0) { throw 'Agent demonstration failed. Read the actual output and check results.' }
