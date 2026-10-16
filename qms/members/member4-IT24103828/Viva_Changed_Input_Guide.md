# Member 4 changed-input demonstration and viva guide

Deneshkar. P | IT24103828 | Volunteer/Responder Management + ValidationSafetyAgent

Two technical comparison scenarios passed on 8 October 2026 with OpenAI Codex as operator. This guide and that run do not establish your personal execution.

## Run your own comparison

Open PowerShell in `QMS/members/member4-IT24103828`. Read `changed-inputs.json`. Before running, write your own prediction in a copy of `Personal_Demonstration_Template.md`. The supplied prediction is study guidance, not your recorded answer.

```powershell
.\run-member4-changed-input.ps1 -ExecutionKind personal -Operator 'Deneshkar. P'
```

The command prints a new dated `results/changed-.../comparison.html` path. Open it to inspect original/changed inputs and expected/actual checks. Full JSON and the complete command/output transcript are linked there. Save your own `Understanding.md` and terminal screenshot in that new results folder. Keep the command visible; take additional screenshots if the output needs scrolling. Record failures and retests honestly.

## Exact change

Only proposed_shift.start changes: 10:00 to 09:30 UTC. Existing shift remains 09:00-10:00, end remains 11:00, volunteer remains available.

## Expected behaviour and verified technical interpretation

The original adjacent 10:00-11:00 shift should be valid and APPROVE. Changing only its start to 09:30 should produce is_valid=false, REVISE and V2_DOUBLE_BOOKING.

The overlap predicate uses half-open intervals: new_start < existing_end and existing_start < new_end. At 10:00 the first comparison is false; at 09:30 both are true. V2_DOUBLE_BOOKING is in the agent's revisable violation set, so this available volunteer receives REVISE. Availability alone is not sufficient for approval. APPROVE is only a recommendation; coordinator approval is a separate API operation.

## Explain it yourself

- Which input fields changed, and which stayed fixed?
- What did you predict before execution? Which actual JSON fields prove the result?
- Which source condition or assertion checks the business rule?
- What do these deterministic agent checks establish, and what still needs API/database or live-service testing?

The examiner assesses your explanation. This guide supplies learning material; it is not a signed or completed member reflection.

## Your existing 12 personal tests

Your 6 October screenshots and raw reports confirm four VolunteerShiftTests, five VolunteersApiIntegrationTests and three Python safety tests. These are separate from the new two-scenario comparison.

- Valid shift: CreatedAtActionResult; the returned shift has the expected volunteer and Scheduled status; exactly one shift is saved.
- End before start: start 16:00, end 08:00; BadRequestObjectResult and zero shifts saved. Explain both assertions: rejection alone would not prove nothing was persisted.
- Unknown volunteer: NotFoundResult and zero shifts saved. Invalid status is also rejected.
- Anonymous access to the protected volunteer endpoint: HTTP 401. Other HTTP cases cover seed records, trusted coordinator login, invalid-window HTTP 400 and a volunteer shift lifecycle.
- AI08 unavailable volunteer: invalid and REJECT. AI09 malformed payload: invalid and REJECT. AI10 adjacent shifts: overlap check passes.

Controller and HTTP fixtures use EF InMemory, so these cases do not prove real PostgreSQL constraints. Python checks exercise deterministic rules, not a live LLM. Your submitted 8 October explanation is in Understanding_Submitted_20261008.md; keep your own new run and screenshot separately.
