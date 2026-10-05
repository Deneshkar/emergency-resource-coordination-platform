# BUG-03 migration repair

Verified on 5 October 2026 against an isolated PostgreSQL 17 instance.

## Changes

1. Keep shelter, resource and inventory table/index creation in `20260910131851_AddResourceAndShelterManagement` only. Its rollback no longer drops the earlier `Incidents` and `IncidentPlans` tables.
2. Remove duplicate table/index creation and corresponding table drops from `20260916110602_AddAffectedCountToIncidents`. Preserve its incident/plan columns and timeline table. Alter the existing shelter foreign keys from SetNull to NoAction, matching that migration's target model and the current snapshot. Its rollback restores SetNull and preserves resource/inventory/shelter rows.
3. Add `20261005091547_CompleteAuthenticationAndPlanningSchema`. The current model/snapshot already contained `Users`, `ValidationAudits` and six planner columns, but no earlier migration created them. The new migration supplies those objects with reversible operations and safe default values for existing plan rows.
4. The final snapshot already matches the current model, so no artificial model or snapshot changes were needed. EF reports no pending model changes.

## Database applicability

The repaired chain was tested from empty databases and from the original failed test database, whose history stopped at `20260910131851_AddResourceAndShelterManagement`. Its eight migrations now apply successfully.

An existing application database created through `EnsureCreated`, `CreateTables` or startup repair SQL is a different case: it may contain tables without matching EF migration history. Do not blindly apply the repaired chain, delete the database, or insert migration-history rows to make the error disappear. Inspect its schema/history and back it up before a separate adoption plan. This repair did not modify any shared or production database, and it does not automatically adopt such a database.

Historical migration IDs are retained. No operation was added to drop and recreate the three duplicated resource tables. The older ResourceId UUID-to-integer migration is unchanged; this repair does not claim to preserve legacy UUID resource links through that pre-existing conversion.

## Regression tests

Set `QMS_MIGRATION_ADMIN` to the administrative connection for a disposable localhost PostgreSQL instance. The tests require `Database=postgres`, create uniquely named `qms_migration_<guid>` databases, and clean up only their own databases. They never reset the database specified by QMS_POSTGRES.

```powershell
$env:QMS_MIGRATION_ADMIN='Host=127.0.0.1;Port=55432;Database=postgres;Username=qms'
dotnet test backend-tests/ERCP.Api.Tests.csproj --filter FullyQualifiedName~QmsMigrationTests
```

- MIG01: migrate from empty and compare columns, types, nullability, lengths, keys and indexes with a separate database generated from the current model. Assert no pending migrations/model changes. Backfill defaults are intentionally excluded from the schema comparison.
- MIG02: upgrade/rollback the incident migration, preserving sample shelter, resource and inventory rows and foreign-key behaviour; then upgrade to latest.
- MIG03: rollback the resource migration while preserving earlier incident tables and sample incident/plan rows; then upgrade to latest.
- MIG04: repeated update preserves a user; full rollback to zero followed by reapply succeeds on a disposable database.

Before repair: all four tests failed. After repair: all four passed. The full backend suite passed 95/95 and the live API workflow/security suite passed 17/17 on the migrated schema. Tool reports are under `QMS/evidence/migration-fix` in the assignment package.
