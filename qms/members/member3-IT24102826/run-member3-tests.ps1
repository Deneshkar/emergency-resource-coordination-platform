param(
  [ValidateSet('practice','personal','ai-assisted')][string]$ExecutionKind = 'practice',
  [string]$Operator = 'Unrecorded'
)
$qmsRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
& python (Join-Path $qmsRoot 'scripts/run_member_tests.py') --member 3 --execution-kind $ExecutionKind --operator $Operator
if ($LASTEXITCODE -ne 0) { throw 'Member 3 run failed. See the dated results folder.' }
