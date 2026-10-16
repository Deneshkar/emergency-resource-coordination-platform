"""Run one member's existing test selection and actual agent demonstrations."""
import argparse
import hashlib
import json
import os
import subprocess
import sys
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path
from paths import QMS, REPO
from member_support import member_config, write_json, write_html, esc, refresh_member_index
from demo_member_agent import execute

def run(number, execution_kind, operator):
    folder, config = member_config(number)
    destination = folder/'results'/(execution_kind+'-'+datetime.now().strftime('%Y%m%d-%H%M%S-%f'))
    destination.mkdir(parents=True)
    env = dict(os.environ, DOTNET_ENVIRONMENT='Testing', ASPNETCORE_ENVIRONMENT='Testing',
               GEMINI_API_KEY='', SMTP_USER=' ', SMTP_PASS=' ', DATABASE_URL=' ',
               PYTHONIOENCODING='utf-8', PYTEST_ADDOPTS='')
    results = dict(member=config['name'], student_id=config['student_id'], execution_kind=execution_kind,
                   operator=operator, started_at=datetime.now().astimezone().isoformat(),
                   note='Runs existing selected tests. Personal label is the operator declaration, not proof of independent understanding.',
                   commands=[], suites={}, passed=False)
    def command(name, args):
        print(f'Running {name}: {subprocess.list2cmdline(args)}', flush=True)
        with (destination/(name+'.log')).open('w', encoding='utf-8', newline='\n') as log:
            proc = subprocess.Popen(args, cwd=REPO, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                    text=True, encoding='utf-8', errors='replace')
            for line in proc.stdout:
                log.write(line)
                print(line, end='', flush=True)
            code = proc.wait()
        results['commands'].append(dict(name=name, args=args, exit_code=code))
        if code: raise RuntimeError(f'{name} failed with exit code {code}; see {name}.log')
    try:
        filters = '|'.join('FullyQualifiedName~ERCP.Api.Tests.'+c+'.' for c in config['backend_classes'])
        command('backend', ['dotnet','test',str(REPO/'backend-tests/ERCP.Api.Tests.csproj'),'--filter',filters,
                           '--logger','trx;LogFileName=backend.trx','--logger','console;verbosity=normal',
                           '--results-directory',str(destination)])
        root=ET.parse(destination/'backend.trx').getroot();ns={'t':root.tag.split('}')[0][1:]}
        counters=root.find('.//t:Counters',ns).attrib
        backend=[dict(name=r.attrib['testName'],status=r.attrib['outcome']) for r in root.findall('.//t:UnitTestResult',ns)]
        expected_backend=set(config['backend_tests'])
        if set(r['name'] for r in backend)!=expected_backend:
            raise RuntimeError('Backend selection differs from Test_Cases.html. Rebuild member packages after reviewing changes.')
        if int(counters['total'])!=len(backend) or len(backend)!=len(expected_backend) or any(r['status']!='Passed' for r in backend):
            raise RuntimeError('Backend report contains missing, failed or skipped tests.')
        results['suites']['backend']=backend
        agent_nodes=[str(QMS/'scripts/test_agents.py')+'::'+name for name in config['agent_tests']]
        command('agents',[sys.executable,'-m','pytest',*agent_nodes,'-v','--junitxml='+str(destination/'agents.xml')])
        root=ET.parse(destination/'agents.xml').getroot()
        cases=list(root.iter('testcase'))
        if set(c.attrib['name'] for c in cases)!=set(config['agent_tests']) or len(cases)!=len(config['agent_tests']):
            raise RuntimeError('Agent selection differs from the member test-case list.')
        if any(list(c) for c in cases):
            # Captured stdout may appear as a child; only failure/error/skipped rejects a case.
            if any(c.find(tag) is not None for c in cases for tag in ('failure','error','skipped')):
                raise RuntimeError('Agent report contains failed or skipped tests.')
        results['suites']['agents']=[dict(name=c.attrib['name'],status='Passed') for c in cases]
        demo=execute(number,destination,execution_kind=execution_kind,operator=operator)
        results['demo_scenarios']=len(demo['scenarios'])
        if not demo['passed']: raise RuntimeError('An agent demonstration expectation failed.')
        results['passed']=True
    except Exception as exc:
        results['error']=f'{type(exc).__name__}: {exc}'
        print(results['error'],flush=True)
    results['finished_at']=datetime.now().astimezone().isoformat()
    results['source_hashes']={p.relative_to(REPO).as_posix():hashlib.sha256(p.read_bytes()).hexdigest()
                              for p in [*(REPO/'backend-tests'/(c+'.cs') for c in config['backend_classes']),
                                        REPO/'ai-agents'/(config['agent_module']+'.py')]}
    results['test_script_sha256']=hashlib.sha256((QMS/'scripts/test_agents.py').read_bytes()).hexdigest()
    write_json(destination/'execution.json',results)
    status='PASS' if results['passed'] else 'FAIL'
    body=f'<p><b>{esc(config["name"])} | {esc(config["student_id"])}</b></p><p class="note">Execution: {esc(execution_kind)}. Operator: {esc(operator)}.<br>{esc(results["started_at"])}<br>{esc(results["note"])}</p><h2>{status}</h2>'
    links=['<a href="../../Test_Cases.html">Member test cases</a>']
    for filename,label in [('agent-demo.html','Agent input/output demo'),('execution.json','Execution record'),('backend.trx','Backend TRX'),('agents.xml','Agent XML')]:
        if (destination/filename).exists(): links.append(f'<a href="{filename}">{label}</a>')
    body+='<p>'+' | '.join(links)+'</p>'
    if results.get('error'): body+='<p class="fail">'+esc(results['error'])+'</p>'
    for area, cases in results['suites'].items():
        body+='<h2>'+esc(area)+' - '+str(len(cases))+' tests</h2><table><tr><th>Test</th><th>Actual result</th></tr>'
        body+=''.join('<tr><td>'+esc(r['name'])+'</td><td>'+esc(r['status'])+'</td></tr>' for r in cases)+'</table>'
    write_html(destination/'results.html',f'Member {number} - Test results',body)
    refresh_member_index(number)
    print(f'{status}: {destination / "results.html"}',flush=True)
    return results['passed']

if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--member',type=int,choices=range(1,5),required=True)
    parser.add_argument('--execution-kind',choices=['practice','personal','ai-assisted'],default='practice')
    parser.add_argument('--operator',default='Unrecorded')
    args=parser.parse_args()
    if args.execution_kind=='personal' and args.operator=='Unrecorded': parser.error('Supply --operator with the actual person running the tests.')
    sys.exit(0 if run(args.member,args.execution_kind,args.operator) else 1)
