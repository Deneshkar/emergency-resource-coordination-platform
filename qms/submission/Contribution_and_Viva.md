# Group contribution and viva guide

Repository: https://github.com/Deneshkar/emergency-resource-coordination-platform

Original baseline commit: fc73d857f5fa7dd12279c7463e759a637d8dffda. The 5 October migration repair starts from fea099acd24db060505335cb5de23440de7c29a6. Supplied histories record intervening team commits, including the security changes. The repair was integrated with main 054fce7 and published as AI-assisted commit 9226a56 on fix/qms-submission-readiness (PR #47). Original member authorship is preserved.

| Member | Student ID | Established SEF ownership | Testing review and demonstration responsibility |
|---|---|---|---|
| Jathurshy.S | IT24103355 | Incident Management and Coordinator/Planner Agent | Incident validation, planner contract, incident-to-dispatch HTTP workflow; explain AI01/AI02 and API01 |
| M.Thanusikan | IT24103609 | Resource and Inventory Management and Situation Analysis Agent | Resource component behaviour, PostgreSQL constraints, urgency/capacity boundaries; explain WEB05-WEB08, DB01-DB04 and AI04-AI07 |
| Denesh N | IT24102826 | Dispatch and Task Assignment and Resource Allocation Agent | Dispatch authorization fix, allocation shortage and approval enforcement, k6 load interpretation; explain SEC02/SEC05, AI03/AI11 and E2E01 |
| Deneshkar. P | IT24103828 | Volunteer/Responder Management and Validation/Safety Agent | Volunteer/shift lifecycle, safety decisions and mobile evidence; explain AI08-AI10, volunteer integration cases and Flutter tests |

This table allocates review and viva responsibilities according to the supplied module ownership. It does not claim that each member personally ran the new AI-assisted tests. Each member should run their assigned cases, inspect the code, record their actual contribution and make their own genuine commits before submission.

## Demonstrations

1. Jathurshy.S: run the incident controller tests and AI02. Explain preconditions, meaningful invalid incident inputs and why a generated plan still needs human approval. Run test_E2E01 against the isolated API and show the saved workflow.json.
2. M.Thanusikan: run QmsPostgresTests with QMS_POSTGRES set and QmsMigrationTests with QMS_MIGRATION_ADMIN set. Explain why EF InMemory does not establish PostgreSQL unique/foreign-key behaviour. Show the resource component interactions. Demonstrate BUG-03's original failure, repaired migrations and data-preserving rollback; distinguish real migration execution from startup schema creation.
3. Denesh N: run QmsSecurityTests and live SEC05. Compare security-before.trx with the final backend TRX. Explain why hiding UI controls is insufficient authorization. Run k6 and explain virtual users, p95, errors and the limits of a local 40-second test.
4. Deneshkar. P: run volunteer/shift backend tests, the safety-agent cases and selected Flutter login/profile tests. Explain overlap boundaries, unavailable responders, malformed-payload rejection and the validation audit.

Each student should be able to change one fixture or boundary and predict the result, locate the assertion, explain one defect/retest and demonstrate the tool without depending on screenshots alone.

## AI assistance declaration

OpenAI Codex assisted with repository review, test design, regression scripts, security fixes, test execution, evidence reconciliation and report preparation on 3 October 2026, followed by migration repair on 5 October and current-main integration, GitHub publication and full retesting on 6 October. The application and test files were inspected and generated tests were run against the actual project. Results are taken from tool outputs. Live Gemini evaluation was not performed; the tested planner path is deterministic. All current client, agent, backend, live API and performance suites were rerun after the QMS setup changes; original 3 October evidence is retained as history.

The assignment requires declaration using the module's CLEAR framework but the provided PDF does not define its fields. Transfer this declaration into the lecturer's official CLEAR template when available; do not assume a different expansion of that acronym. Keep the assisted files, verification commands and limitations with the declaration. Each member remains responsible for reviewing, adapting and understanding their submitted work.

## Repository and evidence readiness

The application repository now includes qms/scripts, qms/submission and curated qms/evidence, mirrored byte-for-byte with the outer QMS export when packaging. CI provisions PostgreSQL and rejects skipped database tests. The source is now committed and pushed in PR #47. GitHub_Publication.md records the exact CI status and run link. Use Contribution_Record.md to record each member's real review, execution and commit/PR evidence.

## Verified individual history

Contribution_Record.md now links GitHub-verified testing commits for all four members. The group confirmed on 6 October that personal execution of the new QMS cases by Jathurshy.S, M.Thanusikan and Denesh N is not yet confirmed. Keep that follow-up distinct from the existing test-authorship evidence.
