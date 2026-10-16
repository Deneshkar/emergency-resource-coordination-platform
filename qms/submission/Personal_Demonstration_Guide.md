# Collecting personal demonstration evidence

**Latest explanation status:** All four explanations are received and organized in Member 1-4 order in [Member_Explanations.md](Member_Explanations.md). The supplied Member 1-2 statements describe earlier D-series examples; corrected summaries distinguish these from the personal C-series runs. Original statements are retained. Members should review the corrections and prepare for the viva.

**8 October evidence update:** All four supplied personal changed-input terminal screenshots match saved reports: 2/2 scenarios passed per member. Deneshkar's written explanation is recorded. All four explanations have now been supplied; all members prepare for the viva. See [Personal_Changed_Input_Evidence.md](Personal_Changed_Input_Evidence.md).

Each member must execute their own named runner and explain their results. A shared computer is fine: the operator must be the actual person running and explaining the work. Running all four commands under four names by one person does not establish four personal demonstrations.

Use the complete latest assignment ZIP or repository checkout. The commands below are relative to the assignment root. In a repository checkout, replace ./QMS/ with ./qms/.

| Member | Command | Expected existing test selection |
|---|---|---|
| Jathurshy.S / IT24103355 | `./QMS/members/member1-IT24103355/run-member1-tests.ps1 -ExecutionKind personal -Operator 'Jathurshy.S'` | 11 |
| M.Thanusikan / IT24103609 | `./QMS/members/member2-IT24103609/run-member2-tests.ps1 -ExecutionKind personal -Operator 'M.Thanusikan'` | 17 |
| Denesh N / IT24102826 | `./QMS/members/member3-IT24102826/run-member3-tests.ps1 -ExecutionKind personal -Operator 'Denesh N'` | 26 |
| Deneshkar. P / IT24103828 | `./QMS/members/member4-IT24103828/run-member4-tests.ps1 -ExecutionKind personal -Operator 'Deneshkar. P'` | 19 |

1. Read your member README and open Test_Cases.html. Run only your own command above.
2. Save a screenshot showing the command and final result. Open the generated results.html and agent-demo.html; capture the agent input and actual output.
3. Copy your Personal_Demonstration_Template.md into the new results/personal-<timestamp>/ folder as Understanding.md. Complete the execution details and questions in your own words.
4. Perform the small input-change exercise described in your template. Record your prediction before running and explain the observed output. Save the changed input, screenshots and generated demo report.
5. Return your new personal results folder, the separate demo results folder, and your completed Understanding.md. Keep all raw TRX/XML/JSON/log files. Do not send only the HTML: it links to other evidence files.

Failures should remain visible with an explanation and any subsequent retest. Expected counts are not substitutes for actual results.

## PDF update

Once actual member records are supplied, each individual section can include identity/component/agent, execution date and command, observed test counts, source and evidence links, terminal and agent-output screenshots, the member's explanation, their changed-input exercise, and disclosed assistance.

Until then, the existing PDF accurately separates AI-assisted verification from personal evidence. Deneshkar's earlier 12-test personal run remains recorded; it is not a new personal run of the complete 19-test package. Members 1-3 supplied personal execution screenshots on 7 October. Deneshkar supplied a written boundary/overlap explanation on 8 October. All four new personal changed-input runs and all four explanations are now supplied; see Member_Explanations.md for evidence corrections. See Changed_Input_Results.md and Changed_Input_Demonstrations.md.

