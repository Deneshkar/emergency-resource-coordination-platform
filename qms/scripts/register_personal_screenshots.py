"""Register the six supplied 7 October images against their existing raw runs."""
from pathlib import Path
import hashlib, json, shutil, xml.etree.ElementTree as ET
from paths import QMS, REPO

captures = Path('C:/Users/USER/Pictures/Screenshots')
selection = [
    (1, 'IT24103355', 'personal-20261007-162459-058365', ['162521', '162536']),
    (2, 'IT24103609', 'personal-20261007-162642-902561', ['162652', '162745']),
    (3, 'IT24102826', 'personal-20261007-162757-690323', ['162808', '162821']),
]
manifest = dict(provided_on='2026-10-07', timezone='Asia/Colombo',
    provenance='User-supplied terminal screenshots, visually matched to local original PNGs and copied unchanged. Operator names are declared in the commands and execution records. Understanding is recorded separately.', members=[])
for number, student_id, run_name, times in selection:
    folder=QMS/f'members/member{number}-{student_id}'
    run=folder/'results'/run_name
    execution=json.loads((run/'execution.json').read_text())
    config=json.loads((folder/'member.json').read_text())
    assert execution['passed'] and execution['execution_kind']=='personal'
    assert execution['student_id']==student_id and execution['operator']==config['name']
    trx=ET.parse(run/'backend.trx').getroot()
    results=[x for x in trx.iter() if x.tag.endswith('}UnitTestResult')]
    assert len(results)==config['expected_backend_count']
    assert {x.attrib['testName'] for x in results}==set(config['backend_tests'])
    assert all(x.attrib['outcome']=='Passed' for x in results)
    agents=list(ET.parse(run/'agents.xml').getroot().iter('testcase'))
    assert {x.attrib['name'] for x in agents}==set(config['agent_tests'])
    assert all(not any(x.find(t) is not None for t in ('failure','error','skipped')) for x in agents)
    demo=json.loads((run/'agent-output.json').read_text())
    assert demo['passed'] and len(demo['scenarios'])==2 and all(s['passed'] for s in demo['scenarios'])
    for name, sha in execution['source_hashes'].items():
        assert hashlib.sha256((REPO/name).read_bytes()).hexdigest()==sha
    entry=dict(member=number,name=config['name'],student_id=student_id,
        execution=(run/'execution.json').relative_to(QMS).as_posix(),started_at=execution['started_at'],
        operator=execution['operator'],backend=len(results),agents=len(agents),demo_scenarios=2,
        status='Submitted personal execution supported by screenshots and raw reports; understanding pending',
        screenshots=[],reports={})
    for i,t in enumerate(times,1):
        source=captures/f'Screenshot 2026-10-07 {t}.png'
        target=run/('01-backend-tests.png' if i==1 else '02-agent-tests-and-summary.png')
        shutil.copy2(source,target)
        assert target.read_bytes()==source.read_bytes()
        entry['screenshots'].append(dict(file=target.relative_to(QMS).as_posix(),source_filename=source.name,
            title='Backend command and passing cases' if i==1 else 'Agent tests and completed run summary',
            sha256=hashlib.sha256(target.read_bytes()).hexdigest()))
    for name in ['execution.json','backend.trx','agents.xml','backend.log','agents.log','agent-inputs.json','agent-output.json','agent-demo.html','results.html']:
        entry['reports'][name]=dict(file=(run/name).relative_to(QMS).as_posix(),sha256=hashlib.sha256((run/name).read_bytes()).hexdigest())
    manifest['members'].append(entry)
    note=[f'# {config["name"]} / {student_id} personal execution evidence', '',
          f'Started: {entry["started_at"]}. Declared operator: {entry["operator"]}.', '',
          f'Raw reports confirm {entry["backend"]} backend and {entry["agents"]} agent tests passed, with no failures or skips. Two agent demonstration scenarios also passed.', '',
          'The two screenshots were supplied on 7 October 2026 and preserved unchanged. They show terminal execution, not browser captures of results.html or agent-demo.html. Those generated HTML reports and their JSON inputs/outputs are included in the same folder.', '',
          'Own-word explanations and a changed-input exercise remain pending. These are reruns of existing cases and do not increase the group totals.', '']
    for shot in entry['screenshots']:
        note += [f'![{shot["title"]}]({Path(shot["file"]).name})', '']
    (run/'Screenshot_Evidence.md').write_text('\n'.join(note),encoding='utf-8')
(QMS/'members/personal-evidence.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
lines=['# Personal execution evidence received 7 October 2026','','Six original screenshots are matched to three dated member runs. Raw TRX/XML and agent JSON reports confirm the outcomes below. The operator is the name declared in the supplied command; these records do not establish independent understanding.','',
       '| Member | Backend passed | Agent passed | Separate demos passed | Results |','|---|---:|---:|---:|---|']
for e in manifest['members']:
    base='../'+str(Path(e['execution']).parent).replace('\\','/')
    lines.append(f'| {e["name"]} / {e["student_id"]} | {e["backend"]} | {e["agents"]} | 2 | [Results]({base}/results.html) / [Screenshots]({base}/Screenshot_Evidence.md) / [Agent output]({base}/agent-demo.html) |')
lines += ['', 'These three selections total 54 passing existing tests and six separate demonstration scenarios. Deneshkar\'s earlier 12-test personal evidence remains in Individual_Evidence_IT24103828.md. Group totals remain 270 automated cases and 272 inventory records.', '',
          'Each member still needs to complete their own Understanding.md, explain an assertion and predict, run and explain a changed-input scenario. Browser screenshots of results.html and agent-demo.html were not supplied in this batch; the actual HTML/JSON output is retained.', '',
          'Screenshot and report SHA-256 hashes: ../members/personal-evidence.json.', '']
(QMS/'submission/Personal_Execution_Evidence.md').write_text('\n'.join(lines),encoding='utf-8')
print(json.dumps({'members':len(manifest['members']),'screenshots':6,'passed_tests':54,'passed_demos':6}))
