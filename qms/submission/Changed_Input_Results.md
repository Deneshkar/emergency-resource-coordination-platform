# Changed-input execution evidence

**Latest explanation status:** All four explanations are received and organized in Member 1-4 order in [Member_Explanations.md](Member_Explanations.md). The supplied Member 1-2 statements describe earlier D-series examples; corrected summaries distinguish these from the personal C-series runs. Original statements are retained. Members should review the corrections and prepare for the viva.

**8 October evidence update:** All four supplied personal changed-input terminal screenshots match saved reports: 2/2 scenarios passed per member. Deneshkar's written explanation is recorded. All four explanations have now been supplied; all members prepare for the viva. See [Personal_Changed_Input_Evidence.md](Personal_Changed_Input_Evidence.md).

Eight technical scenarios passed on 8 October 2026. Operator: OpenAI Codex. All four later supplied personal comparison screenshots, recorded in Personal_Changed_Input_Evidence.md. Deneshkar supplied a written explanation, retained verbatim below. The earlier technical runs below remain distinct from the later supplied personal screenshots. The actual full command, input and output are retained in execution.log.

## Member 1 — Jathurshy.S

resources: 1 to 0; volunteers: 1 to 0. The incident, High priority and affected count stay unchanged.

Expected: With resources and volunteers removed, reasoning should report both shortages while requiresHumanApproval remains true.

Observed: Removing resources and volunteers causes the planner to report both shortages. Human approval remains true in both outputs. The plan is a proposal, not an independently executed emergency response.

Result: 2/2 PASS. Operator: OpenAI Codex. Started: 2026-10-08T00:31:56.222748+05:30.

[Comparison report](../members/member1-IT24103355/results/changed-20261008-003156-222748/comparison.html) | [Full command and output](../members/member1-IT24103355/results/changed-20261008-003156-222748/execution.log) | [Raw JSON](../members/member1-IT24103355/results/changed-20261008-003156-222748/comparison.json)

## Member 2 — M.Thanusikan

Medical stock: 20 to 50; available vehicles: 1 to 3; shelter 2 occupancy: 30/100 to 100/100. Food stays 100; shelter 1 stays 10/10; incident and High priority unchanged.

Expected: Medical and vehicle deficits should clear; no shelter should be selected because both are full. Urgency remains 85 because the incident is unchanged.

Observed: Medical stock of 50, food stock of 100 and three available vehicles meet the current fixed baselines. With both shelters full, nearest_shelter is null. Despite its name, this field selects the active shelter with greatest available capacity, not geographic distance. Urgency stays 85 because the High-priority flood incident did not change.

Result: 2/2 PASS. Operator: OpenAI Codex. Started: 2026-10-08T00:31:56.384058+05:30.

[Comparison report](../members/member2-IT24103609/results/changed-20261008-003156-384058/comparison.html) | [Full command and output](../members/member2-IT24103609/results/changed-20261008-003156-384058/execution.log) | [Raw JSON](../members/member2-IT24103609/results/changed-20261008-003156-384058/comparison.json)

## Member 3 — Denesh N

Priority: Medium to High; resources: 1 to 0; volunteers: 1 to 0. The explicit one-vehicle requirement and incident ID stay unchanged.

Expected: The missing vehicle should produce a resource gap and REVISE; human approval remains required.

Observed: The Medium case allocates the available vehicle and has no gaps. The High case uses the current priority-based estimate, replacing the explicit one-vehicle input requirement with two vehicles, two medical resources and two personnel resources. With no resources, each category has a gap of two and the recommendation is REVISE. Human approval remains true. This comparison changes priority and availability together; it does not isolate the effect of each change.

Result: 2/2 PASS. Operator: OpenAI Codex. Started: 2026-10-08T00:31:56.602167+05:30.

[Comparison report](../members/member3-IT24102826/results/changed-20261008-003156-602167/comparison.html) | [Full command and output](../members/member3-IT24102826/results/changed-20261008-003156-602167/execution.log) | [Raw JSON](../members/member3-IT24102826/results/changed-20261008-003156-602167/comparison.json)

## Member 4 — Deneshkar. P

Only proposed_shift.start changes: 10:00 to 09:30 UTC. Existing shift remains 09:00-10:00, end remains 11:00, volunteer remains available.

Expected: The original adjacent 10:00-11:00 shift should be valid and APPROVE. Changing only its start to 09:30 should produce is_valid=false, REVISE and V2_DOUBLE_BOOKING.

Observed: The overlap predicate uses half-open intervals: new_start < existing_end and existing_start < new_end. At 10:00 the first comparison is false; at 09:30 both are true. V2_DOUBLE_BOOKING is in the agent's revisable violation set, so this available volunteer receives REVISE. Availability alone is not sufficient for approval. APPROVE is only a recommendation; coordinator approval is a separate API operation.

Result: 2/2 PASS. Operator: OpenAI Codex. Started: 2026-10-08T00:31:56.747636+05:30.

[Comparison report](../members/member4-IT24103828/results/changed-20261008-003156-747636/comparison.html) | [Full command and output](../members/member4-IT24103828/results/changed-20261008-003156-747636/execution.log) | [Raw JSON](../members/member4-IT24103828/results/changed-20261008-003156-747636/comparison.json)

## Deneshkar’s submitted explanation

The 10:00–11:00 shift passes because the existing shift finishes exactly at 10:00. The new shift starts at 10:00, so the two shifts only touch at the boundary; their working times do not overlap. Therefore, the agent returns APPROVE.
When I change the new shift's start time to 09:30, it overlaps the existing 09:00–10:00 shift for 30 minutes, from 09:30 to 10:00. The agent detects this as double booking. Because the problem can be fixed by changing the shift time, it returns REVISE instead of APPROVE.

Written explanation received; new personal execution supported by supplied screenshot and raw reports. The comparison does not increase the 270 group tests or 272 inventory records.
