# Deneshkar. P - personal testing evidence

Student ID: IT24103828. Responsibility: Volunteer/Responder Management and Validation/Safety Agent.

On 6 October 2026, Deneshkar personally ran the commands during guided practice and supplied six terminal screenshots. OpenAI Codex assisted with command selection, explanations and evidence organization. The original PNGs were visually matched to the supplied images and copied unchanged. The saved TRX/XML files independently confirm the results below. This records execution of existing tests, not new unassisted test authorship or a completed viva.

Evidence folder: [individual/IT24103828/20261006-151749](../evidence/individual/IT24103828/20261006-151749/).

| Executed tests | Result | Raw evidence |
|---|---|---|
| VolunteerShiftTests | 4 passed; 0 failed/skipped | [volunteer-shifts.trx](../evidence/individual/IT24103828/20261006-151749/volunteer-shifts.trx) |
| VolunteersApiIntegrationTests | 5 passed; 0 failed/skipped | [volunteer-http.trx](../evidence/individual/IT24103828/20261006-151749/volunteer-http.trx) |
| Safety-agent AI08, AI09 and AI10 | 3 passed; 0 failed/skipped; 17 intentionally deselected | [safety-agent XML](../evidence/individual/IT24103828/20261006-151749/safety-agent-20261006-152348.xml) |

All 12 are reruns of existing cases. The group totals remain 270 automated cases and 272 inventory records. The controller and HTTP tests use EF Core InMemory; these runs do not establish PostgreSQL constraints. The safety-agent tests execute deterministic rules without a live LLM.

## All supplied personal screenshots

1. [Controller command and four passing results](../evidence/individual/IT24103828/20261006-151749/01-volunteer-shifts-results.png)
2. [HTTP command and startup](../evidence/individual/IT24103828/20261006-151749/02-volunteer-http-command-and-start.png)
3. [HTTP in-memory database log](../evidence/individual/IT24103828/20261006-151749/03-volunteer-http-database-log.png)
4. [HTTP authentication setup log](../evidence/individual/IT24103828/20261006-151749/04-volunteer-http-authentication-log.png)
5. [HTTP five passing results](../evidence/individual/IT24103828/20261006-151749/05-volunteer-http-results.png)
6. [Safety-agent three passing results](../evidence/individual/IT24103828/20261006-151749/06-safety-agent-results.png)

The HTTP result screenshot reports overwriting the prior volunteer-http.trx. The retained file represents the latest saved run. The four HTTP screenshots are supporting views, not four additional suites. [personal-execution.json](../evidence/individual/IT24103828/20261006-151749/personal-execution.json) records filenames, screenshot/report hashes, test names and timestamps from the raw reports. Screenshot capture times are not independently asserted.

The earlier [Deneshkar GitHub screenshot](../evidence/github/Deneshkar-3c059a6.png) remains in the shared GitHub evidence folder and is linked to his historical volunteer test contribution in PDF Appendix B. Other members' GitHub screenshots remain attributed to those members.

## Understanding and remaining practice

The equal-start/end-time boundary exercise was suggested but has not been confirmed as completed. Own-word explanations, test modification, defect/retest interpretation and viva performance remain to be demonstrated. No personal reflection or answer has been fabricated. The other three members' new personal QMS runs remain unconfirmed.
