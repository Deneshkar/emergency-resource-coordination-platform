# AI Usage Log — Student 4 (Volunteer/Responder Management + Validation/Safety Agent)

> Course requirement: every student declares which AI tools were used, for what,
> and how the output was verified. This log covers Student 4's contribution only.

## Tools used
| Tool | Used for | Model / version (approx.) |
|---|---|---|
| OpenCode + Muse Spark (agentic coding assistant) | Scaffolding `validation_safety_agent.py`, `DispatchValidationService.cs`, ValidationsController/DTOs, backend + frontend + widget tests, ADR drafts, CI expansion | muse-spark, Sept 2026 |
| Manual review + local execution | All verification below | — |

## Prompt / task history (summary, all September 2026 — pre-existing volunteer component work is from Aug–early Sept 2026)
1. **16 Sept — “Analyse the team status report vs the actual repo and tell Student 4 what to do.”**
   → Assistant read controllers, services, tests, Flutter screens, CI and docs, and produced a
   verified gap list. Key finding I confirmed myself: the report was outdated — JWT setup,
   `VolunteersController` (7 tests, not 4) and `widget_test.dart` were already fixed.
2. **16 Sept — “Build the missing Validation/Safety Agent correctly.”**
   → Assistant scaffolded the Python agent mirroring `situation_analysis_agent.py` conventions
   (allow-list, structured JSON I/O, `--json` CLI). I reviewed every rule code (V1–V3, S1–S2,
   R1–R2, I1, W1–W4) against `AppDbContext` relationships before accepting.
3. **16 Sept — “Mirror it in C# with tests + endpoint + DI.”**
   → Assistant created `DispatchValidationService`, `ValidationDtos`, `ValidationsController`,
   `DispatchValidationServiceTests` and the `Program.cs` registration. I verified with
   `dotnet test` (34/34 green, incl. 6 new).
4. **16 Sept — “Expand CI, write the 2 ADRs, add Flutter/React tests.”**
   Follow-ups, same day: shift-creation endpoint + tests, Coordinator/Admin gate on the
   validation endpoints, HTTP integration tests (incl. diagnosing the InMemory store-isolation
   failure), and the Individual Report completion (reflection, challenges, declaration).
   → Assistant expanded `ci.yml` to 3 jobs, drafted both ADRs, added 4 Flutter test files and
   Vitest + 3 React test files. I ran every suite locally (see verification table).

## What I kept vs changed
- **Kept**: agent rule taxonomy and APPROVE/REVISE/REJECT contract; C# service structure;
  test layouts; ADR format (copied from ADR 02).
- **Changed / decided myself**:
  - `DispatchTask.ResourceId` is `Guid?` while `Resource.Id` is `int` (Student 3 schema mismatch)
    → C# service flags resource links as `W4_RESOURCE_LINK_UNVERIFIED` warning instead of
    hard-failing; Python agent still enforces resource checks deterministically.
  - `REVISE` vs `REJECT`: only capacity/quantity/double-booking blockers are revisable;
    anything else (e.g. missing records, inactive shelter, unavailable volunteer) is `REJECT`.
  - Fixed a real UI bug found by the new widget tests: `RegisterScreen` role dropdown overflow
    (`isExpanded: true`) — tests initially failed with a 48px RenderFlex overflow.
  - Fixed pre-existing `StatusBadge` duplicate keys (`Active`, `Rejected` — identical values,
    so removal is behaviour-preserving) and unused imports/vars blocking `npm run lint`.
  - Set `react-hooks/set-state-in-effect` to `warn` (team-wide data-fetch pattern; documented
    in `eslint.config.js`) instead of restructuring 8 teammates' pages before the deadline.

## Verification (all run locally by me)
| Check | Command | Result |
|---|---|---|
| Python agent happy path | `python ai-agents/validation_safety_agent.py` | APPROVE, 5 checks |
| Python agent blocker path | inline multi-violation payload | REJECT, V1+V2+S2+R1 |
| Backend suite | `dotnet test ./backend-tests/ERCP.Api.Tests.csproj` | **34/34 passed** (28 existing + 6 new) |
| React suite | `npm test` (Vitest) | **11/11 passed** (3 files) |
| React lint | `npm run lint` | 0 errors (10 documented warnings) |
| React build | `npm run build` | ✓ 110 modules, dist emitted |
| Flutter suite | `flutter test` | **12/12 passed** (4 files) |
| Flutter analyze | `flutter analyze` | No issues found |
| Agents compile (CI step) | `python -m py_compile ai-agents/*.py` | OK |

## Declaration
AI assistance was used for scaffolding and drafting as listed above. All design decisions,
rule semantics, business-rule exceptions (W4), verification runs and final code review are my
own work. No AI-generated code was committed without being read, understood and executed.
