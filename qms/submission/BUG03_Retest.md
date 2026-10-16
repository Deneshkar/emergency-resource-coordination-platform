# BUG-03 fixed and retested

Revision date: 5 October 2026. The earlier ZIP is superseded by the regenerated ERCP_QMS_Group_Submission.zip. The original ZIP and report are retained locally under QMS/archive/pre-BUG03-fix.

The duplicate table/index operations were removed from the second migration, both rollback methods were corrected, and the existing shelter relationships were altered to match the current model. A separate completion migration supplies Users, ValidationAudits and six planner fields missing from the previous migration chain.

The regression suite failed 4/4 before repair and passed 4/4 afterward. It checks clean installation/schema parity, resource-data preservation during rollback, incident-data preservation during rollback, repeated update and a full down/up cycle. The original failed test database also upgraded successfully through eight migrations.

Evidence:

- ../evidence/migration-fix/before/migration-before.trx
- ../evidence/migration-fix/retest/migration-retest.trx
- ../evidence/migration-fix/before/migrations-20261003.log
- ../evidence/migration-fix/retest/migrations-upgrade-20261005.log: original repaired upgrade
- ../evidence/final/migrations.log: repeat CLI check on the fresh QMS database
- ../evidence/migration-fix/previous-history.txt and final-history.txt
- ../evidence/migration-fix/model-consistency.log
- ../evidence/migration-fix/summary.json
- ../evidence/final/backend/backend.trx: 95 passed, none failed/skipped
- ../evidence/final/live-api.xml: 17 passed on the migrated schema
- ../evidence/final/workflow.json: actual workflow and independent PostgreSQL verification

The aggregate final inventory now contains 270 automated cases, one passing load scenario and one passing migration CLI check. A later full readiness rerun on 5 October refreshed every suite and the performance scenario. See Readiness_Fixes.md and evidence/final/summary.json; all 270 automated cases passed with zero skips.

The earlier migration-only retest recorded line coverage 78.12% and branch coverage 31.93% (see migration-fix/summary.json). The current report derives its updated coverage from evidence/final/backend/coverage.cobertura.xml, including migration and generated model code. The increased line coverage primarily reflects execution of the migration chain and is not a claim of equivalent business-logic coverage. The 5 October build reports NU1902 for MailKit 4.7.1.1; that dependency was not modified by this migration repair.

No shared application database was modified. Databases already populated by EnsureCreated/CreateTables/startup SQL require a separate schema/history adoption review before applying EF migrations. See the source repository's docs/BUG03_Migration_Repair.md for exact scope and test commands.

Publication update (6 October): the branch preserves Denesh N's cd96717 duplicate-table fix from main and adds the tested missing-schema/rollback repairs. All suites were rerun on this integrated source; current final evidence is dated 6 October. See Contribution_Record.md and GitHub_Publication.md.
