# Member 2 changed-input demonstration and viva guide

M.Thanusikan | IT24103609 | Resource and Inventory Management + SituationAnalysisAgent

Two technical comparison scenarios passed on 8 October 2026 with OpenAI Codex as operator. This guide and that run do not establish your personal execution.

## Run your own comparison

Open PowerShell in `QMS/members/member2-IT24103609`. Read `changed-inputs.json`. Before running, write your own prediction in a copy of `Personal_Demonstration_Template.md`. The supplied prediction is study guidance, not your recorded answer.

```powershell
.\run-member2-changed-input.ps1 -ExecutionKind personal -Operator 'M.Thanusikan'
```

The command prints a new dated `results/changed-.../comparison.html` path. Open it to inspect original/changed inputs and expected/actual checks. Full JSON and the complete command/output transcript are linked there. Save your own `Understanding.md` and terminal screenshot in that new results folder. Keep the command visible; take additional screenshots if the output needs scrolling. Record failures and retests honestly.

## Exact change

Medical stock: 20 to 50; available vehicles: 1 to 3; shelter 2 occupancy: 30/100 to 100/100. Food stays 100; shelter 1 stays 10/10; incident and High priority unchanged.

## Expected behaviour and verified technical interpretation

Medical and vehicle deficits should clear; no shelter should be selected because both are full. Urgency remains 85 because the incident is unchanged.

Medical stock of 50, food stock of 100 and three available vehicles meet the current fixed baselines. With both shelters full, nearest_shelter is null. Despite its name, this field selects the active shelter with greatest available capacity, not geographic distance. Urgency stays 85 because the High-priority flood incident did not change.

## Explain it yourself

- Which input fields changed, and which stayed fixed?
- What did you predict before execution? Which actual JSON fields prove the result?
- Which source condition or assertion checks the business rule?
- What do these deterministic agent checks establish, and what still needs API/database or live-service testing?

The examiner assesses your explanation. This guide supplies learning material; it is not a signed or completed member reflection.
