# Individual Report Section — Student 4
## Volunteer/Responder Management + Validation/Safety Agent

### 1. Responsibilities owned
- **Backend**: `VolunteersController` — CRUD, paged search (`search`, `isAvailable`, `page/pageSize`),
  self-only availability toggle for the Volunteer role (403 otherwise), `GET {id}/shifts`,
  `POST {id}/shifts` (Coordinator/Admin-only shift assignment with window + status validation),
  `GET available?skill=`, cascade shift cleanup on delete.
- **AI**: **Validation/Safety Agent** — the deterministic pre-approval gate in the pipeline
  Coordinator → Situation Analysis → Resource Allocation (propose) → **Validation** → Human approve.
- **Frontend**: React `VolunteerList` / `VolunteerDetail` / `AddVolunteer` (+ `validationService.js`
  client for the new endpoint); Flutter `RegisterScreen` / `ProfileScreen` (duty toggle) /
  `ShiftsScreen` backed by `AuthProvider` (Provider + ChangeNotifier).
- **Shared**: GitHub Actions CI (3-job pipeline), ADR 03 (Flutter state) + ADR 04 (cloud deploy).

### 2. Design decisions
- **Deterministic, not LLM, for safety**: the gate is pure business rules (V1 unavailable, V2
  double-booking via shift-overlap query, S1/S2 shelter status + over-allocation, R1/R2 + I1
  stock checks; W1–W4 advisory warnings). Same verdict for the same input — auditable, demo-safe.
  Implemented twice with one contract: `ai-agents/validation_safety_agent.py` (tool allow-list +
  `--json` CLI, mirroring Students 1–2 agent style) and `DispatchValidationService.cs` querying
  live `AppDbContext` state, exposed as `POST /api/validations/dispatch/{id}` plus
  `GET /api/validations/tools` for orchestration conformance. Both endpoints carry
  `[Authorize(Roles = "Coordinator,Admin")]` so only an authorized coordinator can run the
  pre-approval gate (spec: authorized human approval).
- **Verdict semantics**: `APPROVE` (clean), `REVISE` (only fixable blockers: S2/I1/R2/V2),
  `REJECT` (anything else). Known cross-component issue handled explicitly: `DispatchTask.ResourceId`
  (`Guid?`) vs `Resource.Id` (`int`) cannot be joined, so the C# gate raises `W4_RESOURCE_LINK_UNVERIFIED`
  for manual coordinator review instead of failing closed (flagged to Student 3 as schema debt).
- **Flutter state**: Provider + ChangeNotifier for shared auth session (`AuthProvider`: login/
  register/init/logout, `shared_preferences` persistence, role gating in `AuthGate`/`HomeScreen`);
  plain `setState` kept for local form/switch state (see ADR 03).
- **CI ownership**: `ci.yml` now gates backend (`dotnet build/test` + `py_compile` on all 3 agents),
  React (`npm ci`, `lint`, `vitest run`, `build`) and Flutter (`pub get`, `analyze`, `test`).
  Made lint green without risky cross-team refactors: removed behaviour-preserving issues
  (unused vars/imports, `StatusBadge` duplicate keys with identical values, `loadIncident`
  declaration order, one targeted refresh-rule disable) and downgraded the noisy new-v7
  `set-state-in-effect` rule to `warn` with a documented incremental-fix plan.

### 3. Testing summary (all executed locally)
- Backend **54/54** (`dotnet test`): 7 `VolunteersControllerTests`
  (role-based 403/own-update/coordinator-override) + **9** `DispatchValidationServiceTests`
  (approve, V1 reject, V2 revise, S2 revise, I1, unknown-dispatch 404, **audit-persist + history**,
  **timeline-event on real incident**, **empty-dispatch W0 → REVISE**) + **4** `VolunteerShiftTests`
  (create, unknown-volunteer 404, invalid window 400, invalid status 400) + **5**
  `VolunteersApiIntegrationTests` (anonymous 401 enforcement, register→login→profile token flow,
  full volunteer→shift→availability lifecycle over HTTP, invalid-window 400, startup seed-data check).
- Python agent: happy-path → APPROVE; crafted multi-violation payload → REJECT (V1+V3+S1);
  invalid payload → safe REJECT (`E0_INVALID_PAYLOAD`); every result carries `duration_ms + errors[]`.
- React **26/26** (Vitest): `validationService` contract (**7**, incl. history + `canApprove`/`approvalBlockReason` gate rule),
  `AddVolunteer` submit/error (3),
  `VolunteerList` table/empty/error/role-gating (4), **`ValidationPanel` empty/APPROVE/REJECT/loading-error/no-tasks-hint (6)**,
  **`VolunteerDetail` empty/table/assign-submit/invalid-window/server-error/role-gating (6)**.
- Empty-dispatch hardening (spec §5.2 validation-before-action): taskless dispatches now return
  **REVISE + `W0_EMPTY_DISPATCH`** (both C# and Python gates), and the UI approves only results with
  ≥1 evaluated check — so an empty dispatch can no longer be moved to Approved.
- Shift creation gap closed: `POST {id}/shifts` now has a UI — coordinator-only **Assign Shift** modal on
  `VolunteerDetail` (datetime range + status dropdown, client-side window guard, server errors shown inline,
  list refreshes on success) backed by a new `createShift` service client.
- Post-fix polish: `ValidationsController` prefers the JWT email claim for `ValidatedBy`
  (was persisting numeric `NameIdentifier`, shown as `by 2`); panel shows an info hint on zero-check
  results; demo audit history reset (`TRUNCATE ... RESTART IDENTITY`) after verification runs.
- Flutter **12/12** + `flutter analyze` clean: smoke, 4 model, 4 register (one caught and fixed a
  real 48px dropdown overflow → `isExpanded: true`), 3 profile duty-toggle tests.

### 4. End-to-end demo contribution (Section 6.1)
My slice covers the responder half of the workflow: coordinator creates a dispatch in React
`DispatchList` → clicks **🛡️ Run Safety Check** (`POST /api/validations/dispatch/{id}`) →
`ValidationPanel` shows APPROVE/REVISE/REJECT with blockers, warnings, per-tool checks,
`durationMs`, `auditId` and validated-by → **Move to Approved stays disabled until APPROVE/REVISE**
(REJECT blocks Approve; Reject always allowed) → every run is persisted to `ValidationAudits`
(survives refresh via `GET .../history`) and appended to the incident timeline as
`ValidationPerformed` → assigned volunteer toggles duty status in Flutter `ProfileScreen`
and views missions in `ShiftsScreen`. Tool contract at `GET /api/validations/tools` lets
Student 3's orchestrator call the gate uniformly with the other agents.

### 5. Risks & follow-ups
- Student 3 schema debt (`DispatchTask.ResourceId` type) — W4 workaround in place; proper fix is
  unifying to `int?` + FK, then the C# gate can enforce R1/R2 on linked resources.
- `SituationAnalysisService` was unregistered in `Program.cs` — registered it alongside the new
  service (one-line fix, verified by build).
- React localhost API URLs (`API_HOST`, `API_BASE_URL`) must move to env config before the
  assessed Azure deploy (noted in ADR 04).

### 6. Commit / PR evidence
- Branch `feature/volunteer-react-ui` (PRs #19, #21 for the volunteer React UI; follow-up PR
  for the validation agent, ADRs, CI expansion and test suites).
- `feat: add dispatch validation safety agent, ADRs, and comprehensive test suite for Student 4`
  — Python agent, C# service + controller + DTOs, DI registration, backend/Flutter/React tests,
  3-job CI, ADR 03 + ADR 04, AI log + this report section.
- Follow-up commits: shift-creation endpoint + tests, validation auth gate, HTTP integration tests.

### 7. Challenges & learning
- **Determinism vs intelligence**: the hardest design call was keeping the safety gate purely
  rule-based while the other three agents are generative. I learned that safety components earn
  trust by being boring — same input, same verdict, every time — and that this is precisely what
  makes them demoable and testable with golden cases.
- **InMemory test-store isolation**: HTTP integration tests initially failed in a confusing way
  (register-then-login returned 401; seeded data invisible) although every unit test passed. Root
  cause was each test host getting its own isolated InMemory store; fixed with one shared
  `InMemoryDatabaseRoot` per factory. Lesson: when unit tests pass but integration tests fail,
  suspect the test harness environment before the application code.
- **Cross-component schema debt**: `DispatchTask.ResourceId` (`Guid?`) vs `Resource.Id` (`int`)
  cannot be joined. Rather than failing closed on every dispatch with a linked resource, I made
  the gap explicit as warning `W4_RESOURCE_LINK_UNVERIFIED` and flagged the proper fix to its owner.
- **Lint as a team contract**: making `npm run lint` CI-blocking meant fixing pre-existing issues
  across teammates' files with strictly behaviour-preserving edits, and documenting the one rule
  downgrade instead of hiding it.

### 8. AI reflection (~1 page)
I used an agentic coding assistant (OpenCode + Muse Spark) extensively, as Level 4 permits, and
kept the log in `AI_Usage_Log_Student4.md`. What it did well: scaffolding repetitive-but-large
artefacts fast (the 300-line Python agent, the C# service/DTO/controller trio, test skeletons in
three frameworks, the 3-job CI file, ADR drafts in the team's format). Its output was consistently
idiomatic — it mirrored `situation_analysis_agent.py` conventions without being asked, and its
React tests followed the existing mocking style of the repo.

What it got wrong or left to me: (1) It initially proposed putting resource-link failures as hard
blockers; I overruled that after reading Student 3's models and invented the W4 advisory warning
instead — the AI didn't know about the cross-component type mismatch until I pointed it out.
(2) Its first Flutter widget tests failed on a real 48px layout overflow and an off-screen button;
debugging those taught me more about Flutter testing (`ensureVisible`, spinner-induced
`pumpAndSettle` hangs) than any passing test did. (3) It could not judge scope — it happily offered
to restructure eight teammates' pages for a lint rule; saying no to that was my decision, and the
warn-with-documentation compromise was mine too.

What I changed or rejected outright: the in-app `/validation` React page was built, verified
(16/16), then removed at my direction when I decided the demo story worked better through the
API/Swagger plus Student 3's approval flow — the report was updated to match so no stale claim
survives. What I personally learned: designing for determinism, reading EF Core test-harness
failure modes, writing golden-case agent evaluations, and treating CI/lint as shared team
infrastructure rather than one person's chore. I can explain, modify, test and debug every file
listed in §1 without assistance — as the viva requires.

### 9. Signed declaration
I declare that the work described in this Individual Report section is my own contribution to the
group project, completed with disclosed AI assistance as logged in `AI_Usage_Log_Student4.md`.
All AI-generated material was reviewed, understood, executed and verified by me before inclusion.
No credentials, personal data, or secrets were shared with any AI tool, and none are committed to
the repository.

Student 4 — Volunteer/Responder Management + Validation/Safety Agent
Date: 16 September 2026
Signature: ___________________________
