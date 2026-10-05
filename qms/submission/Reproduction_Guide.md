# Reproduction guide

The default API port is **5009** for the backend, React, Flutter and every QMS test. The QMS API uses PostgreSQL on **127.0.0.1:55432**, database **ercp_qms_verified**. Always start the QMS API for database evidence: ordinary development startup can use the legacy schema/in-memory path.

The ZIP contains QMS beside SEF. The same scripts, documents and curated evidence are mirrored under the application's qms directory for GitHub. Commands below start from the extracted assignment root. In a repository-only checkout, use qms instead of QMS and omit SEF/emergency-resource-coordination-platform from application paths.

## Install dependencies once

Use PowerShell on Windows with the .NET SDK, Node, Flutter 3.44.9, Python, PostgreSQL 17 and k6 installed. The latest local run uses .NET SDK 10.0.401 to build the net8.0 application. If a VS Code C# Dev Kit injected MSBuild task requires System.Runtime 10, use a compatible SDK/new terminal; this extension error is separate from EF migrations.

~~~powershell
dotnet restore SEF/emergency-resource-coordination-platform/backend-tests/ERCP.Api.Tests.csproj
Push-Location SEF/emergency-resource-coordination-platform/frontend-react
npm.cmd ci
Pop-Location
Push-Location SEF/emergency-resource-coordination-platform/mobile-flutter
flutter pub get
Pop-Location
python -m pip install -r QMS/scripts/requirements.txt
dotnet tool install --global dotnet-ef --version 8.0.29
~~~

If dotnet-ef is already installed, check dotnet ef --version instead. Put k6 on PATH or pass its executable path with -K6. The executed load test uses k6 1.3.0. The latest main includes MailKit 4.18.1; the 6 October rerun no longer reports the earlier MailKit NU1902 warning.

## Terminal 1: create the test database and run the API

~~~powershell
./QMS/scripts/start-qms.ps1
~~~

This initializes/reuses QMS/.postgres, a localhost-only disposable cluster with test-only trust authentication, creates ercp_qms_verified if absent, and launches the API on port 5009. Pass -PostgresBin if PostgreSQL binaries are installed elsewhere.

Qms mode does not load repository .env files, disables outgoing email and live Gemini credentials, requires local PostgreSQL, applies EF migrations, checks the model snapshot, and stops on migration/seeding failures. It does not silently fall back to an in-memory provider. A database containing application tables without migration history is rejected: choose another ercp_qms_* database with -Database and pass the matching connection to the test runner. See BUG03_Retest.md for existing database adoption limitations.

~~~powershell
Invoke-RestMethod http://127.0.0.1:5009/api/health
~~~

Expected: environment Qms, database PostgreSQL, appliedMigrations 8, pendingMigrations 0. An occupied port produces a clear setup error. Stop the other local API or use -ApiPort with matching client/test overrides.

## Terminal 2: run all suites

~~~powershell
./QMS/scripts/run-tests.ps1
~~~

The runner verifies the API's QMS/PostgreSQL status before running tests. It sets both QMS_POSTGRES and QMS_MIGRATION_ADMIN, executes backend, React, Flutter, agent, HTTP and k6 suites, runs static/build checks, verifies CLI migration idempotence and independently queries PostgreSQL for the approved dispatch.

Results go into a new evidence/rerun-TIMESTAMP directory. summarize_results.py checks every raw report and fails if required reports are absent, counts disagree, any test fails/skips, any of the eight database regressions does not pass, or a performance threshold fails. A successful dotnet test command with skipped database tests is insufficient.

All API clients use 5009 by default. For an explicit alternative such as 5100:
- Start with -ApiPort 5100.
- Run tests with -ApiUrl http://127.0.0.1:5100.
- Set React VITE_API_URL=http://localhost:5100 before starting Vite.
- Set Flutter --dart-define=API_BASE_URL=http://localhost:5100/api (Android emulator uses http://10.0.2.2:5100/api).

## Counts and publication

The 6 October full rerun used ercp_qms_github via the explicit -PostgresConnection override. The default teammate setup still uses ercp_qms_verified. The current report uses raw execution evidence: 95 backend + 47 React + 91 Flutter + 20 agent + 17 HTTP = 270 automated cases, plus one k6 scenario and one migration CLI check = 272 inventory records. The four migration regressions are already inside the backend 95. No final tests are skipped. The historical 80/87/91 backend counts and original failing tests remain historical evidence.

To reconcile another run:

~~~powershell
python QMS/scripts/summarize_results.py QMS/evidence/rerun-TIMESTAMP
~~~

Only after the run succeeds, preserve the previous final evidence in archive and promote that run's files to evidence/final. Generate the report with build_submission.py (requires reportlab), visually check the PDF, then run sync_repository.py followed by package_submission.py. The packager verifies mirrored QMS files and hashes every archive entry. Historical defects/retests must remain available.

## CI and contribution evidence

.github/workflows/ci.yml now provisions PostgreSQL, starts the migrated QMS API, requires all eight database regressions, executes agent and live HTTP tests, and uploads raw evidence. React and Flutter retain their CI jobs. The k6 workload and full local report are supplied separately. The workflow is published in PR #47. See GitHub_Publication.md for the verified run URL, commit and outcome.

Each member must record their actual review, tests and commits in Contribution_Record.md. Contribution_and_Viva.md allocates responsibilities and provides the AI declaration; it is not personal execution evidence.

## Stop after testing

Use Ctrl+C in terminal 1, then:

~~~powershell
& 'C:/Program Files/PostgreSQL/17/bin/pg_ctl.exe' -D 'QMS/.postgres' stop
~~~

The database can remain on disk for the viva. The ZIP excludes database files, installed dependencies, secrets and local tools.
