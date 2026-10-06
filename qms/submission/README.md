# ERCP group testing submission

This package tests the existing SEF Emergency Resource Coordination Platform. Start the reproducible QMS API with scripts/start-qms.ps1 on port 5009, then run scripts/run-tests.ps1. Read Software_Testing_Report.pdf for the assessment. Test_Cases.html contains the completed test case document, and Defect_Report.html contains defects and retest evidence. The accompanying JSON inventory supports independent reconciliation with raw tool reports.

## Submission contents

- ../members/index.html and Member_Demonstrations.md: four individually runnable business/agent presentation packages, editable inputs, actual output reports, test cases and dated results. AI-assisted verification is labelled separately from personal execution.

- Software_Testing_Report.pdf: scope, plan, environment, results, defects, AI declaration and individual contribution appendix with full hashes, exact messages, author/committer dates and testing summaries.
- Test_Cases.html and test-cases.json: individual executed test records, source references, reproduction commands, expected and actual results.
- Defect_Report.html: two corrected security defects, the corrected migration defect, and observed quality limitations.
- BUG03_Retest.md: the 5 October migration repair, before/after evidence and database applicability.
- Reproduction_Guide.md: setup and test commands.
- Contribution_and_Viva.md and Contribution_Record.md: verified historical testing commits, pending new personal execution and practical demonstrations.
- GitHub_Publication.md: published branch, source commit, PR and CI links.
- GitHub_Screenshot_Checklist.md: completed screenshot record; four actual GitHub screenshots appear in Appendix B, pages 13-16. The unchanged PNGs and checksum manifest are in ../evidence/github.
- Individual_Evidence_IT24103828.md: Deneshkar's 12 passing personal test reruns, six unchanged terminal screenshots and three raw result reports. PDF Appendix C includes the execution summary and all six screenshots; understanding and boundary practice remain pending.
- test-summary.json: totals reconciled with raw execution results; skipped tests fail the publication gate.
- ../evidence: original tool outputs, baseline failures, final results, performance metrics and workflow details.
- ../scripts: agent tests, live HTTP tests, k6 load test and rerun script.
- ../../SEF/emergency-resource-coordination-platform: application and test source in the archive.

## Items the group must verify before uploading

The member names, student IDs and module allocation were supplied by the group and are recorded in the report. Add the group number if CourseWeb requires one. New AI-assisted changes are provided as source and a patch, not as fabricated member commits. Each member must review, understand and commit their own verified contribution to the linked repository. The existing commit history is included as historical evidence, not proof of authorship of these new changes.

The assignment filename says SE3110, but its internal heading says SE3090 Assignment 2. Confirm the CourseWeb submission location. The PDF deadline is 5 October 2026. Source is committed and pushed on fix/qms-submission-readiness. PR #47 was closed without merging; use the published branch link. No CourseWeb upload has been performed.

BUG-03 is fixed and retested: four migration regressions, the 95-test backend suite and the 17-test HTTP suite pass. The updated package supersedes the earlier ZIP. Demo credentials and permissive development configuration are not a production security posture. The report does not claim full security, live LLM evaluation, physical-device testing or browser E2E coverage. Existing databases created outside EF migration history require a separate adoption review; this repair changed only isolated test databases.

## Latest readiness repair

QMS startup now requires local PostgreSQL and applies EF migrations; it rejects schemas with no migration history and stops on errors. All clients and QMS scripts default to port 5009. Tests are rerun together and report counts are derived from raw results. The qms directory inside the application repository contains the same curated scripts, documentation and evidence for version control. The updated CI workflow requires the database regressions to execute. The integration is published on fix/qms-submission-readiness and all local suites were rerun on 6 October. Existing Git contributions are verified; the three other members' new QMS runs remain unconfirmed.
