# Member 2: M.Thanusikan - IT24103609

Business component: **Resource and Inventory Management**. Agent: **SituationAnalysisAgent**.

This folder is your presentation index. Test selection follows component ownership; it does not reassign historical authorship. Existing Git commits remain the source of authorship evidence. Package wrappers and presentation files were prepared with OpenAI Codex assistance.

Open **index.html** in your browser to present the case list and dated test/agent output reports.

Source_Code.html provides readable snapshots of the original test and agent files with hashes, so source links work in both ZIP and repository layouts. The runners execute the original source files, not these presentation snapshots.

## Run your own tests

Requirements: Python with QMS/scripts/requirements.txt installed and a compatible .NET SDK/runtime for the net8.0 test project. From this folder in PowerShell:

```powershell
./run-member2-tests.ps1 -ExecutionKind personal -Operator 'M.Thanusikan'
```

Expected selection: **12 backend tests + 5 agent tests = 17 existing tests**, plus **2 agent demonstration scenarios** checked separately. The runner fails on missing, failed or skipped selected tests. These selected backend fixtures use EF Core InMemory/TestServer. No running API or PostgreSQL server is required for this package; real PostgreSQL and full-system evidence remain in the group suite.

Each invocation creates a new results/<execution-kind>-<timestamp>/ folder with results.html, backend.trx, agents.xml, logs, execution.json, agent-inputs.json, agent-output.json and agent-demo.html. Open results.html in your browser and screenshot your actual command and completed results. The personal label is your execution declaration, not proof of understanding. Keep your notes in that dated folder and explain any failures honestly.

## Show your agent input and output

```powershell
./demo-member2-agent.ps1 -Operator 'M.Thanusikan'
```

Open the printed agent-demo.html path. It shows every input, actual output, expected checks and observed result. The command calls the actual situation_analysis_agent.py method run_assessment; outputs are not hardcoded. Live LLM calls are disabled. Incident priority, inventory, resources and shelters produce urgency and shortage analysis. The current method named nearest_shelter selects the eligible shelter with most available capacity; it does not calculate geographic distance. Backend tests here use InMemory, not PostgreSQL.

The scenarios are editable in agent-inputs.json. To rehearse a change, copy that file, change an input, predict the result and then update the expected checks only when you can justify the new expectation. Run `./demo-member2-agent.ps1 -InputFile ./your-practice-inputs.json -Operator 'M.Thanusikan'`. A failed expectation produces a failing exit code and preserves the actual output.

## What to show in the viva

1. Open Test_Cases.html: locate a normal, invalid or boundary case, its input, expected assertions and original source.
2. Run your member command and open its new results.html. Explain expected versus actual results.
3. Open agent-inputs.json, then agent-demo.html: explain what your business component supplies and how your agent reaches its decision.
4. Explain one relevant defect/retest from the group evidence. Do not describe old group results as a new personal run.
5. Change one fixture/input, predict the outcome, execute it and explain the check that passes or fails. Record your own explanation.

## Evidence status

Your submitted 7 October personal execution is supported by two terminal screenshots and matching raw reports. See [Personal_Execution_Evidence.md](../../submission/Personal_Execution_Evidence.md). Own-word explanations and a changed-input exercise remain pending.

Verification labelled ai-assisted was run by Codex to check the package. It is separate from your own results. Member packages are focused demonstrations, not replacements for all 270 automated group cases. Additional scenario checks are not added to the report's 272-record inventory.
