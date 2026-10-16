# ERCP group testing submission

**Latest explanation status:** All four explanations are received and organized in Member 1-4 order in [Member_Explanations.md](Member_Explanations.md). The supplied Member 1-2 statements describe earlier D-series examples; corrected summaries distinguish these from the personal C-series runs. Original statements are retained. Members should review the corrections and prepare for the viva.

**8 October evidence update:** All four supplied personal changed-input terminal screenshots match saved reports: 2/2 scenarios passed per member. Deneshkar's written explanation is recorded. All four explanations have now been supplied; all members prepare for the viva. See [Personal_Changed_Input_Evidence.md](Personal_Changed_Input_Evidence.md).

**Latest Word document:** ERCP_QMSE_Group_Submission_Explanations.docx includes the consolidated Test Plan, recorded schedule, confirmed SE3110 module, personal evidence and all supplied screenshots. The earlier Word files are retained as previous versions; the Revised file was open and locked during this revision. Use the Explanations document for submission. The PDF is updated in place.

This package tests the existing SEF Emergency Resource Coordination Platform. Start the reproducible QMS API with scripts/start-qms.ps1 on port 5009, then run scripts/run-tests.ps1. Read Software_Testing_Report.pdf for the assessment. Test_Cases.html contains the completed test case document, and Defect_Report.html contains defects and retest evidence. The accompanying JSON inventory supports independent reconciliation with raw tool reports.

## Submission contents

- Changed_Input_Results.md: eight passing technical before/after scenarios from 8 October, exact commands, actual outputs and Deneshkar's verbatim submitted written explanation. Word G8 and PDF Appendix H contain the comparisons. All four personal comparison runs now have supplied screenshots and matching raw reports.
- Each member folder now includes run-memberN-changed-input.ps1 and Viva_Changed_Input_Guide.md for the personal run and screenshot.

- Test_Plan.md: eight testing areas, tools, assigned review responsibilities, environment, evidence dates and acceptance criteria.
- Changed_Input_Demonstrations.md: instructions for each member's outstanding personal exercise, including expected versus actual result recording. These are instructions, not completed evidence.

- ../members/index.html and Member_Demonstrations.md: four individually runnable business/agent presentation packages, editable inputs, actual output reports, test cases and dated results. AI-assisted verification is labelled separately from personal execution.

- Software_Testing_Report.pdf: scope, plan, environment, results, defects, AI declaration and individual contribution appendix with full hashes, exact messages, author/committer dates and testing summaries.
- Test_Cases.html and test-cases.json: individual executed test records, source references, reproduction commands, expected and actual results.
- Defect_Report.html: two corrected security defects, the corrected migration defect, and observed quality limitations.
- BUG03_Retest.md: the 5 October migration repair, before/after evidence and database applicability.
- Reproduction_Guide.md: setup and test commands.
- Contribution_and_Viva.md and Contribution_Record.md: verified historical testing commits, submitted personal execution evidence and pending understanding demonstrations.
- GitHub_Publication.md: published branch, source commit, PR and CI links.
- GitHub_Screenshot_Checklist.md: completed screenshot record; four actual GitHub screenshots appear in Appendix B. The unchanged PNGs and checksum manifest are in ../evidence/github.
- Individual_Evidence_IT24103828.md: Deneshkar's 12 passing personal test reruns, six unchanged terminal screenshots and three raw result reports. PDF Appendix C includes these; Appendix H retains his submitted written explanation. The new personal comparison run is now supported by a supplied screenshot and matching raw reports.
- test-summary.json: totals reconciled with raw execution results; skipped tests fail the publication gate.
- ../evidence: original tool outputs, baseline failures, final results, performance metrics and workflow details.
- ../scripts: agent tests, live HTTP tests, k6 load test and rerun script.
- ../../SEF/emergency-resource-coordination-platform: application and test source in the archive.

## Items the group must verify before uploading

The member names, student IDs and module allocation were supplied by the group and are recorded in the report. Add the group number if CourseWeb requires one. New AI-assisted changes are provided as source and a patch, not as fabricated member commits. Each member must review, understand and commit their own verified contribution to the linked repository. The existing commit history is included as historical evidence, not proof of authorship of these new changes.

The repository owner confirmed the module as SE3110 - Quality Management in Software Engineering. The supplied brief internally says SE3090 and refers to the underlying SEF system; that discrepancy is documented in the reports. Its deadline is 5 October 2026. Source was published on fix/qms-submission-readiness; the current documentation changes are packaged locally and are not claimed as a new GitHub push. PR #47 was closed without merging. No CourseWeb upload has been performed. The official CLEAR headings and each member's own explanation/changed-input exercise remain outstanding.

BUG-03 is fixed and retested: four migration regressions, the 95-test backend suite and the 17-test HTTP suite pass. The updated package supersedes the earlier ZIP. Demo credentials and permissive development configuration are not a production security posture. The report does not claim full security, live LLM evaluation, physical-device testing or browser E2E coverage. Existing databases created outside EF migration history require a separate adoption review; this repair changed only isolated test databases.

## Latest readiness repair

QMS startup now requires local PostgreSQL and applies EF migrations; it rejects schemas with no migration history and stops on errors. All clients and QMS scripts default to port 5009. Tests are rerun together and report counts are derived from raw results. The qms directory inside the application repository contains the same curated scripts, documentation and evidence for version control. The updated CI workflow requires the database regressions to execute. The integration is published on fix/qms-submission-readiness and all local suites were rerun on 6 October. Existing Git contributions are verified; the three other members supplied personal testing screenshots on 7 October, matched to raw reports in Personal_Execution_Evidence.md. Understanding exercises remain pending.

- Personal_Execution_Evidence.md: six member 1 to 3 screenshots supplied on 7 October, matched to 54 passing existing tests and six separate demos. Included in PDF Appendix G and Word section G7; personal explanations are now supplied with documented evidence corrections.
