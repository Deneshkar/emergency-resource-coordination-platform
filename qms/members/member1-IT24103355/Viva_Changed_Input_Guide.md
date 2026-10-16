# Member 1 changed-input demonstration and viva guide

Jathurshy.S | IT24103355 | Incident Management + CoordinatorPlannerAgent

Two technical comparison scenarios passed on 8 October 2026 with OpenAI Codex as operator. This guide and that run do not establish your personal execution.

## Run your own comparison

Open PowerShell in `QMS/members/member1-IT24103355`. Read `changed-inputs.json`. Before running, write your own prediction in a copy of `Personal_Demonstration_Template.md`. The supplied prediction is study guidance, not your recorded answer.

```powershell
.\run-member1-changed-input.ps1 -ExecutionKind personal -Operator 'Jathurshy.S'
```

The command prints a new dated `results/changed-.../comparison.html` path. Open it to inspect original/changed inputs and expected/actual checks. Full JSON and the complete command/output transcript are linked there. Save your own `Understanding.md` and terminal screenshot in that new results folder. Keep the command visible; take additional screenshots if the output needs scrolling. Record failures and retests honestly.

## Exact change

resources: 1 to 0; volunteers: 1 to 0. The incident, High priority and affected count stay unchanged.

## Expected behaviour and verified technical interpretation

With resources and volunteers removed, reasoning should report both shortages while requiresHumanApproval remains true.

Removing resources and volunteers causes the planner to report both shortages. Human approval remains true in both outputs. The plan is a proposal, not an independently executed emergency response.

## Explain it yourself

- Which input fields changed, and which stayed fixed?
- What did you predict before execution? Which actual JSON fields prove the result?
- Which source condition or assertion checks the business rule?
- What do these deterministic agent checks establish, and what still needs API/database or live-service testing?

The examiner assesses your explanation. This guide supplies learning material; it is not a signed or completed member reflection.
