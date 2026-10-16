# Submission readiness repair - 5 October 2026

Database setup, port defaults, count reconciliation and repository packaging were corrected after the team's review.

| Concern | Implemented change | Verification |
|---|---|---|
| Database/migrations | Dedicated Qms environment requires local PostgreSQL, migrates before serving, rejects schemas without EF history and propagates startup failures. start-qms.ps1 initializes the disposable cluster/database. | Fresh ercp_qms_verified startup: eight applied, zero pending. Unavailable PostgreSQL and legacy-schema startup both exit unsuccessfully; the legacy fixture's existing row survives. Four migration regressions pass. |
| API port | Backend/client defaults and QMS HTTP, load and runner defaults all use 5009. The runner verifies QMS/PostgreSQL health before tests. | Live workflow/security suite: 17 passes on port 5009. |
| Test counts | summarize_results.py derives totals from TRX, Vitest JSON, Flutter events, JUnit, k6 thresholds and migration evidence. It rejects failures, skips, missing data and inconsistent counters. Report figures use these raw results. | 270 automated passes, zero failed/skipped; two additional checks pass; 272 inventory records. |
| Repository evidence | Curated QMS scripts, report sources, documents and evidence are mirrored under application/qms. Package creation rejects unequal mirrors. CI provisions PostgreSQL and requires its eight tests to pass. | Local suites verified. GitHub workflow is prepared, not claimed as remotely executed. Individual participation remains pending in Contribution_Record.md. |

The full execution directory is evidence/rerun-20261005-234458; curated outputs are in evidence/final. Original defect failures and repair retests remain in their historical directories. Earlier packages/final evidence are preserved locally in archive/pre-readiness-fix and excluded from the new ZIP.

The first collector invocation rejected Flutter's dependency notices before its JSON events. The collector was corrected to parse JSON events and require a successful terminal event; the same raw evidence then reconciled successfully. See readiness-fix/collector-before.log and final/summary.log. No application test failed during that run.

Flutter 3.44.9 resolved its SDK-pinned transitive test dependencies in pubspec.lock. CI now pins that same Flutter version. The application dependency declarations are unchanged. React lint reports 15 warnings and zero errors; Flutter analysis is clean. The existing MailKit NU1902 warning and React bundle-size warning remain documented.

At the end of the 5 October repair these changes were local. On 6 October they were integrated with newer main changes and published as AI-assisted work in PR #47; see GitHub_Publication.md. No new work was attributed to other teammates and no CourseWeb upload was performed.

A fresh extraction of the ZIP was also built without repository .env files, migrated into a separate temporary PostgreSQL database and tested on an overridden API port. All 17 live HTTP tests passed there. See evidence/readiness-fix/zip-reproduction.json. These repeat checks validate portability and are not added to the 270 unique automated case total.

The 6 October rerun supersedes these 5 October final metrics. It preserves 270 automated passes and zero skips, with React lint now at four warnings after upstream rule/configuration changes. The current main also supplies MailKit 4.18.1. Historical 5 October evidence remains separately identified.
