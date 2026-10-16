"""Evidence-based plan shared by the Word and PDF report builders.

Responsibilities are assigned review ownership, not claims of personal execution.
Dates describe retained executions; no future or backdated run is implied.
"""

SCOPE = ('The existing ERCP system: incident planning, resources and shelters, dispatch '
         'approval, volunteer shifts, authentication, React views, Flutter units/widgets, '
         'PostgreSQL integrity and deterministic agents. Live LLM evaluation, physical-device '
         'workflows and production-scale assurance are outside the recorded scope.')
OBJECTIVES = ('Check normal, invalid, boundary and failure behaviour; verify a complete API '
              'workflow; measure the stated load thresholds; detect authorization and data-integrity '
              'defects; preserve source, expected results, actual results and retest evidence.')
RESPONSIBILITIES = ('Names identify assigned review responsibility following the SEF component '
                    'allocation. All four members review their own backend and agent cases. '
                    'Shared-area ownership does not establish personal execution: dated raw records '
                    'and individual appendices identify the actual operators.')
HEADERS = ['Testing Area', 'What is Tested', 'Tool/Framework', 'Responsible Member', 'Environment', 'Schedule']
ROWS = [
    ['Backend/API', 'Controllers, services, validation and HTTP contracts', 'xUnit; WebApplicationFactory', 'All four, by component', '.NET 8 test host; EF InMemory fixtures', '6 Oct group; 6-7 Oct personal'],
    ['Database', 'Constraints, relationships, transactions and migrations', 'xUnit; EF Core; PostgreSQL', 'M.Thanusikan', 'Isolated PostgreSQL; port 55432', '5 Oct repair; 6 Oct retest'],
    ['React', 'Components, forms, protected routes and error states', 'Vitest; React Testing Library', 'Denesh N; M.Thanusikan', 'Node 22; mocked API fixtures', '6 Oct full rerun'],
    ['Flutter', 'Models, forms, navigation and widget states', 'flutter_test', 'Deneshkar. P', 'Flutter 3.44.9; unit/widget harness', '6 Oct full rerun'],
    ['Integration/E2E', 'Incident to plan, dispatch, validation and approval', 'pytest; Requests; SQL verification', 'Jathurshy.S; Denesh N', 'Local API 5009 and PostgreSQL; API workflow', '5 Oct repair; 6 Oct rerun'],
    ['Performance', 'Authenticated reads; p95, errors and response checks', 'k6 1.3.0', 'Denesh N', 'Local API; up to 10 VUs; 40 seconds', '6 Oct load run'],
    ['Security', 'Privileged signup, role checks, JWT and hostile inputs', 'xUnit; pytest; Requests', 'Denesh N; Deneshkar. P', 'Test host and isolated live API', '3 Oct defects; 6 Oct retest'],
    ['Agentic AI', 'Approval, tool limits, capacity, allocation and safe failure', 'pytest; deterministic JSON checks', 'All four, matching agents', 'Python 3.13; live Gemini disabled', '6 Oct group; 6-7 Oct personal'],
]
SCHEDULE_HEADERS = ['Recorded date', 'Activity and retained evidence']
SCHEDULE = [
    ['3 October 2026', 'Baseline review and initial security failures: evidence/baseline and evidence/security-before.'],
    ['5 October 2026', 'BUG-03 repair, four migration regressions and database/backend/workflow retests: evidence/migration-fix.'],
    ['6 October 2026', 'Full group rerun: evidence/final. 270 automated passes, one k6 scenario and one migration CLI check; 272 inventory records.'],
    ['6 October 2026', 'Deneshkar personal evidence: 4 controller, 5 HTTP and 3 safety tests; evidence/individual/IT24103828/20261006-151749.'],
    ['7 October 2026', 'Personal runs: Jathurshy 11, Thanusikan 17 and Denesh 26 passing tests, plus two agent scenarios each; members/personal-evidence.json.'],
    ['8 October 2026', 'Codex executed four before/after comparisons: eight scenarios passed. Deneshkar supplied a written boundary/overlap explanation; members/changed-input-evidence.json.'],
    ['8 October 2026 personal runs', 'Four supplied terminal screenshots match the personal comparisons: two scenarios passed per member, eight total. See members/personal-changed-input-evidence.json.'],
    ['Personal work remaining', 'All four explanations received. Members 1-2 review the documented D-series/C-series corrections. All members prepare to explain assertions and results in the viva.'],
]
ACCEPTANCE = ('Case-level expected results and assertions are in Test_Cases.html. Entry requires '
              'installed dependencies, isolated fixtures and reachable services. Exit for the evaluated '
              'scope requires recorded outcomes and retesting of demonstrated critical defects. The '
              'k6 gates are p95 below 1000 ms, HTTP failures below 1% and all content/status checks passing.')

if __name__ == '__main__':
    from pathlib import Path
    destination = Path(__file__).resolve().parents[1] / 'submission/Test_Plan.md'
    def markdown_table(headers, rows):
        return '\n'.join(['| '+' | '.join(headers)+' |', '| '+' | '.join(['---']*len(headers))+' |'] +
                         ['| '+' | '.join(row)+' |' for row in rows])
    destination.write_text('# ERCP Test Plan\n\nSE3110 - Quality Management in Software Engineering\n\n'
        '## Scope and objectives\n\n'+SCOPE+'\n\n'+OBJECTIVES+'\n\n## Testing areas and responsibilities\n\n'+
        markdown_table(HEADERS, ROWS)+'\n\n'+RESPONSIBILITIES+'\n\n## Recorded schedule\n\n'+
        markdown_table(SCHEDULE_HEADERS,SCHEDULE)+'\n\nDates reflect existing evidence, not new executions. '
        'The brief states a 5 October deadline; no extension or timely submission is claimed.\n\n'
        '## Acceptance and traceability\n\n'+ACCEPTANCE+'\n\n'
        'See [test cases](Test_Cases.html), [defects and retests](Defect_Report.html), '
        '[reproduction guide](Reproduction_Guide.md) and [personal evidence](Personal_Execution_Evidence.md). '
        'Member reruns and demonstrations are not additional unique group tests.\n\n'
        '## Remaining individual and declaration work\n\n'
        'The repository owner confirmed SE3110 as the submission module. Deneshkar supplied a written boundary/overlap explanation on 8 October. '
        'All four personal changed-input runs are now supported by supplied screenshots and matching raw reports. All four explanations are received; evidence-aligned summaries and corrections are retained in Member_Explanations.md. Follow '
        '[the exercise guide](Changed_Input_Demonstrations.md). The existing assistance declaration '
        'must be mapped to the lecturer-provided CLEAR headings, which were not supplied in the brief. '
        'No ZAP scan was executed; the recorded security checks use xUnit and pytest/Requests.\n', encoding='utf-8')
    print(destination)
