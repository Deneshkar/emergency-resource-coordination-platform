# Deneshkar. P - personal testing evidence

**Latest explanation status:** All four explanations are received and organized in Member 1-4 order in [Member_Explanations.md](Member_Explanations.md). The supplied Member 1-2 statements describe earlier D-series examples; corrected summaries distinguish these from the personal C-series runs. Original statements are retained. Members should review the corrections and prepare for the viva.

**8 October evidence update:** All four supplied personal changed-input terminal screenshots match saved reports: 2/2 scenarios passed per member. Deneshkar's written explanation is recorded. All four explanations have now been supplied; all members prepare for the viva. See [Personal_Changed_Input_Evidence.md](Personal_Changed_Input_Evidence.md).

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

## Additional run requested by the student

On 6 October 2026 at 22:39 Asia/Colombo, OpenAI Codex ran the complete Member 4 package on Deneshkar's behalf. All 9 backend and 10 safety-agent tests passed, with four separate agent demonstration scenarios passing. This is recorded as AI-assisted execution, not a new personal run. PDF Appendix E includes the observed results and agent input/output summary.

- [Test results](../members/member4-IT24103828/results/ai-assisted-20261006-223920-978734/results.html)
- [Actual agent inputs and outputs](../members/member4-IT24103828/results/ai-assisted-20261006-223920-978734/agent-demo.html)
- [Execution record](../members/member4-IT24103828/results/ai-assisted-20261006-223920-978734/execution.json)

## Understanding status

A separate [declared-personal run](../members/member4-IT24103828/results/personal-20261006-223824-403789/results.html) was found at 22:38 Asia/Colombo, before the Codex run. Its TRX/XML records verify 9 backend and 10 agent passes; its four demo scenarios also passed, and source hashes match. The execution record names Deneshkar. P. Confirmation of who actually operated this command is pending; this label alone does not establish understanding.

On 8 October Deneshkar supplied a written explanation of the adjacent boundary, the 30-minute overlap and the REVISE recommendation. It is preserved verbatim in [his submitted explanation](../members/member4-IT24103828/Understanding_Submitted_20261008.md). Codex separately executed the original and changed inputs; both expected results passed. [The comparison evidence](Changed_Input_Results.md) records the actual operator. Deneshkar has now supplied a personal comparison command/output screenshot, matched to the saved 10:51 run. Defect/retest interpretation and viva performance remain to be demonstrated. Members 1-3 submitted personal execution screenshots on 7 October and have now supplied changed-input execution evidence; their written explanations are now supplied with documented evidence corrections.
