param([Parameter(Mandatory=$true)][string]$Operator, [ValidateSet('practice','personal','ai-assisted')][string]$ExecutionKind = 'personal')
$qmsRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
& python (Join-Path $qmsRoot 'scripts/run_changed_input.py') --member 2 --operator $Operator --execution-kind $ExecutionKind
if ($LASTEXITCODE -ne 0) { throw 'Changed-input check failed. Retain the output and inspect the dated report.' }
