"""Register supplied 8 October terminal screenshots against their saved personal runs."""
from pathlib import Path
import json,hashlib,shutil
from datetime import datetime
from paths import QMS,REPO
from member_support import member_config,write_json,refresh_member_index

selection=[(1,'105202-730954','105215'),(2,'105229-627673','105235'),
           (3,'105250-078618','105258'),(4,'105128-171178','105143')]
members=[]
for number,stamp,shot in selection:
    folder,cfg=member_config(number)
    run=folder/'results'/('changed-20261008-'+stamp)
    record=json.loads((run/'comparison.json').read_text())
    assert record['execution_kind']=='personal' and record['operator']==cfg['name']
    assert record['student_id']==cfg['student_id'] and record['passed']
    assert len(record['scenarios'])==2 and all(s['passed'] and all(c['passed'] for c in s['checks']) for s in record['scenarios'])
    source=REPO/'ai-agents'/(cfg['agent_module']+'.py')
    assert hashlib.sha256(source.read_bytes()).hexdigest()==record['agent_sha256']
    prediction=json.loads((run/'prediction-before-run.json').read_text())
    assert datetime.fromisoformat(prediction['recorded_before_execution'])<=datetime.fromisoformat(record['generated_at'])
    original=Path('C:/Users/USER/Pictures/Screenshots')/f'Screenshot 2026-10-08 {shot}.png'
    target=run/'personal-terminal-results.png'
    shutil.copy2(original,target)
    files={}
    for p in run.iterdir():
        if p.is_file() and p.name!='Screenshot_Evidence.md':
            files[p.name]={'file':p.relative_to(QMS).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
    entry={'member':number,'name':cfg['name'],'student_id':cfg['student_id'],'operator':record['operator'],
           'started_at':record['execution_started_at'],'run':(run/'comparison.json').relative_to(QMS).as_posix(),
           'screenshot':files[target.name],'files':files,'passed':2,'failed':0,
           'status':'Submitted personal execution supported by supplied terminal screenshot and matching raw records',
           'written_explanation':'Received 8 October; retained verbatim' if number==4 else 'Pending member response'}
    members.append(entry)
    (run/'Screenshot_Evidence.md').write_text(f"# {cfg['name']} personal changed-input screenshot\n\nDeclared operator: {record['operator']}. Started: {record['execution_started_at']}. Two scenarios passed. Original user-supplied screenshot is preserved unchanged.\n\n![Personal command and results](personal-terminal-results.png)\n\n[Comparison report](comparison.html) | [Raw output](comparison.json) | [Full transcript](execution.log)\n\nThe prepared prediction in the run is supplied guidance; it is not treated as a separately authored member explanation.\n",encoding='utf-8')
    refresh_member_index(number)
manifest={'provided_on':'2026-10-08','timezone':'Asia/Colombo','members':members,'scenarios_passed':8,
          'provenance':'User-supplied screenshots visually matched to original local PNGs and dated raw personal execution reports. Operator identities are declared in the commands and records. Written explanations and viva assessment are separate.'}
write_json(QMS/'members/personal-changed-input-evidence.json',manifest)
text='# Personal changed-input execution evidence\n\nAll four supplied terminal screenshots match the dated personal runs on 8 October 2026: two scenarios passed per member, eight in total. These repeat the comparison scenarios and do not increase the 270 unique group tests or 272 inventory records.\n\n'
text+='| Member | Started (Asia/Colombo) | Passed | Evidence | Written explanation |\n|---|---|---|---|---|\n'
for m in members:
    directory=Path(m['run']).parent.as_posix()
    text+=f"| {m['name']} / {m['student_id']} | {m['started_at']} | 2/2 | [Screenshot and raw reports](../{directory}/Screenshot_Evidence.md) | {m['written_explanation']} |\n"
text+='\n## What remains\n\nMembers 1-3 should submit their own explanation of what changed, their expectation, the actual result and the relevant assertion/business rule. Deneshkar already supplied his boundary/overlap explanation. Prepared predictions in the saved files were supplied as guidance; no unsubmitted personal prediction is inferred. All members should practise explaining the evidence for the viva. The official CLEAR format is still required.\n'
(QMS/'submission/Personal_Changed_Input_Evidence.md').write_text(text,encoding='utf-8')
print('Verified and registered four unchanged screenshots and eight passing personal comparison scenarios.')
