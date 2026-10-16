# GitHub publication and verification

Updated 6 October 2026 (Asia/Colombo).

- Repository: https://github.com/Deneshkar/emergency-resource-coordination-platform
- Published branch: https://github.com/Deneshkar/emergency-resource-coordination-platform/tree/fix/qms-submission-readiness
- Implementation commit: https://github.com/Deneshkar/emergency-resource-coordination-platform/commit/9226a56328c91a5a2e47557997d15786c7a15b71
- Upstream base: https://github.com/Deneshkar/emergency-resource-coordination-platform/commit/054fce7cd9606e71adbae52e7e6483c3a28c1c09
- Pull request (closed without merging): https://github.com/Deneshkar/emergency-resource-coordination-platform/pull/47
- Evidence publication commit: https://github.com/Deneshkar/emergency-resource-coordination-platform/commit/61f3c0613fca1c23f81e01066330597fcd88fe72
- GitHub Actions run for 61f3c06: https://github.com/Deneshkar/emergency-resource-coordination-platform/actions/runs/37359381252
- Verified CI status: completed / success. All three jobs passed (backend/PostgreSQL, React and Flutter).

The branch preserves the newer team changes from main. The QMS migration completion, strict setup, PostgreSQL tests and submission scripts were committed using the repository owner's existing Git identity, with AI assistance disclosed in the commit message. Main has not been merged or deployed by this work.

The current local evidence is a complete 6 October rerun: 95 backend, 47 React, 91 Flutter, 20 agent and 17 live HTTP passes (270 total, zero failed/skipped), plus the k6 scenario and migration CLI check. GitHub separately verified 61f3c06 in the successful linked workflow. A later contribution-appendix documentation update does not represent a fresh test execution.

PR #47 was closed without merging at 2026-10-05T18:57:50Z (6 October 00:27:50 in Sri Lanka). The published branch remains available. This documentation update does not reopen the PR or merge it.

Contribution_Record.md links verified existing test commits by all four members. The 6 October personal-run gap was followed by six supplied screenshots on 7 October. Personal_Execution_Evidence.md links the matching reports for Jathurshy.S, M.Thanusikan and Denesh N. Understanding exercises remain pending. This local evidence update does not itself establish a new GitHub push. No CourseWeb upload was performed.

The individual demonstration update adds four named member packages, readable test cases and source snapshots, independent PowerShell runners, and actual agent input/output reports. AI-assisted verification passed 73 selected existing tests and 10 separate demonstration scenarios. These reruns do not increase the 270-test group total. The CI result above applies specifically to 61f3c06; it is not a claim that CI has already verified this later update.

Deneshkar's 12 earlier personally executed tests and six supplied terminal screenshots are preserved in the individual evidence and PDF Appendix C. His new 19-test package was verified by Codex, and still requires his own execution and explanation. The four supplied GitHub screenshots are preserved in Appendix B. See [Member_Demonstrations.md](Member_Demonstrations.md) for the package commands and evidence boundaries.
