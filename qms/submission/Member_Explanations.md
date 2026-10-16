# Member explanations in submission order

Received through the group representative on 8 October 2026. Original statements are retained separately from evidence-aligned editorial summaries. Personal C-series runs are supported by supplied screenshots and raw records; the assessed viva remains separate.

## Member 1 — Jathurshy.S / IT24103355

The submitted High-to-Medium description matches the older M1-D01/M1-D02 examples. The supplied 8 October screenshot and raw personal run use M1-C01/M1-C02 and keep High priority. The summary below corrects that distinction; it is an edited evidence summary, not a verbatim member statement.

**What input changed?**

Available resources changed from one to zero and volunteers from one to zero. Priority remained High, with the same incident ID, title, category and affected count.

**What was expected?**

The supplied explanation expects the plan to identify resource and volunteer shortages while retaining human approval. That expectation matches the executed comparison.

**What actually happened?**

Both scenarios passed. The changed plan reports no available resources and no available volunteers, identifies the missing vehicles and volunteers as constraints, and returns requiresHumanApproval=true.

**Which assertion or business rule explains the result?**

The checks assert incidentId=7, requiresHumanApproval=true, and reasoning containing both shortage messages. The planner exposes constraints and proposes a response; it does not independently execute the plan.

[Full summary and original statement](../members/member1-IT24103355/Written_Explanation.md)

## Member 2 — M.Thanusikan / IT24103609

The submitted routine-assistance description and 85-to-25 urgency change match the older M2-D01/M2-D02 examples. The supplied personal run uses M2-C01/M2-C02: both incidents are the same High-priority flood, both scores are 85, and two shelters remain. The summary below corrects the distinction; the member should review these corrections before the viva.

**What input changed?**

Medical stock increased from 20 to 50 and available vehicles from one to three. Food stayed at 100. Shelter 1 remained 10/10; shelter 2 changed from 30/100 to 100/100. The same High-priority flood incident remained in both inputs.

**What was expected?**

For this executed pair, the evidence-aligned expectation is that stock deficits clear and no shelter is selected, while urgency stays 85. The supplied expectation of lower urgency belongs to the older D-series pair, not this C-series run.

**What actually happened?**

Both scenarios passed. Urgency was 85 in both. The original output selected shelter 2 and showed a medical deficit. The changed output returned nearest_shelter=null and all three resource-deficiency flags false.

**Which assertion or business rule explains the result?**

The checks assert urgency_score=85, nearest_shelter=null, and false deficit flags after the change. Medical 50, food 100 and three vehicles meet the current baselines. Full shelters are excluded; eligible shelters are ranked by available capacity, not geographic distance.

[Full summary and original statement](../members/member2-IT24103609/Written_Explanation.md)

## Member 3 — Denesh N / IT24102826

The supplied explanation matches the personal run. Its submitted table labels D-series examples; the screenshot and dated comparison use M3-C01/M3-C02. The summary adds the observed High-priority requirement rule for clarity.

**What input changed?**

Priority changed from Medium to High, with available resources and volunteers each changing from one to zero. The input retained its explicit one-vehicle requirement.

**What was expected?**

The supplied expectation is an empty allocation, reported shortages and REVISE, while human approval remains required.

**What actually happened?**

Both scenarios passed. The original output allocated a response van, returned no gaps and APPROVE. The changed output allocated nothing, reported gaps of two Vehicles, two Medical resources and two Personnel, and returned REVISE. Human approval remained true.

**Which assertion or business rule explains the result?**

The checks assert empty/nonempty allocation and gap lists, requires_human_approval=true, and APPROVE/REVISE. In the current implementation, High priority replaces the explicit input requirement with the priority-based estimate. This comparison changes both priority and availability; it does not isolate their individual effects.

[Full summary and original statement](../members/member3-IT24102826/Written_Explanation.md)

## Member 4 — Deneshkar. P / IT24103828

The prior supplied explanation is preserved verbatim in Understanding_Submitted_20261008.md. The following four-part summary combines it with the verified M4-C01/M4-C02 personal run. It is not a new verbatim statement.

**What input changed?**

Only the proposed shift start changed, from 10:00 to 09:30 UTC. The existing shift stayed 09:00-10:00, the proposed end stayed 11:00 and the volunteer remained available.

**What was expected?**

The previously supplied explanation identifies adjacent shifts as non-overlapping and the 09:30 start as a 30-minute conflict requiring revision.

**What actually happened?**

Both personal scenarios passed. The adjacent case returned is_valid=true and APPROVE. The changed case returned is_valid=false, REVISE and V2_DOUBLE_BOOKING.

**Which assertion or business rule explains the result?**

The checks assert those returned fields. Half-open intervals overlap when new_start < existing_end and existing_start < new_end. Equality at 10:00 is allowed. V2_DOUBLE_BOOKING is revisable; an agent recommendation does not itself approve the dispatch.

[Full summary and original statement](../members/member4-IT24103828/Written_Explanation.md)

