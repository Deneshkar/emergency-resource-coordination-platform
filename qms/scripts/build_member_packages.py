"""Create four ownership-labelled presentation packages using canonical tests."""
import copy
import hashlib
import json
import os
from pathlib import Path
from paths import QMS, REPO
from member_support import write_json, write_html, esc, refresh_member_index

def check(path, value=None, op='equals'):
    return dict(path=path,op=op,value=value)

def sample(id, title, payload, *checks):
    return dict(id=id,title=title,input=payload,checks=list(checks))

def safety(available=True, start='10:00', existing=False):
    return dict(dispatch_id=42,incident_id=7,assignments=[dict(volunteer_id='vol-demo-4',volunteer_name='Demo Responder',
        is_available=available,skills='medical, rescue',required_skills='medical',
        proposed_shift=dict(start=f'2026-10-06T{start}:00Z',end='2026-10-06T11:00:00Z'),
        existing_shifts=[dict(id='shift-existing',start='2026-10-06T09:00:00Z',end='2026-10-06T10:00:00Z',status='Scheduled')] if existing else [])])

definitions=[
    dict(number=1,name='Jathurshy.S',student_id='IT24103355',component='Incident Management',agent_module='coordinator_planner_agent',agent_class='CoordinatorPlannerAgent',agent_method='analyze_and_plan',
         backend_classes=['IncidentControllerTests','IncidentPlannerServiceTests'],agent_codes=['AI02'],allowlist_agent='CoordinatorPlannerAgent',
         demo_note='Incident details and supplied resources produce a response plan with actions, reasoning and required human approval. This deterministic demonstration does not call Gemini or save a plan to the database.',
         samples=[sample('M1-D01','Incident with available responders',dict(incident_id=7,title='Building fire',category='Fire',priority='High',location='Demo Sector',affected_count=5,resources=[dict(id=1,name='Rescue vehicle',resourceType='Vehicle',status='Available')],volunteers=[dict(id='v1',name='Responder',isAvailable=True)]),check('incidentId',7),check('requiresHumanApproval',True),check('actions',op='nonempty')),
                  sample('M1-D02','Incident without available resources',dict(incident_id=8,title='Demo incident',category='General',priority='Medium',affected_count=2,resources=[],volunteers=[]),check('requiresHumanApproval',True),check('reasoning','No available resources found',op='contains'),check('reasoning','No available volunteers found',op='contains'))]),
    dict(number=2,name='M.Thanusikan',student_id='IT24103609',component='Resource and Inventory Management',agent_module='situation_analysis_agent',agent_class='SituationAnalysisAgent',agent_method='run_assessment',
         backend_classes=['ResourcesControllerTests','InventoryControllerTests','SheltersControllerTests','GeolocationServiceTests','SituationAnalysisAgentTests'],agent_codes=['AI04','AI05'],allowlist_agent=None,
         demo_note='Incident priority, inventory, resources and shelters produce urgency and shortage analysis. The current method named nearest_shelter selects the eligible shelter with most available capacity; it does not calculate geographic distance. Backend tests here use InMemory, not PostgreSQL.',
         samples=[sample('M2-D01','Flood with inventory shortages',dict(incident=dict(id=7,title='Flood emergency',priority='High'),inventory=[dict(category='Medical',quantity=20),dict(category='Food',quantity=100)],resources=[dict(resourceType='Vehicle',status='Available')],shelters=[dict(id=1,name='Full shelter',status='Active',totalCapacity=10,currentOccupancy=10),dict(id=2,name='Available shelter',status='Active',totalCapacity=100,currentOccupancy=30)]),check('urgency_score',85),check('nearest_shelter.id',2),check('resource_deficiencies.0.isDeficit',True),check('llm_enhanced',False)),
                  sample('M2-D02','Adequate stock but no shelter capacity',dict(incident=dict(id=8,title='Routine assistance',priority='Low'),inventory=[dict(category='Medical',quantity=50),dict(category='Food',quantity=100)],resources=[dict(resourceType='Vehicle',status='Available') for _ in range(3)],shelters=[dict(id=1,name='Full shelter',status='Active',totalCapacity=10,currentOccupancy=10)]),check('urgency_score',25),check('nearest_shelter',None),check('resource_deficiencies.0.isDeficit',False),check('resource_deficiencies.2.isDeficit',False))]),
    dict(number=3,name='Denesh N',student_id='IT24102826',component='Dispatch and Task Assignment',agent_module='resource_allocation_agent',agent_class='ResourceAllocationAgent',agent_method='allocate_for_incident',
         backend_classes=['DispatchAllocationTests','DispatchesControllerTests','DispatchValidationServiceTests'],agent_codes=['AI03','AI11'],allowlist_agent='ResourceAllocationAgent',
         demo_note='A dispatch requirement, resource pool and available volunteers produce a proposed allocation and shortage list. Human approval is always required; the displayed proposal does not execute a dispatch.',
         samples=[sample('M3-D01','Covered dispatch requirement',dict(incident_id=7,title='Transport request',priority='Medium',required_resources=[dict(resource_type='Vehicle',quantity=1,purpose='Transport')],available_resources=[dict(id=1,name='Response van',resourceType='Vehicle',status='Available')],available_volunteers=[dict(id=101,name='Demo driver',skills='driving',isAvailable=True)]),check('resource_gaps',op='empty'),check('allocated_resources',op='nonempty'),check('allocation_plan.requires_human_approval',True),check('allocation_plan.recommendation','APPROVE')),
                  sample('M3-D02','Insufficient resources for high-priority dispatch',dict(incident_id=8,title='Emergency response',priority='High',available_resources=[],available_volunteers=[]),check('resource_gaps',op='nonempty'),check('allocated_resources',op='empty'),check('allocation_plan.requires_human_approval',True),check('allocation_plan.recommendation','REVISE'))]),
    dict(number=4,name='Deneshkar. P',student_id='IT24103828',component='Volunteer/Responder Management',agent_module='validation_safety_agent',agent_class='ValidationSafetyAgent',agent_method='validate_assignment',
         backend_classes=['VolunteerShiftTests','VolunteersApiIntegrationTests'],agent_codes=['AI06','AI07','AI08','AI09','AI10'],allowlist_agent='ValidationSafetyAgent',
         demo_note='Responder availability and shift windows produce a validation decision, individual checks and violation reasons. An overlapping assignment returns REVISE because it can be rescheduled. APPROVE is an agent recommendation; a coordinator still makes the actual approval.',
         samples=[sample('M4-D01','Available volunteer with valid shift',safety(),check('is_valid',True),check('recommendation','APPROVE'),check('checks.1.passed',True)),
                  sample('M4-D02','Unavailable volunteer',safety(available=False),check('is_valid',False),check('recommendation','REJECT'),check('violations.0.code','V1_VOLUNTEER_UNAVAILABLE')),
                  sample('M4-D03','Overlapping shift requires revision',safety(start='09:30',existing=True),check('is_valid',False),check('recommendation','REVISE'),check('violations.0.code','V2_DOUBLE_BOOKING')),
                  sample('M4-D04','Adjacent shifts do not overlap',safety(existing=True),check('is_valid',True),check('recommendation','APPROVE'),check('checks.1.passed',True))]),
]

def build():
    cases=json.loads((QMS/'submission/test-cases.json').read_text(encoding='utf-8-sig'))
    index=[]
    for definition in definitions:
        config=copy.deepcopy(definition);samples=config.pop('samples');number=config['number']
        folder=QMS/'members'/f'member{number}-{config["student_id"]}';folder.mkdir(parents=True,exist_ok=True)
        backend=[r for r in cases if any(r['feature'].startswith('ERCP.Api.Tests.'+c+'.') for c in config['backend_classes'])]
        agents=[r for r in cases if r['id'].startswith('AI-') and (any(r['feature'].startswith('test_'+code+'_') for code in config['agent_codes']) or (config['allowlist_agent'] and r['feature']==f'test_AI01_unapproved_tool_is_rejected[{config["allowlist_agent"]}]'))]
        assert backend and agents
        config['backend_tests']=[r['feature'] for r in backend];config['agent_tests']=[r['feature'] for r in agents]
        config['expected_backend_count']=len(backend);config['expected_agent_count']=len(agents)
        write_json(folder/'member.json',config);write_json(folder/'agent-inputs.json',samples)
        selection=[]
        for row in backend+agents:
            item=dict(row);item['package_member']=config['name'];item['package_student_id']=config['student_id']
            item['historical_group_result']=dict(status=item.pop('status'),actual=item.pop('actual'),evidence=item.pop('evidence'))
            item['personal_result']='See dated personal results; historical group success is not a personal execution claim.'
            selection.append(item)
        write_json(folder/'test-cases.json',selection)
        source_files=[*(REPO/'backend-tests'/(c+'.cs') for c in config['backend_classes']), QMS/'scripts/test_agents.py',REPO/'ai-agents'/(config['agent_module']+'.py')]
        source_body='<p>Readable source snapshot generated from the canonical files. Runners execute the original files in the project. Paths below are relative to the repository or QMS root; SHA-256 identifies each snapshot.</p>'
        for source in source_files:
            source_body+='<section id="'+esc(source.name)+'"><h2>'+esc(source.name)+'</h2><p>SHA-256: '+hashlib.sha256(source.read_bytes()).hexdigest()+'</p><pre>'+esc(source.read_text(encoding='utf-8-sig'))+'</pre></section>'
        write_html(folder/'Source_Code.html',f'Member {number} - Original test and agent source',source_body)
        body=f'<p><b>{esc(config["name"])} | {config["student_id"]}</b><br>{esc(config["component"])} + {esc(config["agent_class"])}</p><p class="note">{len(backend)} backend cases + {len(agents)} agent cases. These are selections of canonical group tests, not duplicated implementations. Source and expected assertions are below. Results shown as historical are from the group run; open results/&lt;dated run&gt;/results.html for a separate execution.</p>'
        for row in selection:
            source=QMS/'scripts/test_agents.py' if row['id'].startswith('AI-') else REPO/'backend-tests'/(row['feature'].split('.')[3]+'.cs')
            href='Source_Code.html#'+source.name
            body+=f'<section><h2>{row["id"]}: {esc(row["feature"])}</h2><p><a href="{esc(href)}">Original test source</a></p>'
            for label,key in [('Preconditions','preconditions'),('Steps / input','steps'),('Expected assertions','expected')]:
                body+='<h3>'+label+'</h3><pre>'+esc(row[key])+'</pre>'
            body+='<p>Historical group result: '+esc(row['historical_group_result']['status'])+' - '+esc(row['historical_group_result']['actual'])+'</p><p>'+esc(row['personal_result'])+'</p><details><summary>Test implementation and fixture inputs</summary><pre>'+esc(row['source_excerpt'])+'</pre></details></section>'
        write_html(folder/'Test_Cases.html',f'Member {number} - Test cases',body)
        wrapper=f'''param(
  [ValidateSet('practice','personal','ai-assisted')][string]$ExecutionKind = 'practice',
  [string]$Operator = 'Unrecorded'
)
$qmsRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
& python (Join-Path $qmsRoot 'scripts/run_member_tests.py') --member {number} --execution-kind $ExecutionKind --operator $Operator
if ($LASTEXITCODE -ne 0) {{ throw 'Member {number} run failed. See the dated results folder.' }}
'''
        (folder/f'run-member{number}-tests.ps1').write_text(wrapper,encoding='utf-8',newline='\n')
        demo=f'''param([string]$InputFile = '', [string]$Operator = 'Unrecorded', [ValidateSet('practice','personal','ai-assisted')][string]$ExecutionKind = 'practice')
$qmsRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$demoArgs = @((Join-Path $qmsRoot 'scripts/demo_member_agent.py'), '--member', '{number}', '--operator', $Operator, '--execution-kind', $ExecutionKind)
if ($InputFile) {{ $demoArgs += @('--samples', $InputFile) }}
& python @demoArgs
if ($LASTEXITCODE -ne 0) {{ throw 'Agent demonstration failed. Read the actual output and check results.' }}
'''
        (folder/f'demo-member{number}-agent.ps1').write_text(demo,encoding='utf-8',newline='\n')
        personal=('Your earlier guided personal runs (4 controller + 5 HTTP + 3 safety cases) and six screenshots are preserved in [Individual_Evidence_IT24103828.md](../../submission/Individual_Evidence_IT24103828.md). This full package adds the existing safety-agent tool, shelter and stock cases, so its selected count is higher than that earlier 12-case practice. The boundary exercise and own-word answers remain unconfirmed.' if number==4 else 'Your submitted 7 October personal execution is supported by two terminal screenshots and matching raw reports. See [Personal_Execution_Evidence.md](../../submission/Personal_Execution_Evidence.md). Own-word explanations and a changed-input exercise remain pending.')
        readme=f'''# Member {number}: {config['name']} - {config['student_id']}

Business component: **{config['component']}**. Agent: **{config['agent_class']}**.

This folder is your presentation index. Test selection follows component ownership; it does not reassign historical authorship. Existing Git commits remain the source of authorship evidence. Package wrappers and presentation files were prepared with OpenAI Codex assistance.

Open **index.html** in your browser to present the case list and dated test/agent output reports.

Source_Code.html provides readable snapshots of the original test and agent files with hashes, so source links work in both ZIP and repository layouts. The runners execute the original source files, not these presentation snapshots.

## Run your own tests

Requirements: Python with QMS/scripts/requirements.txt installed and a compatible .NET SDK/runtime for the net8.0 test project. From this folder in PowerShell:

```powershell
./run-member{number}-tests.ps1 -ExecutionKind personal -Operator '{config['name']}'
```

Expected selection: **{len(backend)} backend tests + {len(agents)} agent tests = {len(backend)+len(agents)} existing tests**, plus **{len(samples)} agent demonstration scenarios** checked separately. The runner fails on missing, failed or skipped selected tests. These selected backend fixtures use EF Core InMemory/TestServer. No running API or PostgreSQL server is required for this package; real PostgreSQL and full-system evidence remain in the group suite.

Each invocation creates a new results/<execution-kind>-<timestamp>/ folder with results.html, backend.trx, agents.xml, logs, execution.json, agent-inputs.json, agent-output.json and agent-demo.html. Open results.html in your browser and screenshot your actual command and completed results. The personal label is your execution declaration, not proof of understanding. Keep your notes in that dated folder and explain any failures honestly.

## Show your agent input and output

```powershell
./demo-member{number}-agent.ps1 -Operator '{config['name']}'
```

Open the printed agent-demo.html path. It shows every input, actual output, expected checks and observed result. The command calls the actual {config['agent_module']}.py method {config['agent_method']}; outputs are not hardcoded. Live LLM calls are disabled. {config['demo_note']}

The scenarios are editable in agent-inputs.json. To rehearse a change, copy that file, change an input, predict the result and then update the expected checks only when you can justify the new expectation. Run `./demo-member{number}-agent.ps1 -InputFile ./your-practice-inputs.json -Operator '{config['name']}'`. A failed expectation produces a failing exit code and preserves the actual output.

## What to show in the viva

1. Open Test_Cases.html: locate a normal, invalid or boundary case, its input, expected assertions and original source.
2. Run your member command and open its new results.html. Explain expected versus actual results.
3. Open agent-inputs.json, then agent-demo.html: explain what your business component supplies and how your agent reaches its decision.
4. Explain one relevant defect/retest from the group evidence. Do not describe old group results as a new personal run.
5. Change one fixture/input, predict the outcome, execute it and explain the check that passes or fails. Record your own explanation.

## Evidence status

{personal}

Verification labelled ai-assisted was run by Codex to check the package. It is separate from your own results. Member packages are focused demonstrations, not replacements for all 270 automated group cases. Additional scenario checks are not added to the report's 272-record inventory.
'''
        (folder/'README.md').write_text(readme,encoding='utf-8',newline='\n')
        (folder/'results').mkdir(exist_ok=True)
        (folder/'results/README.md').write_text('Dated runs are saved here. ai-assisted = package verification by Codex; personal = declared execution by the named operator; practice = rehearsal. Keep raw reports and screenshots. Do not rename verification runs as personal evidence.\n',encoding='utf-8')
        index.append(dict(member=number,name=config['name'],student_id=config['student_id'],folder=folder.relative_to(QMS).as_posix(),backend=len(backend),agents=len(agents),demo_scenarios=len(samples)))
        refresh_member_index(number)
    write_json(QMS/'members/index.json',index)
    write_html(QMS/'members/index.html','Individual testing and agent demonstrations',
        '<p>Choose your member package. Each includes business-component tests, matching agent inputs and actual outputs, a separate runner and dated results. Verification by Codex is labelled AI-assisted.</p><table><tr><th>Member</th><th>Tests</th><th>Agent scenarios</th></tr>'+''.join(f'<tr><td><a href="{Path(r["folder"]).name}/index.html">{esc(r["name"])} / {r["student_id"]}</a></td><td>{r["backend"]} backend + {r["agents"]} agents</td><td>{r["demo_scenarios"]}</td></tr>' for r in index)+'</table>')
    (QMS/'members/README.md').write_text('# Individual testing and agent demonstrations\n\nEach member has a separate runner, case document, real-agent input/output demonstration and dated results folder. Keep the whole repository or assignment ZIP when using these folders; they reference the actual SEF source.\n\n'+ '\n'.join(f'- [{r["name"]} / {r["student_id"]}]({Path(r["folder"]).name}/README.md): {r["backend"]} backend + {r["agents"]} agent tests; {r["demo_scenarios"]} demonstration scenarios.' for r in index)+'\n\nExisting individual evidence is in ../evidence/individual. New AI-assisted package verification is not personal evidence. All four agents run in deterministic mode.\n',encoding='utf-8',newline='\n')
    print(json.dumps(index,indent=2))

if __name__=='__main__': build()
