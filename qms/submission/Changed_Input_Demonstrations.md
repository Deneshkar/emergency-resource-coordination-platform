# Personal changed-input demonstrations

**Latest explanation status:** All four explanations are received and organized in Member 1-4 order in [Member_Explanations.md](Member_Explanations.md). The supplied Member 1-2 statements describe earlier D-series examples; corrected summaries distinguish these from the personal C-series runs. Original statements are retained. Members should review the corrections and prepare for the viva.

**8 October evidence update:** All four supplied personal changed-input terminal screenshots match saved reports: 2/2 scenarios passed per member. Deneshkar's written explanation is recorded. All four explanations have now been supplied; all members prepare for the viva. See [Personal_Changed_Input_Evidence.md](Personal_Changed_Input_Evidence.md).

Status on 8 October: eight technical before/after scenarios passed with OpenAI Codex as operator. Deneshkar supplied a written boundary/overlap explanation. All four personal comparison runs are now supported by screenshots and raw reports. All four explanations are now supplied; see Member_Explanations.md for evidence corrections. [Actual technical results and commands](Changed_Input_Results.md) are retained separately.

## Prepared one-command comparisons

Each member folder now contains `changed-inputs.json`, `changed-input-plan.json`, `Viva_Changed_Input_Guide.md` and `run-memberN-changed-input.ps1`. These implement the latest requested comparisons, including stock/capacity changes for member 2 and High priority with no resources/volunteers for member 3. Read your inputs and write your own prediction first, then run **only your own command from your own member folder**:

```powershell
# Jathurshy.S — member1-IT24103355
.\run-member1-changed-input.ps1 -ExecutionKind personal -Operator 'Jathurshy.S'
# M.Thanusikan — member2-IT24103609
.\run-member2-changed-input.ps1 -ExecutionKind personal -Operator 'M.Thanusikan'
# Denesh N — member3-IT24102826
.\run-member3-changed-input.ps1 -ExecutionKind personal -Operator 'Denesh N'
# Deneshkar. P — member4-IT24103828
.\run-member4-changed-input.ps1 -ExecutionKind personal -Operator 'Deneshkar. P'
```

The command prints the new `results/changed-.../comparison.html` path. Save your own explanation and terminal screenshot in that folder. Keep the command visible. The prepared expected prediction is guidance and is labelled as such; add your own prediction before running. The editable exercises below are alternatives for practising a further change.

Each member must run their own exercise and write their own explanation. Keep the original tests, inputs, screenshots and dated results unchanged.

| Member and folder under `QMS/members` | Original scenario | Change to a copy | Expected behaviour to investigate |
|---|---|---|---|
| Jathurshy.S — `member1-IT24103355` | M1-D01 | Remove `input.resources` entries | The plan reflects unavailable resources; human approval remains required. Explain the source condition and changed output. |
| M.Thanusikan — `member2-IT24103609` | M2-D01 | Set the available shelter's `currentOccupancy` equal to `totalCapacity` | That full shelter is excluded. Explain the shelter output and capacity condition. |
| Denesh N — `member3-IT24102826` | M3-D01 | Empty `input.available_resources`, retaining explicit `required_resources` | The allocation reports shortages instead of allocating missing resources. Explain gaps and recommendation. |
| Deneshkar. P — `member4-IT24103828` | M4-D04 | Change proposed shift start from `2026-10-06T10:00:00Z` to `2026-10-06T09:30:00Z` | Existing shift is 09:00–10:00 UTC. Original adjacent interval expects APPROVE; the changed overlapping interval expects `is_valid=false`, REVISE and `V2_DOUBLE_BOOKING`. |

## Steps for each member

1. Open PowerShell in your own folder in the table. Copy `agent-inputs.json` to `practice-inputs.json`; do not edit the original.
2. Copy `Personal_Demonstration_Template.md` to a new working file named `Understanding.md`. Write the original scenario ID, exact input change and your prediction **before** executing the modified scenario.
3. In `practice-inputs.json`, keep the outer JSON array and retain the selected scenario. Give the copied scenario a distinct ID, such as `M4-P01`. Make the input change above. Review the agent source and update the `checks` for your prediction; do not merely remove failing assertions.
4. Run the appropriate command below. Only the person actually operating the terminal should enter their name. The script prints the new `results/demo-<timestamp>` folder and writes `agent-inputs.json`, `agent-output.json` and `agent-demo.html` there.
5. Open that dated `agent-demo.html`. Capture a screenshot showing the member/operator, modified input, actual output and check results. Keep failures and any later retest separately.
6. Complete `Understanding.md` with the actual output, result and explanation, then copy it and the screenshot into that dated results folder. Include the original scenario's existing result path so the examiner can compare before and after.

Run only your own command, from your own member folder:

```powershell
# Member 1 — Jathurshy.S
.\demo-member1-agent.ps1 -InputFile '.\practice-inputs.json' -ExecutionKind personal -Operator 'Jathurshy.S'

# Member 2 — M.Thanusikan
.\demo-member2-agent.ps1 -InputFile '.\practice-inputs.json' -ExecutionKind personal -Operator 'M.Thanusikan'

# Member 3 — Denesh N
.\demo-member3-agent.ps1 -InputFile '.\practice-inputs.json' -ExecutionKind personal -Operator 'Denesh N'

# Member 4 — Deneshkar. P
.\demo-member4-agent.ps1 -InputFile '.\practice-inputs.json' -ExecutionKind personal -Operator 'Deneshkar. P'
```

For Deneshkar's changed overlap scenario, the expected `checks` are:

```json
[
  {"path": "is_valid", "op": "equals", "value": false},
  {"path": "recommendation", "op": "equals", "value": "REVISE"},
  {"path": "violations.0.code", "op": "equals", "value": "V2_DOUBLE_BOOKING"}
]
```

These are expected values from the existing overlap fixture, not a newly observed personal result. Explain why an exact 10:00 boundary is allowed and 09:30 is rejected. An agent recommendation does not itself save or approve a dispatch.

## Record to complete after execution

| Field | Member's record |
|---|---|
| Name, student ID and actual operator | Not yet supplied |
| Date/time/timezone and source version | Not yet supplied |
| Original input and result path | Not yet supplied |
| Changed input and prediction recorded before execution | Not yet supplied |
| Expected result and source assertion | Not yet supplied |
| Actual output and saved report path | Not yet supplied |
| PASS/FAIL and explanation of any difference | Not yet supplied |
| Screenshot and own-word Understanding.md | Not yet supplied |

These exercises are member demonstrations of existing behaviour. They do not increase the 270 unique automated group tests or the 272-record inventory.
