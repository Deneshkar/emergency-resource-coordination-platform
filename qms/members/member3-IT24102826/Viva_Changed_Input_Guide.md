# Member 3 changed-input demonstration and viva guide

Denesh N | IT24102826 | Dispatch and Task Assignment + ResourceAllocationAgent

Two technical comparison scenarios passed on 8 October 2026 with OpenAI Codex as operator. This guide and that run do not establish your personal execution.

## Run your own comparison

Open PowerShell in `QMS/members/member3-IT24102826`. Read `changed-inputs.json`. Before running, write your own prediction in a copy of `Personal_Demonstration_Template.md`. The supplied prediction is study guidance, not your recorded answer.

```powershell
.\run-member3-changed-input.ps1 -ExecutionKind personal -Operator 'Denesh N'
```

The command prints a new dated `results/changed-.../comparison.html` path. Open it to inspect original/changed inputs and expected/actual checks. Full JSON and the complete command/output transcript are linked there. Save your own `Understanding.md` and terminal screenshot in that new results folder. Keep the command visible; take additional screenshots if the output needs scrolling. Record failures and retests honestly.

## Exact change

Priority: Medium to High; resources: 1 to 0; volunteers: 1 to 0. The explicit one-vehicle requirement and incident ID stay unchanged.

## Expected behaviour and verified technical interpretation

The missing vehicle should produce a resource gap and REVISE; human approval remains required.

The Medium case allocates the available vehicle and has no gaps. The High case uses the current priority-based estimate, replacing the explicit one-vehicle input requirement with two vehicles, two medical resources and two personnel resources. With no resources, each category has a gap of two and the recommendation is REVISE. Human approval remains true. This comparison changes priority and availability together; it does not isolate the effect of each change.

## Explain it yourself

- Which input fields changed, and which stayed fixed?
- What did you predict before execution? Which actual JSON fields prove the result?
- Which source condition or assertion checks the business rule?
- What do these deterministic agent checks establish, and what still needs API/database or live-service testing?

The examiner assesses your explanation. This guide supplies learning material; it is not a signed or completed member reflection.
