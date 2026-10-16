"""Index completed technical comparisons; preserve the student's supplied explanation."""
from pathlib import Path
import json,hashlib
from paths import QMS
from member_support import member_config,write_json,refresh_member_index

EXPLANATION="""The 10:00–11:00 shift passes because the existing shift finishes exactly at 10:00. The new shift starts at 10:00, so the two shifts only touch at the boundary; their working times do not overlap. Therefore, the agent returns APPROVE.
When I change the new shift's start time to 09:30, it overlaps the existing 09:00–10:00 shift for 30 minutes, from 09:30 to 10:00. The agent detects this as double booking. Because the problem can be fixed by changing the shift time, it returns REVISE instead of APPROVE."""
NOTES={
 1:'Removing resources and volunteers causes the planner to report both shortages. Human approval remains true in both outputs. The plan is a proposal, not an independently executed emergency response.',
 2:'Medical stock of 50, food stock of 100 and three available vehicles meet the current fixed baselines. With both shelters full, nearest_shelter is null. Despite its name, this field selects the active shelter with greatest available capacity, not geographic distance. Urgency stays 85 because the High-priority flood incident did not change.',
 3:'The Medium case allocates the available vehicle and has no gaps. The High case uses the current priority-based estimate, replacing the explicit one-vehicle input requirement with two vehicles, two medical resources and two personnel resources. With no resources, each category has a gap of two and the recommendation is REVISE. Human approval remains true. This comparison changes priority and availability together; it does not isolate the effect of each change.',
 4:'The overlap predicate uses half-open intervals: new_start < existing_end and existing_start < new_end. At 10:00 the first comparison is false; at 09:30 both are true. V2_DOUBLE_BOOKING is in the agent\'s revisable violation set, so this available volunteer receives REVISE. Availability alone is not sufficient for approval. APPROVE is only a recommendation; coordinator approval is a separate API operation.'}
rows=[]
for n in range(1,5):
 folder,cfg=member_config(n)
 paths=sorted((folder/'results').glob('changed-*/comparison.json'))
 candidates=[p for p in paths if json.loads(p.read_text())['operator']=='OpenAI Codex']
 path=candidates[-1];record=json.loads(path.read_text())
 assert record['passed'] and len(record['scenarios'])==2
 plan=json.loads((path.parent/'changed-input-plan.json').read_text())
 files={}
 for p in path.parent.iterdir():
  if p.is_file(): files[p.name]={'file':p.relative_to(QMS).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
 rows.append({'member':n,'name':cfg['name'],'student_id':cfg['student_id'],'component':cfg['component'],
              'agent':cfg['agent_class'],'run':path.relative_to(QMS).as_posix(),'operator':record['operator'],
              'started_at':record['execution_started_at'],'change':plan['change'],'prediction':plan['expected_prediction'],
              'interpretation':NOTES[n],'passed':2,'personal_execution_confirmed':False,'files':files})
 command=f".\\run-member{n}-changed-input.ps1 -ExecutionKind personal -Operator '{cfg['name']}'"
 guide=f"""# Member {n} changed-input demonstration and viva guide

{cfg['name']} | {cfg['student_id']} | {cfg['component']} + {cfg['agent_class']}

Two technical comparison scenarios passed on 8 October 2026 with OpenAI Codex as operator. This guide and that run do not establish your personal execution.

## Run your own comparison

Open PowerShell in `QMS/members/{folder.name}`. Read `changed-inputs.json`. Before running, write your own prediction in a copy of `Personal_Demonstration_Template.md`. The supplied prediction is study guidance, not your recorded answer.

```powershell
{command}
```

The command prints a new dated `results/changed-.../comparison.html` path. Open it to inspect original/changed inputs and expected/actual checks. Full JSON and the complete command/output transcript are linked there. Save your own `Understanding.md` and terminal screenshot in that new results folder. Keep the command visible; take additional screenshots if the output needs scrolling. Record failures and retests honestly.

## Exact change

{plan['change']}

## Expected behaviour and verified technical interpretation

{plan['expected_prediction']}

{NOTES[n]}

## Explain it yourself

- Which input fields changed, and which stayed fixed?
- What did you predict before execution? Which actual JSON fields prove the result?
- Which source condition or assertion checks the business rule?
- What do these deterministic agent checks establish, and what still needs API/database or live-service testing?

The examiner assesses your explanation. This guide supplies learning material; it is not a signed or completed member reflection.
"""
 (folder/'Viva_Changed_Input_Guide.md').write_text(guide,encoding='utf-8')
 refresh_member_index(n)

folder,_=member_config(4)
explanation_path=folder/'Understanding_Submitted_20261008.md'
explanation_path.write_text('# Deneshkar submitted explanation\n\nDeneshkar. P | IT24103828\n\n'
 'Received through the conversation on 8 October 2026, Asia/Colombo. The following answer is preserved verbatim. '
 'It is a submitted written explanation; it does not establish a new personal run or completion of the assessed viva.\n\n'+
 EXPLANATION+'\n\n## Execution status\n\nThe existing 12-test personal evidence remains confirmed. '
 'The two new changed-input scenarios were executed by OpenAI Codex. Deneshkar still needs to run '
 '`run-member4-changed-input.ps1` personally and save his own command/output screenshot and dated report.\n',encoding='utf-8')

manifest={'recorded_date':'2026-10-08','timezone':'Asia/Colombo','members':rows,
          'deneshkar_explanation':{'file':explanation_path.relative_to(QMS).as_posix(),
                                  'sha256':hashlib.sha256(explanation_path.read_bytes()).hexdigest(),'text':EXPLANATION},
          'unique_group_tests_unchanged':270,'inventory_records_unchanged':272,
          'technical_scenarios_passed':8,'personal_changed_input_completion_confirmed':False,
          'new_terminal_screenshots':'Not captured. Browser capture unavailable; actual commands, input, output and logs are retained.'}
write_json(QMS/'members/changed-input-evidence.json',manifest)
content='# Changed-input execution evidence\n\nEight technical scenarios passed on 8 October 2026. Operator: OpenAI Codex. '
content+='Each member must still perform their own comparison. Deneshkar supplied a written explanation, retained verbatim below. '
content+='No new terminal screenshot or personal completion is claimed. The actual full command, input and output are retained in execution.log.\n\n'
for r in rows:
 base='../'+str(Path(r['run']).parent).replace('\\','/')
 content+=f"## Member {r['member']} — {r['name']}\n\n{r['change']}\n\nExpected: {r['prediction']}\n\nObserved: {r['interpretation']}\n\nResult: 2/2 PASS. Operator: {r['operator']}. Started: {r['started_at']}.\n\n[Comparison report]({base}/comparison.html) | [Full command and output]({base}/execution.log) | [Raw JSON]({base}/comparison.json)\n\n"
content+='## Deneshkar’s submitted explanation\n\n'+EXPLANATION+'\n\nWritten explanation received; new personal execution pending. The comparison does not increase the 270 group tests or 272 inventory records.\n'
(QMS/'submission/Changed_Input_Results.md').write_text(content,encoding='utf-8')
print('Indexed 4 technical runs, 8 passing scenarios and Deneshkar\'s submitted written explanation.')
