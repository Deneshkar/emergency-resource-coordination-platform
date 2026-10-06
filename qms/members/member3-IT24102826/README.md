# Member 3: Denesh N - IT24102826

Business component: **Dispatch and Task Assignment**. Agent: **ResourceAllocationAgent**.

This folder is your presentation index. Test selection follows component ownership; it does not reassign historical authorship. Existing Git commits remain the source of authorship evidence. Package wrappers and presentation files were prepared with OpenAI Codex assistance.

Open **index.html** in your browser to present the case list and dated test/agent output reports.

Source_Code.html provides readable snapshots of the original test and agent files with hashes, so source links work in both ZIP and repository layouts. The runners execute the original source files, not these presentation snapshots.

## Run your own tests

Requirements: Python with QMS/scripts/requirements.txt installed and a compatible .NET SDK/runtime for the net8.0 test project. From this folder in PowerShell:

```powershell
./run-member3-tests.ps1 -ExecutionKind personal -Operator 'Denesh N'
```

Expected selection: **23 backend tests + 3 agent tests = 26 existing tests**, plus **2 agent demonstration scenarios** checked separately. The runner fails on missing, failed or skipped selected tests. These selected backend fixtures use EF Core InMemory/TestServer. No running API or PostgreSQL server is required for this package; real PostgreSQL and full-system evidence remain in the group suite.

Each invocation creates a new results/<execution-kind>-<timestamp>/ folder with results.html, backend.trx, agents.xml, logs, execution.json, agent-inputs.json, agent-output.json and agent-demo.html. Open results.html in your browser and screenshot your actual command and completed results. The personal label is your execution declaration, not proof of understanding. Keep your notes in that dated folder and explain any failures honestly.

## Show your agent input and output

```powershell
./demo-member3-agent.ps1 -Operator 'Denesh N'
```

Open the printed agent-demo.html path. It shows every input, actual output, expected checks and observed result. The command calls the actual resource_allocation_agent.py method allocate_for_incident; outputs are not hardcoded. Live LLM calls are disabled. A dispatch requirement, resource pool and available volunteers produce a proposed allocation and shortage list. Human approval is always required; the displayed proposal does not execute a dispatch.

The scenarios are editable in agent-inputs.json. To rehearse a change, copy that file, change an input, predict the result and then update the expected checks only when you can justify the new expectation. Run `./demo-member3-agent.ps1 -InputFile ./your-practice-inputs.json -Operator 'Denesh N'`. A failed expectation produces a failing exit code and preserves the actual output.

## What to show in the viva

1. Open Test_Cases.html: locate a normal, invalid or boundary case, its input, expected assertions and original source.
2. Run your member command and open its new results.html. Explain expected versus actual results.
3. Open agent-inputs.json, then agent-demo.html: explain what your business component supplies and how your agent reaches its decision.
4. Explain one relevant defect/retest from the group evidence. Do not describe old group results as a new personal run.
5. Change one fixture/input, predict the outcome, execute it and explain the check that passes or fails. Record your own explanation.

## Evidence status

Your new personal QMS execution is not yet confirmed. AI-assisted verification results demonstrate that the package works, not that you personally ran it.

Verification labelled ai-assisted was run by Codex to check the package. It is separate from your own results. Member packages are focused demonstrations, not replacements for all 270 automated group cases. Additional scenario checks are not added to the report's 272-record inventory.
