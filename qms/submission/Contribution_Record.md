# Genuine individual contribution record

**Latest explanation status:** All four explanations are received and organized in Member 1-4 order in [Member_Explanations.md](Member_Explanations.md). The supplied Member 1-2 statements describe earlier D-series examples; corrected summaries distinguish these from the personal C-series runs. Original statements are retained. Members should review the corrections and prepare for the viva.

**8 October evidence update:** All four supplied personal changed-input terminal screenshots match saved reports: 2/2 scenarios passed per member. Deneshkar's written explanation is recorded. All four explanations have now been supplied; all members prepare for the viva. See [Personal_Changed_Input_Evidence.md](Personal_Changed_Input_Evidence.md).

Repository: https://github.com/Deneshkar/emergency-resource-coordination-platform

Verified against GitHub commit API responses and changed-file lists on 6 October 2026. These records demonstrate existing contributions to the tested SEF project. Git author/account attribution does not prove who personally executed a later QMS rerun.

## Verified existing contributions

| Member | GitHub account | Recorded contribution | Commit |
|---|---|---|---|
| Jathurshy.S / IT24103355 | Jathurshy11 | Added IncidentControllerTests.cs together with incident/planner implementation. | [50f9414](https://github.com/Deneshkar/emergency-resource-coordination-platform/commit/50f9414e8ceeb8f287112bde2a81883fa9ba4245) |
| M.Thanusikan / IT24103609 | it24103609 | Added backend edge cases for shelters, inventory and geolocation. | [25de8a9](https://github.com/Deneshkar/emergency-resource-coordination-platform/commit/25de8a92bee86fe982b6fdbbe65afdc35055ce43) |
| M.Thanusikan / IT24103609 | it24103609 | Added React tests for shelter, resource and inventory pages. | [6846af6](https://github.com/Deneshkar/emergency-resource-coordination-platform/commit/6846af6080a41d8f9f02be333440d2fdcb641714) |
| Denesh N / IT24102826 | Denesh005 | Added DispatchAllocationTests.cs, DispatchesControllerTests.cs and React dispatch tests. | [48a9c3b](https://github.com/Deneshkar/emergency-resource-coordination-platform/commit/48a9c3b9cd87d67ce48b9c16aeb960be85baa266) |
| Denesh N / IT24102826 | Denesh005 | Removed duplicate migration table operations and updated MailKit to 4.18.1. | [cd96717](https://github.com/Deneshkar/emergency-resource-coordination-platform/commit/cd967173f349ae343a729b885cb7182eca7a2d83) |
| Deneshkar. P / IT24103828 | Deneshkar | Added VolunteerShiftTests.cs and VolunteersApiIntegrationTests.cs. | [3c059a6](https://github.com/Deneshkar/emergency-resource-coordination-platform/commit/3c059a63c9093f6347de4fbef73f9b3e7164910a) |
| Deneshkar. P / IT24103828 | Deneshkar | Committed public-role and dispatch authorization fixes and QMS regressions. | [ee924e2](https://github.com/Deneshkar/emergency-resource-coordination-platform/commit/ee924e23010cdc591afd7fa393c3b239c438bfef) |

Machine-readable verification: ../evidence/github/verified-member-commits.json records full hashes, linked GitHub authors, dates and changed files. Original authors and commit dates are preserved.

## New QMS work

On 7 October, six supplied terminal screenshots were matched to members 1 to 3's declared-personal runs and raw reports. These establish recorded execution outcomes; own-word explanations and changed-input exercises remain pending. Historical group execution and report preparation remain recorded separately.

| Member | Submitted personal testing | Remaining work |
|---|---|---|
| Jathurshy.S / IT24103355 | 9 backend + 2 agent tests; 2 separate demos passed on 7 October | Own-word explanation and changed-input exercise |
| M.Thanusikan / IT24103609 | 12 backend + 5 agent tests; 2 separate demos passed on 7 October | Own-word explanation and changed-input exercise |
| Denesh N / IT24102826 | 23 backend + 3 agent tests; 2 separate demos passed on 7 October | Own-word explanation and changed-input exercise |
| Deneshkar. P / IT24103828 | Earlier guided personal run: 4 controller + 5 HTTP + 3 safety tests passed on 6 October | Own-word explanation and boundary exercise; later full-package personal operator confirmation |

See [Personal_Execution_Evidence.md](Personal_Execution_Evidence.md) for the new screenshots and raw reports, and [Individual_Evidence_IT24103828.md](Individual_Evidence_IT24103828.md) for Deneshkar's earlier evidence. Reruns do not increase the unique group-test count.

Do not re-author or split generated changes to simulate four individual histories. Each member can add genuine review notes, fixture improvements, tests and results after doing the work. Existing test-authorship evidence above is already useful and should not be left blank.

## Publication

Source commit 9226a56 is published on fix/qms-submission-readiness, based on main 054fce7, with PR #47 (now closed without merging). The implementation commit, pull request and successful CI run are recorded in GitHub_Publication.md after remote verification. No CourseWeb upload is performed.

## Exact commit metadata

Dates below use Sri Lanka time (UTC+05:30). Author dates record the original contribution; committer dates can differ after integration. Full messages are copied from the Git objects identified by the GitHub-verified hashes. These dates are not personal QMS execution dates.

### Jathurshy.S / IT24103355 / 50f9414

- GitHub account: Jathurshy11
- Full commit: [50f9414e8ceeb8f287112bde2a81883fa9ba4245](https://github.com/Deneshkar/emergency-resource-coordination-platform/commit/50f9414e8ceeb8f287112bde2a81883fa9ba4245)
- Author date: 2026-09-16T10:55:54+05:30
- Committer date: 2026-09-21T12:29:48+05:30

Exact commit message:

```text
feat: complete student 1 incident intelligence and planner agent
```

Incident controller tests accompany incident input handling and coordinator/planner implementation. This is backend test authorship evidence.

Relevant files: `backend-tests/IncidentControllerTests.cs`.

### M.Thanusikan / IT24103609 / 25de8a9

- GitHub account: it24103609
- Full commit: [25de8a92bee86fe982b6fdbbe65afdc35055ce43](https://github.com/Deneshkar/emergency-resource-coordination-platform/commit/25de8a92bee86fe982b6fdbbe65afdc35055ce43)
- Author date: 2026-09-16T08:24:46+05:30
- Committer date: 2026-09-16T08:24:46+05:30

Exact commit message:

```text
test(backend): Add edge case unit tests for shelters, inventory, and geolocation
```

Backend edge-case tests cover shelters, inventory and geolocation. These committed tests are distinct from the later QMS PostgreSQL and migration regressions.

Relevant files: `backend-tests/GeolocationServiceTests.cs`, `backend-tests/InventoryControllerTests.cs`, `backend-tests/SheltersControllerTests.cs`.

### M.Thanusikan / IT24103609 / 6846af6

- GitHub account: it24103609
- Full commit: [6846af6080a41d8f9f02be333440d2fdcb641714](https://github.com/Deneshkar/emergency-resource-coordination-platform/commit/6846af6080a41d8f9f02be333440d2fdcb641714)
- Author date: 2026-09-16T08:28:53+05:30
- Committer date: 2026-09-16T08:28:53+05:30

Exact commit message:

```text
test(react): Add unit tests for ShelterList, ResourceList, and InventoryList pages
```

React page tests cover ShelterList, ResourceList and InventoryList. Existing component tests retain the scope and limitations described in the report.

Relevant files: `frontend-react/src/pages/__tests__/InventoryList.test.jsx`, `frontend-react/src/pages/__tests__/ResourceList.test.jsx`, `frontend-react/src/pages/__tests__/ShelterList.test.jsx`.

### Denesh N / IT24102826 / 48a9c3b

- GitHub account: Denesh005
- Full commit: [48a9c3b9cd87d67ce48b9c16aeb960be85baa266](https://github.com/Deneshkar/emergency-resource-coordination-platform/commit/48a9c3b9cd87d67ce48b9c16aeb960be85baa266)
- Author date: 2026-09-26T12:35:36+05:30
- Committer date: 2026-09-26T12:35:36+05:30

Exact commit message:

```text
Implement dispatch task allocation

Resolved resource ID consistency, secured the dispatch approval workflow, completed the coordinator dispatch UI flow and added allocation and validation tests.
```

Backend dispatch allocation, validation and controller tests, plus React dispatch-page and validation-service tests, accompany the dispatch implementation.

Relevant files: `backend-tests/DispatchAllocationTests.cs`, `backend-tests/DispatchValidationServiceTests.cs`, `backend-tests/DispatchesControllerTests.cs`, `backend/Migrations/20260926062717_UnifyDispatchTaskResourceId.Designer.cs`, `backend/Migrations/20260926062717_UnifyDispatchTaskResourceId.cs`, `backend/Migrations/20260926063743_AddAllocationPlanToDispatch.Designer.cs`, `backend/Migrations/20260926063743_AddAllocationPlanToDispatch.cs`, `backend/Migrations/AppDbContextModelSnapshot.cs`, `frontend-react/src/pages/__tests__/DispatchList.test.jsx`, `frontend-react/src/services/__tests__/validationService.test.js`.

### Denesh N / IT24102826 / cd96717

- GitHub account: Denesh005
- Full commit: [cd967173f349ae343a729b885cb7182eca7a2d83](https://github.com/Deneshkar/emergency-resource-coordination-platform/commit/cd967173f349ae343a729b885cb7182eca7a2d83)
- Author date: 2026-10-05T12:30:00+05:30
- Committer date: 2026-10-05T12:30:00+05:30

Exact commit message:

```text
fix: database migrations and prepare backend deployment

Migration: EF Core database updates for safe schema changes.
```

Removed duplicate migration table operations and upgraded MailKit. This is a database repair contribution; this commit does not itself prove execution of the later QMS migration tests.

Relevant files: `backend/Migrations/20260916110602_AddAffectedCountToIncidents.cs`.

### Deneshkar. P / IT24103828 / 3c059a6

- GitHub account: Deneshkar
- Full commit: [3c059a63c9093f6347de4fbef73f9b3e7164910a](https://github.com/Deneshkar/emergency-resource-coordination-platform/commit/3c059a63c9093f6347de4fbef73f9b3e7164910a)
- Author date: 2026-09-16T21:08:35+05:30
- Committer date: 2026-09-21T12:29:49+05:30

Exact commit message:

```text
feat: add volunteer shift and API integration tests, and update documentation
```

Volunteer shift tests and volunteer API integration tests accompany responder validation and controller changes.

Relevant files: `backend-tests/VolunteerShiftTests.cs`, `backend-tests/VolunteersApiIntegrationTests.cs`.

### Deneshkar. P / IT24103828 / ee924e2

- GitHub account: Deneshkar
- Full commit: [ee924e23010cdc591afd7fa393c3b239c438bfef](https://github.com/Deneshkar/emergency-resource-coordination-platform/commit/ee924e23010cdc591afd7fa393c3b239c438bfef)
- Author date: 2026-10-03T13:21:27+05:30
- Committer date: 2026-10-03T13:21:27+05:30

Exact commit message:

```text
feat(security): restrict public registration to Citizen/Volunteer, lock dispatch writes to Coordinator/Admin
```

Committed public-role and dispatch authorization fixes, PostgreSQL/security regressions, and React protected-route/resource behaviour tests. QMS preparation and execution were AI-assisted.

Relevant files: `backend-tests/AuthControllerTests.cs`, `backend-tests/QmsPostgresTests.cs`, `backend-tests/QmsSecurityTests.cs`, `backend-tests/VolunteersApiIntegrationTests.cs`, `frontend-react/src/components/__tests__/ProtectedRoute.test.jsx`, `frontend-react/src/pages/__tests__/ResourceBehaviour.test.jsx`.

## Individual testing status

Backend and React test authorship is supported by the commits above. Denesh N also has a verified database repair commit. Later QMS database, deterministic AI, live HTTP and performance runs are recorded as AI-assisted group execution. The narrower member 1 to 3 personal selections submitted on 7 October are now separately supported by screenshots and raw reports in Personal_Execution_Evidence.md; they do not establish personal execution of the wider group suites.

Deneshkar subsequently supplied six screenshots of his guided personal execution on 6 October: four controller, five HTTP integration and three safety-agent tests passed. Raw reports confirm these 12 existing test reruns. See Individual_Evidence_IT24103828.md and PDF Appendix C. Own-word explanations and the boundary exercise remain unconfirmed.

Appendix A contains each member's responsibility and contribution summary. The group supplied four actual GitHub screenshots on 6 October 2026; Appendix B embeds them. The unchanged originals and their SHA-256 checksums are recorded in `../evidence/github/screenshots.json`. For volunteer commit 3c059a6, GitHub identifies Deneshkar as author and Jathurshy11 as committer; authorship and commit integration are distinct roles.


## 8 October changed-input update

OpenAI Codex executed four before/after comparisons against the actual agents: eight scenarios passed. Exact commands, original and modified inputs, expectations and observed outputs are in [Changed_Input_Results.md](Changed_Input_Results.md). Deneshkar supplied a written boundary/overlap explanation, retained verbatim. These technical runs do not establish personal execution. All four personal comparison runs are now supported by screenshots and raw reports. All four explanations are now supplied; see Member_Explanations.md for evidence corrections. Group totals stay 270 automated tests and 272 inventory records.
