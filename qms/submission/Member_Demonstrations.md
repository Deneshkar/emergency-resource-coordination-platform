# Four individual testing and agent demonstrations

Open [the member presentation index](../members/index.html) in a local browser. Keep the complete repository or assignment ZIP: the packages call the actual SEF source and canonical tests.

| Member | Package | Selected existing tests | Agent scenarios |
|---|---|---|---|
| Jathurshy.S / IT24103355 | [Member 1: incidents and planner](../members/member1-IT24103355/index.html) | 9 backend + 2 agent = 11 | 2 |
| M.Thanusikan / IT24103609 | [Member 2: resources/inventory and situation analysis](../members/member2-IT24103609/index.html) | 12 backend + 5 agent = 17 | 2 |
| Denesh N / IT24102826 | [Member 3: dispatch and allocation](../members/member3-IT24102826/index.html) | 23 backend + 3 agent = 26 | 2 |
| Deneshkar. P / IT24103828 | [Member 4: volunteers and safety](../members/member4-IT24103828/index.html) | 9 backend + 10 agent = 19 | 4 |

Each folder contains member.json, a README, a named run-memberN-tests.ps1, a named demo-memberN-agent.ps1, Test_Cases.html/test-cases.json, editable agent-inputs.json and a results directory. index.html links each dated test report and actual agent output. Source implementations remain in their established business-specific files; selection wrappers make separate execution explicit without duplicating or relabelling authorship.

## Verification and counts

All four test runners were executed by Codex as AI-assisted package verification on 6 October 2026. All 73 selected tests and all 10 demonstration scenarios passed. members/verification.json links the raw execution records. A deliberately wrong safety expectation was also checked outside the submission evidence: the demo returned a failure and retained its real output.

These are reruns of existing tests, not 73 additional unique tests. The group report remains 270 automated cases and 272 inventory records. Demonstration scenario checks are recorded separately. This focused package does not replace the PostgreSQL, React, Flutter, live HTTP or performance group suites. The selected backend fixtures use InMemory/TestServer; the Python agents run deterministically without live Gemini calls.

Situation analysis reports the eligible shelter with the largest available capacity, despite the existing nearest_shelter field name. It does not demonstrate geographical nearest-shelter selection. Resource allocation and safety decisions are proposals/recommendations; a coordinator still approves dispatches.

## Personal demonstration

Open your folder in PowerShell and run its named script with -ExecutionKind personal -Operator followed by your name. Record only work you actually performed. Each run creates a fresh dated results folder. Open results.html and agent-demo.html, show the input and output, explain one assertion and one failure/boundary scenario, and save your screenshot and own-word notes beside the reports.

Deneshkar's earlier 12 personally executed cases and six screenshots remain in Individual_Evidence_IT24103828.md and PDF Appendix C. His full new package includes seven additional existing safety cases, so it selects 19 tests. The new package verification is AI-assisted; it does not confirm a new personal 19-test run. His boundary exercise and explanations remain unconfirmed. The other three members' new personal QMS runs remain unconfirmed.

Publication uses the existing fix/qms-submission-readiness branch. PR #47 remains closed; no merge, deployment or CourseWeb upload is performed by this update.
