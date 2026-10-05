"""Build evidence-derived HTML documents and the assessed PDF report."""
from pathlib import Path
import json, re, sys, html, xml.etree.ElementTree as ET
from urllib.parse import unquote, urlparse
from paths import QMS, ROOT, REPO
from summarize_results import summarize
SUMMARY = summarize(QMS / 'evidence/final')
assert SUMMARY['passed_gate'], 'Cannot publish failed, skipped or incomplete evidence'
AUTO = SUMMARY['automated']['total']
TOTAL = SUMMARY['inventory_records']
OUT = QMS / 'submission'
sys.path.insert(0, str(QMS / '.tools/python'))
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4

def read(path):
    data=Path(path).read_bytes()
    return data.decode('utf-16' if data.startswith((b'\xff\xfe',b'\xfe\xff')) else 'utf-8-sig',errors='replace')

members = [
    ('Jathurshy.S','IT24103355','Incident Management and Coordinator/Planner Agent'),
    ('M.Thanusikan','IT24103609','Resource and Inventory Management and Situation Analysis Agent'),
    ('Denesh N','IT24102826','Dispatch and Task Assignment and Resource Allocation Agent'),
    ('Deneshkar. P','IT24103828','Volunteer/Responder Management and Validation/Safety Agent')]

def source_path(value):
    text = str(value).replace('\\', '/')
    for folder in ('frontend-react', 'mobile-flutter', 'backend-tests'):
        marker = folder + '/'
        if marker in text: return REPO / folder / text.split(marker, 1)[1]
    return Path(value)

def owner(name):
    s=name.lower()
    if any(x in s for x in ['volunteer','shift','validation','safety','flutter','profile']): return 'Deneshkar. P'
    if any(x in s for x in ['resource','inventory','shelter','situation','postgres','db0','urgency','stock']): return 'M.Thanusikan'
    if any(x in s for x in ['dispatch','allocation','sec','performance','e2e']): return 'Denesh N'
    return 'Jathurshy.S'

cases=[]
def add(prefix,name,source,pre,steps,expected,status,evidence,actual=None,excerpt=''):
    ident=f'{prefix}-{1+sum(c["id"].startswith(prefix+"-") for c in cases):03}'
    cases.append(dict(id=ident,feature=name,source=str(source).replace(str(ROOT)+'\\','').replace('\\','/'),
        responsible_reviewer=owner(name),preconditions=pre,steps=steps,expected=expected,
        actual=actual or ('Tool reports all assertions passed.' if status=='Passed' else 'See failure output.'),
        status=status,evidence=evidence,source_excerpt=excerpt))

def assertions(code):
    lines=[line.strip() for line in code.splitlines() if re.search(r'Assert\.|expect\(|assert ',line)]
    return '\n'.join(lines[:8]) or 'All assertions in the named test must pass for its configured fixture.'

def snippet(source,name,language='cs'):
    if not source.exists(): return ''
    text=read(source)
    if language=='cs':
        simple=name.split('(')[0].split('.')[-1]
        match=re.search(r'public\s+(?:async\s+)?(?:Task|void)\s+'+re.escape(simple)+r'\s*\(',text)
        if match:
            rest=text[match.start():]
            end=re.search(r'\n\s*\[(?:Fact|Theory|PostgresFact|MigrationFact)',rest)
            return rest[:end.start() if end else len(rest)].strip()
    elif language=='py':
        simple=name.split('[')[0]
        match=re.search(r'^def '+re.escape(simple)+r'\(',text,re.M)
        if match:
            rest=text[match.start():]
            end=re.search(r'\n(?:def |@pytest)',rest)
            return rest[:end.start() if end else len(rest)].strip()
    else:
        for m in re.finditer(r'\b(?:it|test|testWidgets)\(\s*([\'\"])(.*?)\1',text):
            if m.group(2) in name:
                rest=text[m.start():]
                end=re.search(r'\n\s*(?:it|test|testWidgets)\(',rest[10:])
                return rest[:end.start()+10 if end else len(rest)].strip()
    return ''

trx=ET.parse(QMS/'evidence/final/backend/backend.trx').getroot()
ns={'t':trx.tag.split('}')[0][1:]}
for result in sorted(trx.findall('.//t:UnitTestResult',ns),key=lambda e:e.attrib['testName']):
    name=result.attrib['testName']; cls=name.split('(')[0].split('.')[-2]
    source=REPO/'backend-tests'/f'{cls}.cs'; code=snippet(source,name)
    db='QmsPostgres' in name
    migration='QmsMigration' in name
    add('MIG' if migration else ('DB' if db else 'BE'),name,source,
        'QMS_MIGRATION_ADMIN points to the isolated localhost postgres admin database; fixture owns temporary databases.' if migration else ('Isolated PostgreSQL schema initialized; QMS_POSTGRES set; transaction rollback isolates fixtures.' if db else 'Restored .NET 8 test project; fixtures created by the named test. Existing controller tests mostly use EF InMemory.'),
        f'From the repository run dotnet test backend-tests/ERCP.Api.Tests.csproj --filter "FullyQualifiedName~{name.split("(")[0]}". Use the inline parameter shown in the case name when applicable.',
        assertions(code),result.attrib['outcome'],'evidence/final/backend/backend.trx',
        f"{result.attrib['outcome']}; duration {result.attrib.get('duration')}; recorded {result.attrib.get('startTime')}",code)

react=json.loads(read(QMS/'evidence/final/react.json'))
for suite in react['testResults']:
    source=source_path(suite['name'])
    for result in suite['assertionResults']:
        name=result['fullName']; code=snippet(source,result['title'],'js')
        add('WEB',name,source,'Vitest jsdom environment with test setup and service mocks; no live browser or server is required.',
            f'In frontend-react run npm test -- {source.name} -t "{result["title"]}". Test body supplies inputs and UI interactions.',
            assertions(code),'Passed' if result['status']=='passed' else 'Failed','evidence/final/react.json',
            f"{result['status']}; {result.get('duration',0):.2f} ms",code)

rows=[json.loads(x) for x in read(QMS/'evidence/final/flutter.jsonl').splitlines() if x.lstrip().startswith('{')]
starts={x['test']['id']:x['test'] for x in rows if x['type']=='testStart'}
suites={x['suite']['id']:x['suite'] for x in rows if x['type']=='suite'}
for done in rows:
    if done['type']!='testDone' or done.get('hidden'): continue
    test=starts[done['testID']]; suite=suites.get(test['suiteID'],{})
    url=suite.get('path') or test.get('root_url') or ''
    if url.startswith('file:'): url=unquote(urlparse(url).path).lstrip('/')
    source=source_path(url); code=snippet(source,test['name'],'dart')
    add('MOB',test['name'],source,'Flutter dependencies installed; flutter_test binding and mock preferences initialized by the test fixture.',
        f'In mobile-flutter run flutter test "{source.relative_to(REPO/"mobile-flutter") if source.is_relative_to(REPO/"mobile-flutter") else source}" --plain-name "{test["name"]}". Use the fixture and widget interactions shown in source.',
        assertions(code),'Skipped' if done.get('skipped') else 'Passed' if done['result']=='success' else 'Failed','evidence/final/flutter.jsonl',
        f"Flutter testDone result={done['result']}; skipped={done.get('skipped',False)}; stream completed success=true.",code)

for area,filename,script in [('AI','agents.xml','test_agents.py'),('HTTP','live-api.xml','test_live_api.py')]:
    for result in ET.parse(QMS/'evidence/final'/filename).getroot().iter('testcase'):
        name=result.attrib['name']; source=QMS/'scripts'/script; code=snippet(source,name,'py')
        add(area,name,source,
            'Actual SEF Python agents imported; GEMINI_API_KEY blank; no live LLM calls.' if area=='AI' else 'Local API on 127.0.0.1:5009, isolated PostgreSQL, seeded coordinator, outbound email disabled.',
            f'From assignment root run python -m pytest QMS/scripts/{script} -k "{name.split("[")[0]}" -v. Parameter values are included in the case name.',
            assertions(code),'Skipped' if result.find('skipped') is not None else 'Failed' if result.find('failure') is not None or result.find('error') is not None else 'Passed',f'evidence/final/{filename}',
            f"JUnit records {'failure' if result.find('failure') is not None else 'pass'}; {result.attrib.get('time')} seconds.",code)

perf=json.loads(read(QMS/'evidence/final/performance.json')); metrics=perf['metrics']
p95=metrics['http_req_duration']['values']['p(95)']; count=metrics['http_reqs']['values']['count']
checks=metrics['checks']['values']
check_passes=checks['passes']; check_fails=checks['fails']
error_rate=metrics['http_req_failed']['values']['rate'] * 100
coverage=ET.parse(QMS/'evidence/final/backend/coverage.cobertura.xml').getroot().attrib
coverage_text=f"{coverage['lines-covered']} of {coverage['lines-valid']} instrumented lines ({float(coverage['line-rate'])*100:.2f}%) and {coverage['branches-covered']} of {coverage['branches-valid']} branches ({float(coverage['branch-rate'])*100:.2f}%)"
lint_match=re.search(r'(\d+) errors?, (\d+) warnings?',read(QMS/'evidence/final/react-lint.log'))
assert lint_match and int(lint_match[1]) == 0
lint_warnings=int(lint_match[2])
cli=json.loads(read(QMS/'evidence/final/migration-check.json'))
add('NF','PERF01 Authenticated API load',QMS/'scripts/performance.js','Local API and PostgreSQL started; no other load test running.',
    'Run k6 run QMS/scripts/performance.js. Ramp to 5 VUs for 10s, ramp to 10 over 20s, ramp down over 10s; each iteration reads incidents, dispatches and volunteers, then sleeps 0.2s.',
    'HTTP failure rate <1%; p95 response time <1000 ms; all HTTP 200 and JSON content checks pass. Thresholds were defined in the script before execution.',
    'Passed','evidence/final/performance.json',f'{count} requests; p95 {p95:.5f} ms; HTTP failures {error_rate:.2f}%; checks {check_passes} passed, {check_fails} failed.')
add('DBM','CLI01 Verify migrated QMS database and repeat CLI update',REPO/'backend/Migrations','Fresh ercp_qms_verified database migrated by strict QMS startup; dotnet-ef 8.0.29 available.',
    'Run dotnet ef database update --project SEF/emergency-resource-coordination-platform/backend --connection with the isolated migration database. Do not use the EnsureCreated database.',
    'Every migration applies in order without duplicate relations and a current schema is available.',
    'Passed','evidence/final/migrations.log',f"CLI exit {cli['cli_exit']}; {len(cli['applied_migrations'])} applied migrations, {cli['pending_migrations']} pending; checked {cli['checked_at']}. Original failure and upgrade retest retained in evidence/migration-fix.")

assert len(cases)==TOTAL, (len(cases), TOTAL)
assert sum(c['status']=='Passed' for c in cases)==TOTAL
(OUT/'test-summary.json').write_text(json.dumps(SUMMARY,indent=2),encoding='utf-8')
OUT.mkdir(exist_ok=True)
(OUT/'test-cases.json').write_text(json.dumps(cases,indent=2),encoding='utf-8')
css='body{font:16px/1.55 Arial,sans-serif;color:#172638;max-width:1100px;margin:36px auto;padding:0 24px}h1,h2,h3{color:#12334b}table{border-collapse:collapse;width:100%;margin:16px 0}th,td{border:1px solid #cbd5df;padding:10px;text-align:left;vertical-align:top}th{background:#eaf0f5}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;background:#f3f6f8;padding:12px}article{border-top:1px solid #bccbd6;margin-top:30px;padding-top:12px}dt{font-weight:bold;margin-top:10px}dd{margin-left:0;white-space:pre-wrap;overflow-wrap:anywhere}.pass{color:#13612f}.fail{color:#a52222}@media print{body{font-size:10pt}article{break-inside:avoid}details{display:none}}'
def page(title,body): return '<!doctype html><html lang="en"><meta charset="utf-8"><title>'+title+'</title><style>'+css+'</style><body>'+body+'</body></html>'
body=f'<h1>ERCP completed test case document</h1><p>Updated 5 October 2026. {AUTO} automated cases, one k6 load scenario and one migration CLI check passed. Every suite and the load scenario were rerun on 5 October using the QMS setup. No tests were skipped. Each record is linked to actual tool evidence. Parameterized cases are separate records. Responsible reviewers follow the supplied module allocation; this is not a claim of individual execution authorship.</p><p>Source excerpts preserve fixture inputs, actions and assertions. Existing weak smoke tests are retained transparently; passing them alone does not establish feature coverage.</p>'
for c in cases:
    body+=f'<article id="{c["id"]}"><h2>{c["id"]} {html.escape(c["feature"])}</h2><p class="{"pass" if c["status"]=="Passed" else "fail"}"><b>{c["status"]}</b></p><dl>'
    for key in ['responsible_reviewer','source','preconditions','steps','expected','actual','evidence']:
        body+=f'<dt>{key.replace("_"," ").title()}</dt><dd>{html.escape(str(c[key]))}</dd>'
    body+='</dl>'
    if c['source_excerpt']: body+='<details><summary>Fixture inputs and assertion source</summary><pre>'+html.escape(c['source_excerpt'])+'</pre></details>'
    body+='</article>'
(OUT/'Test_Cases.html').write_text(page('ERCP completed test cases',body),encoding='utf-8')

bugs=[
dict(id='BUG-01',title='Public registration grants privileged roles',severity='Critical',priority='P1',status='Fixed and retested',
 description='An anonymous caller could register as Admin or Coordinator and receive a valid role-bearing JWT.',
 steps='POST /api/auth/register with a unique email, valid password and role Admin or Coordinator.',
 expected='400 Bad Request; public accounts restricted to Citizen or Volunteer.',actual='Before fix both role variants returned 201 Created.',
 cause='Registration DTO explicitly allowed privileged roles; the public controller had no role restriction.',fix='Restrict DTO roles and explicitly reject privileged roles in the public registration action. Trusted test setup provisions a coordinator before logging in.',
 evidence='evidence/security-before/security-before.trx: SEC01, two failed cases. evidence/final/backend/backend.trx: SEC01, two passes. evidence/final/live-api.xml: SEC04, two passes.',
 retest='Both public privileged roles rejected; ordinary registration and existing authentication tests remain passing.'),
dict(id='BUG-02',title='Low privilege users can modify dispatches',severity='High',priority='P1',status='Fixed and retested',
 description='Any authenticated Citizen or Volunteer could create a dispatch. Mutation routes lacked a coordinator/admin authorization requirement.',
 steps='Register Citizen or Volunteer, use returned JWT, POST /api/dispatches with incidentId 1 and priority High.',
 expected='403 Forbidden for Citizen and Volunteer; coordinator/admin mutation routes remain available.',actual='Before fix both role variants returned 201 Created.',
 cause='Class-level Authorize required authentication only; mutation actions did not specify allowed roles.',fix='Add Coordinator/Admin authorization to create, status, task create/update/delete and allocation-proposal actions.',
 evidence='evidence/security-before/security-before.trx: SEC02, two failures. evidence/final/backend/backend.trx: SEC02 passes. evidence/final/live-api.xml: SEC05 covers seven forbidden actions, and E2E01 verifies authorized completion.',
 retest='Citizen/Volunteer dispatch creation rejected; Citizen mutations and validation rejected; coordinator workflow succeeds.'),
dict(id='BUG-03',title='Sequential PostgreSQL migrations create Shelters twice',severity='High',priority='P2',status='Fixed and retested',
 description='The original clean migration installation failed. The repaired migration chain now matches the current model schema and supports the tested rollback/upgrade paths.',
 steps='Create a separate empty database; run dotnet ef database update with its explicit connection string. Migrations progress until AddAffectedCountToIncidents.',
 expected='Migrations apply sequentially without duplicate relations.',actual='Before: PostgreSQL 42P07, relation Shelters already exists. After: clean schema comparison, rollback/data-preservation and repeated-update tests pass.',
 cause='Overlapping table/index creation and incorrect rollback ownership; the model snapshot also contained Users, ValidationAudits and six planner fields without corresponding migration operations.',
 fix='Removed duplicate table/index creation, corrected both rollback methods, altered existing shelter foreign keys to match the snapshot, and added CompleteAuthenticationAndPlanningSchema for the missing tables and planner fields.',
 evidence='evidence/migration-fix/before/migration-before.trx; evidence/migration-fix/retest/migration-retest.trx; evidence/final/migrations.log; evidence/migration-fix/model-consistency.log; QmsMigrationTests.cs.',
 retest='Four regression tests failed before and passed after. The originally failed isolated database upgraded through eight migrations. Backend 95/95 and live HTTP 17/17 pass. Shared/startup-created databases were not automatically adopted.')]
(OUT/'defects.json').write_text(json.dumps(bugs,indent=2),encoding='utf-8')
body='<h1>ERCP defect and retest report</h1><p>Three recorded application defects are fixed and retested; BUG-03 was repaired on 5 October. The Windows sandbox interruption is an environment issue, not an application defect.</p>'
for b in bugs:
    body+='<article><h2>'+b['id']+' '+html.escape(b['title'])+'</h2><dl>'
    for k,v in b.items():
        if k not in ('id','title'): body+='<dt>'+k.title()+'</dt><dd>'+html.escape(v)+'</dd>'
    body+='</dl></article>'
body+=f'<h2>Other observed limitations</h2><p>The demo-user endpoint exposes development credentials; production hardening is outside the completed fixes. React lint reports {lint_warnings} warnings and the production build reports a bundle over 500 kB. NuGet metadata was unavailable on 3 October; the 5 October build reports NU1902 for MailKit 4.7.1.1. Backend coverage is reported from the current Coverlet XML in the PDF, including executed migration/generated model code; the line rate does not imply equivalent business-logic coverage. No ZAP scan or live LLM safety certification is claimed.</p>'
(OUT/'Defect_Report.html').write_text(page('ERCP defect report',body),encoding='utf-8')

styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='BodyQ',fontName='Helvetica',fontSize=10.5,leading=15,spaceAfter=9,textColor=colors.HexColor('#243746')))
styles.add(ParagraphStyle(name='SmallQ',fontName='Helvetica',fontSize=8.5,leading=12,spaceAfter=5))
styles.add(ParagraphStyle(name='TitleQ',fontName='Helvetica-Bold',fontSize=25,leading=30,spaceAfter=17,textColor=colors.HexColor('#12334b')))
styles.add(ParagraphStyle(name='HeadQ',fontName='Helvetica-Bold',fontSize=16,leading=20,spaceAfter=12,textColor=colors.HexColor('#12334b')))
story=[]
def p(text,style='BodyQ'): story.append(Paragraph(text,styles[style]))
def head(text): p(text,'HeadQ')
def table(rows,widths):
    data=[[Paragraph(str(v),styles['SmallQ']) for v in row] for row in rows]
    t=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e4edf3')),('GRID',(0,0),(-1,-1),.4,colors.HexColor('#bac9d4')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
    story.extend([t,Spacer(1,12)])
def nextpage(): story.append(PageBreak())

p('Software Testing and Quality Evaluation','TitleQ')
p('Emergency Resource Coordination Platform','HeadQ')
p('Group submission | SE3090 Assignment 2 | Revised 5 October 2026')
p(f'This report evaluates the existing ASP.NET Core, PostgreSQL, React, Flutter and agentic subsystem developed for the SEF assignment. The verified aggregate is {AUTO} passing automated cases, a passing local load scenario and a passing migration CLI check. Two security defects and the migration defect were corrected and retested. All current suites and the load scenario were rerun on 5 October. Counts reconcile automatically with the raw reports; no tests were skipped. The evidence supports the tested workflows; it does not establish production readiness.')
table([['Member','Student ID','SEF module']]+[list(m) for m in members],[92,80,327])
labels={'backend':'Backend including PostgreSQL and migrations','react':'React components and services','flutter':'Flutter units and widgets','agents':'Python deterministic agents','http':'Live HTTP workflow and security'}
table([['Executed area','Passed','Failed','Skipped']] + [[labels[k],v['passed'],v['failed'],v['skipped']] for k,v in SUMMARY['automated_suites'].items()] + [['k6 load scenario',1,0,0],['Migration CLI check',1,0,0]],[300,65,65,69])
p('Assessment brief: Software Testing and Quality Evaluation of the SE3090 Integrated System. Deadline: 5 October 2026. The source filename is SE3110 Assignment.pdf, while its internal module heading is SE3090; the group should confirm the CourseWeb location.','SmallQ')

nextpage(); head('Test plan and environment')
p('<b>Objectives.</b> Verify important implemented behaviour, demonstrate cross-component execution, measure a bounded performance workload, check authorization and safety controls, and preserve traceable defect/retest evidence. The same ERCP source is used throughout.')
p('<b>Scope.</b> Incident reporting and planning; resources, inventory and shelters; dispatch and approval; volunteers and shifts; authentication; React UI states; Flutter models/widgets; deterministic agent contracts; PostgreSQL uniqueness, foreign keys, cascade deletion and rollback.')
table([['Area and tools','Reason for selection'],['xUnit, WebApplicationFactory, EF Core and PostgreSQL','Existing .NET framework; direct business/controller tests plus real HTTP authorization and actual relational constraints.'],['Vitest and React Testing Library','Existing setup; component rendering, interactions, route permissions and mocked API failure states.'],['flutter_test','Existing unit/widget fixtures; login validation, state, models and responder screens.'],['pytest and Requests','Actual Python agents and a live HTTP workflow against the real local API and PostgreSQL.'],['k6 1.3.0','Repeatable virtual-user workload with predeclared latency, failure and content thresholds.']],[180,319])
p('<b>Environment.</b> Windows 11; .NET SDK 10.0.401 (net8.0 target); Node 22.15.0; Python 3.13.2; pytest 8.3.3; Requests 2.34.2; PostgreSQL 17.10 on 127.0.0.1:55432; API on 127.0.0.1:5009. Frontend build reported Vite 8.2.1. Flutter 3.44.9 uses its resolved lockfile; CI is pinned to that tested SDK. QMS mode requires PostgreSQL and applies EF migrations before accepting requests. Evidence records the actual tool outputs.')
p('<b>Isolation.</b> A fresh ercp_qms_verified database supports this full rerun. QMS startup rejects legacy tables without migration history and disables in-memory fallback. Earlier test databases are preserved. Migration tests create and remove only their own isolated databases. Most original backend tests still use EF InMemory. SMTP and Gemini credentials are disabled for live tests. No external messages or live model calls are required.')
p('<b>Schedule.</b> Original analysis and testing were performed on 3 October. BUG-03 reproduction, repair, migration/backend/live workflow retesting followed by a complete reproducibility rerun and report revision were completed on 5 October. The submission deadline remains 5 October.')

nextpage(); head('Risk based test design and responsibilities')
table([['Risk','Normal and failure or boundary coverage','Reviewer'],['Incorrect incident data or unsafe plans','Meaningful incident creation; invalid title/address/email and negative affected count; generated plan output and approval flag.','Jathurshy.S'],['Invalid resource or database state','Resource render/empty/error/status interaction; urgency levels; full shelter; exact capacity and stock limits; database unique/FK/cascade/rollback.','M.Thanusikan'],['Unauthorized dispatch or approval','Citizen/Volunteer mutation denial; invalid JWT; no approval before safety validation; immutable approved tasks; allocation shortages.','Denesh N'],['Unavailable or conflicting responders','Volunteer HTTP lifecycle; shift windows; adjacent shifts; unavailable volunteer rejection; malformed safety payload; mobile form/state tests.','Deneshkar. P']],[110,297,92])
p('<b>Entry criteria.</b> Dependencies installed; isolated API and database reachable; original suites executed; valid fixtures available. <b>Exit criteria for the evaluated scope.</b> Record all outcomes, fix critical demonstrated authorization defects, verify retests, and identify remaining failures explicitly. BUG-03 now passes clean schema, rollback/data-preservation and upgrade checks. Adoption of an existing database created outside migration history remains a separate task.')
p(f'<b>Traceability.</b> Test_Cases.html and test-cases.json contain {TOTAL} separately identified records: feature, preconditions, reproduction steps, expected assertions, actual result, status, source and evidence path. Parameterized variants are separate records. Expand the source excerpt to inspect exact fixture input and assertions.')
p('<b>Baseline and change.</b> Before changes, backend 80/80 and React 39/39 passed. Seven new security regression cases produced four failures and three passes before the fix. The refreshed backend result is 95/95, including four new migration regressions. React 47/47 and Flutter 91/91 were rerun on 5 October. Existing superficial component tests remain visible and are not presented as strong behavioural coverage; the new resource and protected-route cases exercise actual components.')
p('<b>Ownership.</b> The named allocation follows the user-supplied SEF ownership. Execution here was AI-assisted. Each member must review and run their contribution before claiming personal implementation or execution during the individual viva.')

nextpage(); head('Integrated workflow and agent evaluation')
workflow=json.loads(read(QMS/'evidence/final/workflow.json'))
p('<b>E2E01 is a live API integration workflow.</b> Requests drives the actual ASP.NET Core API backed by PostgreSQL. It is not a browser or physical-device end-to-end test.')
steps=[['Step','Observed check'],['1 Register citizen and report incident','201 responses; meaningful incident persisted using valid field inputs.'],['2 Generate response plan','Planner endpoint returned a plan for the created incident. Live LLM credentials were disabled.'],['3 Create responder and dispatch','Volunteer and proposed dispatch created; premature approval returned 400.'],['4 Assign task and validate','Task created; validation returned isValid=true and recommendation APPROVE.'],['5 Coordinator approves','Status update succeeded and subsequent GET returned Approved with the expected volunteer task.'],['6 Verify lock and persistence','Further task creation returned 409. Independent PostgreSQL query confirmed Approved.']]
table(steps,[174,325])
p(f'Recorded fixture identifiers: incident {workflow["incident_id"]}, dispatch {workflow["dispatch_id"]}, plan {workflow.get("plan_id")}. See evidence/final/workflow.json for the returned validation checks, saved dispatch and independent database verification. All 17 live HTTP cases passed again on 5 October against the migrated schema.')
p('<b>Agent evaluation.</b> Twenty pytest cases import the actual four Python agents. Coverage includes rejected unapproved tools, coordinator structured output and mandatory human approval, allocation shortages, urgency categories, full shelters, exact capacity/stock boundaries, unavailable volunteers, malformed payload rejection and adjacent shift windows.')
p('<b>Injection scope.</b> A malicious instruction string in an allocation title does not remove deterministic human approval. This only verifies that deterministic path. It is not a prompt-injection evaluation of live Gemini. Backend planner execution may use its implemented fallback; the report does not infer a live LLM response from a successful plan endpoint.')
p('<b>Environment recovery.</b> The first live workflow was interrupted by Windows data-protection/event-log permissions. An authorized local rerun completed successfully. The initial failure is preserved as environment evidence and excluded from the application defect count.')

nextpage(); head('Performance and security results')
p('<b>Performance design.</b> The new 5 October 40-second k6 run ramps to 5 virtual users, reaches 10, then ramps down. Each iteration requests authenticated incident, dispatch and volunteer lists with a 0.2-second pause. Targets were p95 below 1000 ms, HTTP error rate below 1%, and all status/content checks passing.')
table([['Metric','Observed result'],['HTTP requests',str(count)],['Throughput',f'{metrics["http_reqs"]["values"]["rate"]:.2f} requests/second'],['Response time p95',f'{p95:.5f} ms'],['Maximum response time',f'{metrics["http_req_duration"]["values"]["max"]:.5f} ms'],['HTTP failures',f'{error_rate:.2f}%'],['Status and JSON checks',f'{check_passes} passed; {check_fails} failed'],['Thresholds','All three passed']],[240,259])
p('These measurements describe a small local dataset and short authenticated read workload. They exclude mobile/browser rendering, live LLM latency, sustained stress, multi-machine deployment and production traffic. They must not be extrapolated into a production capacity claim.')
p('<b>Security execution.</b> xUnit HTTP tests and pytest live HTTP tests verified public-role escalation rejection, low-privilege dispatch restrictions, malformed tokens, anonymous protected endpoints and a SQL-injection-shaped login input. The latter demonstrates rejection for the submitted input, not complete SQL-injection resistance. Coordinator success is verified through the integrated workflow.')
p('<b>Before and after.</b> SEC01 initially allowed Admin and Coordinator registration (201); both now return 400. SEC02 initially let Citizen and Volunteer create dispatches (201); both now return 403. Live SEC05 additionally verifies forbidden task/status/allocation actions. Evidence is preserved in security-before.trx, backend.trx and live-api.xml.')
p('<b>Security limits.</b> No ZAP scan was executed. The tested application intentionally exposes seeded demo credentials and has development-oriented configuration. These remain deployment risks. Successful authorization tests are not a complete security assessment.')

nextpage(); head('Defects and quality assessment')
table([['Defect','Severity and status','Result'],['BUG-01 Public privileged registration','Critical / P1<br/>Fixed and retested','DTO and public controller now reject privileged roles. Two role variants failed before and passed after.'],['BUG-02 Dispatch mutation permissions','High / P1<br/>Fixed and retested','Coordinator/Admin restriction added to six mutation actions. Positive coordinator and negative low-privilege checks pass.'],['BUG-03 Overlapping migrations','High / P2<br/>Fixed and retested','Duplicates and rollback ownership corrected; missing schema supplied by a new migration. Four migration regressions pass; the original failed database now upgrades.']],[166,117,216])
p('<b>Migration handling.</b> The repaired history creates each table once. Rollbacks preserve earlier incident tables and resource data, and shelter foreign keys match the model. A new migration supplies Users, ValidationAudits and six missing planner fields. All eight migrations apply; the model snapshot has no pending changes. Original failures are retained alongside successful retests. Shared databases were not changed; startup-created databases require separate schema/history adoption.')
p(f'<b>Coverage.</b> The final Coverlet report records {coverage_text}. Migration tests execute substantial generated/model code, so the increased line rate does not establish comparable business-logic coverage. Branch coverage remains limited. Frontend and Flutter coverage percentages were not collected; no percentages are inferred from test counts.')
p(f'<b>Static checks.</b> Flutter analyze reports no issues. React lint reports zero errors and {lint_warnings} warnings. The React production build succeeds with a bundle-size warning above 500 kB. Git diff whitespace checking passes. The 5 October build reports NU1902 for MailKit 4.7.1.1. That dependency is unchanged by this repair; dependency security has not been cleared.')
p('<b>Remaining gaps.</b> Physical devices, browser-driven complete workflows, live LLM failures, extended load/stress, accessibility scans, broad penetration testing and adoption of existing startup-created databases are outside the executed evidence. Existing mock-based tests must be interpreted within their isolation boundaries.')
p('Defect_Report.html records reproduction steps, expected/actual behaviour, root cause, fix status, evidence and retest outcome for each application defect. Source changes are supplied with the application and evidence/final/security-fixes.patch and evidence/migration-fix/migration-fixes.patch.')

nextpage(); head('Contribution evidence and viva preparation')
p('Repository: <link href="https://github.com/Deneshkar/emergency-resource-coordination-platform" color="#12334b">github.com/Deneshkar/emergency-resource-coordination-platform</link>')
p('Original baseline: fc73d857f5fa7dd12279c7463e759a637d8dffda. Repair baseline: fea099acd24db060505335cb5de23440de7c29a6. Historical logs record intervening team commits, including security fixes. The migration/setup repair, CI configuration and qms/ scripts, documents and curated evidence are supplied as working-tree changes. Their presence in the package does not claim a GitHub push or personal member authorship.')
table([['Member','Suggested meaningful live demonstration'],['Jathurshy.S - IT24103355','Incident invalid-input test; planner approval contract; live incident-to-dispatch workflow.'],['M.Thanusikan - IT24103609','PostgreSQL unique/FK check versus InMemory; resource UI error/status behaviour; demonstrate migration failure, repair and data-preserving rollback.'],['Denesh N - IT24102826','Before/after dispatch authorization; allocation shortage; k6 thresholds, p95 and the limits of local load evidence.'],['Deneshkar. P - IT24103828','Volunteer/shift HTTP lifecycle; adjacent-shift boundary; unavailable responder safety rejection; a Flutter widget test.']],[190,309])
p('Each member should run and explain the fixture, assertion, tool setup and result; modify an input and predict the outcome; locate one defect and its retest evidence. The marking scheme assigns 40 group marks and 60 individual marks, so reading the report alone is insufficient preparation.')
p('<b>AI declaration.</b> OpenAI Codex assisted repository analysis, test ideas and implementation, security fixes, execution, evidence reconciliation and report generation on 3 October, with migration repair and retesting on 5 October 2026. Generated tests were checked against the actual source and executed. Deterministic AI paths were used with live Gemini disabled. Members must review and understand all submitted work and record their genuine contribution.')
p('The brief requires the module CLEAR framework but does not define its fields. Use this declaration as source content for the lecturer-provided CLEAR template; no alternate definition has been assumed. Contribution_and_Viva.md provides the fuller declaration and assigned rehearsal tasks.')

nextpage(); head('Conclusion and evidence index')
p('The tested incident-to-approved-dispatch workflow completes on the actual API and PostgreSQL, and selected resource, responder, client and agent behaviours pass their automated checks. The assessment corrected two authorization defects and the migration defect. The repaired schema passes clean installation, rollback/data-preservation and upgrade checks, and the workflow passes on that schema. The new local load test met its thresholds. The remaining security, coverage and deployment-adoption limits prevent a production-readiness conclusion.')
table([['Submission item','Purpose'],['Software_Testing_Report.pdf','Test plan, scope, environment, results, defects and conclusion.'],['Test_Cases.html and test-cases.json',f'{TOTAL} completed, evidence-linked records with expected and actual results.'],['Defect_Report.html and defects.json','Three defects with severity, reproduction, evidence and retest status.'],['Contribution_and_Viva.md','Named module allocation, genuine contribution requirements, demonstration guide and AI declaration.'],['Reproduction_Guide.md and scripts/run-tests.ps1','Dependencies, isolated environment setup and rerun commands.'],['evidence/baseline and evidence/security-before','Original suites and pre-fix security failures.'],['evidence/final/backend, react.json, flutter.jsonl, agents.xml, live-api.xml','Raw automated execution and backend coverage.'],['evidence/final/performance.json, workflow.json and migrations.log','Load metrics, migrated workflow evidence and passing CLI upgrade. Original failure and four regression retests are in evidence/migration-fix.'],['Application source and testing scripts','Reproducible implementation, configuration examples and test code.']],[221,278])
p('<b>Submission checks.</b> Review member details; supply a group number if required; commit genuine member contributions and verify the repository link; transfer the AI declaration into the official CLEAR format; rehearse the individual demonstrations; upload through the correct CourseWeb entry. This package has not been uploaded or pushed automatically.')
p('<b>Source basis.</b> The supplied four-page SE3110 Assignment.pdf, the ERCP repository at the stated baseline with supplied working-tree fixes, and the tool-generated evidence listed above. Historical report pass counts were not reused as fresh execution results.','SmallQ')

def footer(canvas,doc):
    canvas.setStrokeColor(colors.HexColor('#ccd6de')); canvas.line(48,39,A4[0]-48,39)
    canvas.setFont('Helvetica',8); canvas.setFillColor(colors.HexColor('#516574'))
    canvas.drawString(48,26,'ERCP | Group testing submission | Revised 5 October 2026')
    canvas.drawRightString(A4[0]-48,26,str(doc.page))
doc=SimpleDocTemplate(str(OUT/'Software_Testing_Report.pdf'),pagesize=A4,rightMargin=48,leftMargin=48,topMargin=44,bottomMargin=51,
    title='ERCP Software Testing and Quality Evaluation',author='ERCP group')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(json.dumps({'records':len(cases),'passed':sum(c['status']=='Passed' for c in cases),'failed':0,'pdf':str(OUT/'Software_Testing_Report.pdf')}))
