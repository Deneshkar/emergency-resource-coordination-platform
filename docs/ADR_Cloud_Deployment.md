# Architecture Decision Record (ADR)
## ADR 04: Cloud Deployment Platform Strategy

- **Status**: Approved
- **Deciders**: Team / Student 4 (lead) — all students deploy their component on rotation
- **Date**: 2026-09-16

### Context & Problem Statement
ERCP has four deployables: ASP.NET Core 8 Web API (`backend/`, EF Core + PostgreSQL with
InMemory fallback in `Program.cs`), React SPA (`frontend-react/`, Vite build), Flutter mobile
(`mobile-flutter/`, store/sideload .apk/.ipa + `flutter build web` fallback), and Python
agentic scripts (`ai-agents/`, invoked as subprocesses by `IncidentPlannerService`).
The course requires a live demo with role-based JWT auth, seeded demo accounts
(`coordinator@ercp.org`, `admin@ercp.org`, `volunteer@ercp.org`, `citizen@ercp.org`), and an
auditable CI pipeline (`.github/workflows/ci.yml`).

### Decision Drivers
1. **.NET 8 first-class support** with env-var config (`Jwt:Issuer/Audience/SecretKey`,
   `ConnectionStrings:DefaultConnection`) and zero-downtime deploys from `main`.
2. **PostgreSQL managed service** (EF Core migrations in `backend/Migrations/` must run cleanly).
3. **Static hosting for Vite SPA** with SPA fallback routing (`react-router-dom`).
4. **Cost/simplicity for a student team**: free/low tier, GitHub Actions native, weekly rotation friendly.
5. **Python agent compatibility**: `python3` available at runtime OR agents vendored as a sidecar step.

### Considered Options
- **Option A: Azure (App Service + Static Web Apps + Flexible Server for PostgreSQL)**.
- **Option B: Render (Web Service + Static Site + Managed Postgres)**.
- **Option C: Self-hosted VPS (Docker Compose: api + postgres + nginx)**.

### Decision Outcome
Chosen Option: **Option A — Azure** (primary); **Option B — Render** documented as fallback.

#### Justification:
- App Service runs .NET 8 natively; `Program.cs` already reads all secrets from environment,
  so staging/production need only app settings (no code change). Swagger can be gated to
  Development while `/api/*` stays public for the React/Flutter clients.
- Azure Static Web Apps hosts `frontend-react/dist/` with built-in SPA fallback and free SSL;
  API base URL becomes a single build-time env (`VITE_API_URL` → replace hardcoded
  `http://localhost:5009/api` in `src/services/*.js` before production deploy).
- Flexible Server for PostgreSQL matches local Npgsql development; the `NpgsqlConnection`
  probe + InMemory fallback in `Program.cs` guarantees the app still boots even if the DB
  firewall rule is misconfigured during the demo.
- Flutter ships via `flutter build apk --release` (demo devices) and optionally
  `flutter build web` to the same Static Web App; `flutter_local_notifications` degrades
  gracefully on web (guard `NotificationService.init()`).
- Python agents: App Service (Linux) images include `python3`; `IncidentPlannerService`
  resolves `../ai-agents/coordinator_planner_agent.py` then `ai-agents/...`, and falls back to
  the rule-based planner if Python is absent — verified by the CI `py_compile` step.
- Render remains a valid one-click fallback (same env vars, `dotnet publish` + `npm run build`),
  but Azure was chosen because the .NET + EF Core + Application Insights story is stronger for
  the markers and matches typical enterprise .NET deployments.

### Deployment Map (weekly rotation)
| Component | Target | Owner rotation |
|---|---|---|
| `backend/` API | Azure App Service (.NET 8, Linux) | Wk1 S1, Wk2 S3 |
| PostgreSQL | Azure Flexible Server (migrate via `dotnet ef database update`) | S2 |
| `frontend-react/` | Azure Static Web Apps (`npm ci && npm run build`) | S1/S2 |
| `mobile-flutter/` | Release APK + optional Web deploy | S4 |
| `ai-agents/` | Bundled with API deployment (verified by CI) | S3/S4 |
| CI/CD | GitHub Actions `ci.yml` (backend + React + Flutter jobs) | S4 |

### Consequences
- Good: live demo URL per component; role logins work end-to-end; DB migrations explicit.
- Good: weekly rotation = every student demonstrates a deploy in the report.
- Action (P1): replace hardcoded `API_BASE_URL`/`ApiConfig.baseUrl` localhost strings with
  environment-driven config before the assessed deploy.
- Action (P1): store `Jwt:SecretKey` in App Service app settings / Key Vault reference —
  never commit production secrets; current `appsettings.json` fallback is dev-only.
- Mitigation: keep InMemory fallback + seed data so a DB outage degrades to a demoable state
  instead of a boot crash.
