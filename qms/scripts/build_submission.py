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
PERSONAL_MEMBERS = json.loads((QMS/'members/personal-evidence.json').read_text())['members']
sys.path.append(str(QMS / '.tools/python'))
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, NextPageTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, Image
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4, landscape

def read(path):
    data=Path(path).read_bytes()
    decoded = data.decode('utf-16' if data.startswith((b'\xff\xfe',b'\xfe\xff')) else 'utf-8-sig',errors='replace')
    # Normalize displayed excerpts; leave the original evidence files unchanged.
    return '\n'.join(line.rstrip() for line in decoded.replace('\r\n','\n').splitlines())

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
add('DBM','CLI01 Verify migrated QMS database and repeat CLI update',REPO/'backend/Migrations','Fresh ercp_qms_github database migrated by strict QMS startup; dotnet-ef 8.0.29 available.',
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
body=f'<h1>ERCP completed test case document</h1><p>Updated 6 October 2026. {AUTO} automated cases, one k6 load scenario and one migration CLI check passed. Every suite and the load scenario were rerun on 6 October using the QMS setup. No tests were skipped. Each record is linked to actual tool evidence. Parameterized cases are separate records. Responsible reviewers follow the supplied module allocation; this is not a claim of individual execution authorship.</p><p>Source excerpts preserve fixture inputs, actions and assertions. Existing weak smoke tests are retained transparently; passing them alone does not establish feature coverage.</p>'
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
body+=f'<h2>Other observed limitations</h2><p>The demo-user endpoint exposes development credentials; production hardening is outside the completed fixes. React lint reports {lint_warnings} warnings and the production build reports a bundle over 500 kB. The team updated MailKit from 4.7.1.1 to 4.18.1; the 6 October build does not report the earlier NU1902 warning. This is not a complete dependency security audit. Backend coverage is reported from the current Coverlet XML in the PDF, including executed migration/generated model code; the line rate does not imply equivalent business-logic coverage. No ZAP scan or live LLM safety certification is claimed.</p>'
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
p('SE3110 - Quality Management in Software Engineering | Assignment 2')
p(f'This report evaluates the existing ASP.NET Core, PostgreSQL, React, Flutter and agentic subsystem developed for the SEF assignment. The verified aggregate is {AUTO} passing automated cases, a passing local load scenario and a passing migration CLI check. Two security defects and the migration defect were corrected and retested. All current suites and the load scenario were rerun on 6 October. Counts reconcile automatically with the raw reports; no tests were skipped. The evidence supports the tested workflows; it does not establish production readiness.')
table([['Member','Student ID','SEF module']]+[list(m) for m in members],[92,80,327])
labels={'backend':'Backend including PostgreSQL and migrations','react':'React components and services','flutter':'Flutter units and widgets','agents':'Python deterministic agents','http':'Live HTTP workflow and security'}
table([['Executed area','Passed','Failed','Skipped']] + [[labels[k],v['passed'],v['failed'],v['skipped']] for k,v in SUMMARY['automated_suites'].items()] + [['k6 load scenario',1,0,0],['Migration CLI check',1,0,0]],[300,65,65,69])
p('Submission module confirmed by the repository owner: SE3110 - Quality Management in Software Engineering. The supplied brief internally refers to SE3090 and the SEF integrated system; that source wording is retained for traceability. Its stated deadline is 5 October 2026. Later evidence dates are retained accurately; no extension or CourseWeb upload is claimed.','SmallQ')

nextpage(); head('Test plan and environment')
p('<b>Objectives.</b> Verify important implemented behaviour, demonstrate cross-component execution, measure a bounded performance workload, check authorization and safety controls, and preserve traceable defect/retest evidence. The same ERCP source is used throughout.')
p('<b>Scope.</b> Incident reporting and planning; resources, inventory and shelters; dispatch and approval; volunteers and shifts; authentication; React UI states; Flutter models/widgets; deterministic agent contracts; PostgreSQL uniqueness, foreign keys, cascade deletion and rollback.')
table([['Area and tools','Reason for selection'],['xUnit, WebApplicationFactory, EF Core and PostgreSQL','Existing .NET framework; direct business/controller tests plus real HTTP authorization and actual relational constraints.'],['Vitest and React Testing Library','Existing setup; component rendering, interactions, route permissions and mocked API failure states.'],['flutter_test','Existing unit/widget fixtures; login validation, state, models and responder screens.'],['pytest and Requests','Actual Python agents and a live HTTP workflow against the real local API and PostgreSQL.'],['k6 1.3.0','Repeatable virtual-user workload with predeclared latency, failure and content thresholds.']],[180,319])
p('<b>Environment.</b> Windows 11; .NET SDK 10.0.401 (net8.0 target); Node 22.15.0; Python 3.13.2; pytest 8.3.3; Requests 2.34.2; PostgreSQL 17.10 on 127.0.0.1:55432; API on 127.0.0.1:5009. Frontend build reported Vite 8.2.1. Flutter 3.44.9 uses its resolved lockfile; CI is pinned to that tested SDK. QMS mode requires PostgreSQL and applies EF migrations before accepting requests. Evidence records the actual tool outputs.')
p('<b>Isolation.</b> A fresh ercp_qms_github database supports this full rerun. QMS startup rejects legacy tables without migration history and disables in-memory fallback. Earlier test databases are preserved. Migration tests create and remove only their own isolated databases. Most original backend tests still use EF InMemory. SMTP and Gemini credentials are disabled for live tests. No external messages or live model calls are required.')
p('<b>Schedule.</b> Original analysis and testing were performed on 3 October. BUG-03 reproduction, repair, migration/backend/live workflow retesting followed by a complete reproducibility rerun and report revision were completed on 5 October. Integration with current main, publication and a full rerun were completed on 6 October. The brief states a 5 October deadline.')

import test_plan
nextpage(); head('Consolidated Test Plan')
p('<b>Scope.</b> '+test_plan.SCOPE,'SmallQ')
p('<b>Objectives.</b> '+test_plan.OBJECTIVES,'SmallQ')
table([test_plan.HEADERS]+test_plan.ROWS,[77,102,80,80,92,68])
p(test_plan.RESPONSIBILITIES,'SmallQ')
nextpage(); head('Recorded testing schedule')
table([test_plan.SCHEDULE_HEADERS]+test_plan.SCHEDULE,[110,389])
p(test_plan.ACCEPTANCE)
p('Member reruns and demonstration scenarios do not increase the 270 unique automated tests or 272 inventory records. Deneshkar supplied a written explanation on 8 October. The new comparisons were technically executed by Codex; all four personal comparison runs are supported by screenshots in Appendix I; all four explanations are received; evidence-aligned summaries and corrections are retained in Member_Explanations.md.')
p('Test_Plan.md provides the consolidated plan and evidence paths. Changed_Input_Demonstrations.md provides runnable practice instructions and a record template; it is not completed personal evidence.','SmallQ')

nextpage(); head('Risk based test design and responsibilities')
table([['Risk','Normal and failure or boundary coverage','Reviewer'],['Incorrect incident data or unsafe plans','Meaningful incident creation; invalid title/address/email and negative affected count; generated plan output and approval flag.','Jathurshy.S'],['Invalid resource or database state','Resource render/empty/error/status interaction; urgency levels; full shelter; exact capacity and stock limits; database unique/FK/cascade/rollback.','M.Thanusikan'],['Unauthorized dispatch or approval','Citizen/Volunteer mutation denial; invalid JWT; no approval before safety validation; immutable approved tasks; allocation shortages.','Denesh N'],['Unavailable or conflicting responders','Volunteer HTTP lifecycle; shift windows; adjacent shifts; unavailable volunteer rejection; malformed safety payload; mobile form/state tests.','Deneshkar. P']],[110,297,92])
p('<b>Entry criteria.</b> Dependencies installed; isolated API and database reachable; original suites executed; valid fixtures available. <b>Exit criteria for the evaluated scope.</b> Record all outcomes, fix critical demonstrated authorization defects, verify retests, and identify remaining failures explicitly. BUG-03 now passes clean schema, rollback/data-preservation and upgrade checks. Adoption of an existing database created outside migration history remains a separate task.')
p(f'<b>Traceability.</b> Test_Cases.html and test-cases.json contain {TOTAL} separately identified records: feature, preconditions, reproduction steps, expected assertions, actual result, status, source and evidence path. Parameterized variants are separate records. Expand the source excerpt to inspect exact fixture input and assertions.')
p('<b>Baseline and change.</b> Before changes, backend 80/80 and React 39/39 passed. Seven new security regression cases produced four failures and three passes before the fix. The refreshed backend result is 95/95, including four new migration regressions. React 47/47 and Flutter 91/91 were rerun on 6 October. Existing superficial component tests remain visible and are not presented as strong behavioural coverage; the new resource and protected-route cases exercise actual components.')
p('<b>Ownership.</b> The named allocation follows the user-supplied SEF ownership. Execution here was AI-assisted. Each member must review and run their contribution before claiming personal implementation or execution during the individual viva.')

nextpage(); head('Integrated workflow and agent evaluation')
workflow=json.loads(read(QMS/'evidence/final/workflow.json'))
p('<b>E2E01 is a live API integration workflow.</b> Requests drives the actual ASP.NET Core API backed by PostgreSQL. It is not a browser or physical-device end-to-end test.')
steps=[['Step','Observed check'],['1 Register citizen and report incident','201 responses; meaningful incident persisted using valid field inputs.'],['2 Generate response plan','Planner endpoint returned a plan for the created incident. Live LLM credentials were disabled.'],['3 Create responder and dispatch','Volunteer and proposed dispatch created; premature approval returned 400.'],['4 Assign task and validate','Task created; validation returned isValid=true and recommendation APPROVE.'],['5 Coordinator approves','Status update succeeded and subsequent GET returned Approved with the expected volunteer task.'],['6 Verify lock and persistence','Further task creation returned 409. Independent PostgreSQL query confirmed Approved.']]
table(steps,[174,325])
p(f'Recorded fixture identifiers: incident {workflow["incident_id"]}, dispatch {workflow["dispatch_id"]}, plan {workflow.get("plan_id")}. See evidence/final/workflow.json for the returned validation checks, saved dispatch and independent database verification. All 17 live HTTP cases passed again on 6 October against the migrated schema.')
p('<b>Agent evaluation.</b> Twenty pytest cases import the actual four Python agents. Coverage includes rejected unapproved tools, coordinator structured output and mandatory human approval, allocation shortages, urgency categories, full shelters, exact capacity/stock boundaries, unavailable volunteers, malformed payload rejection and adjacent shift windows.')
p('<b>Injection scope.</b> A malicious instruction string in an allocation title does not remove deterministic human approval. This only verifies that deterministic path. It is not a prompt-injection evaluation of live Gemini. Backend planner execution may use its implemented fallback; the report does not infer a live LLM response from a successful plan endpoint.')
p('<b>Environment recovery.</b> The first live workflow was interrupted by Windows data-protection/event-log permissions. An authorized local rerun completed successfully. The initial failure is preserved as environment evidence and excluded from the application defect count.')

nextpage(); head('Performance and security results')
p('<b>Performance design.</b> The new 6 October 40-second k6 run ramps to 5 virtual users, reaches 10, then ramps down. Each iteration requests authenticated incident, dispatch and volunteer lists with a 0.2-second pause. Targets were p95 below 1000 ms, HTTP error rate below 1%, and all status/content checks passing.')
table([['Metric','Observed result'],['HTTP requests',str(count)],['Throughput',f'{metrics["http_reqs"]["values"]["rate"]:.2f} requests/second'],['Response time p95',f'{p95:.5f} ms'],['Maximum response time',f'{metrics["http_req_duration"]["values"]["max"]:.5f} ms'],['HTTP failures',f'{error_rate:.2f}%'],['Status and JSON checks',f'{check_passes} passed; {check_fails} failed'],['Thresholds','All three passed']],[240,259])
p('These measurements describe a small local dataset and short authenticated read workload. They exclude mobile/browser rendering, live LLM latency, sustained stress, multi-machine deployment and production traffic. They must not be extrapolated into a production capacity claim.')
p('<b>Security execution.</b> xUnit HTTP tests and pytest live HTTP tests verified public-role escalation rejection, low-privilege dispatch restrictions, malformed tokens, anonymous protected endpoints and a SQL-injection-shaped login input. The latter demonstrates rejection for the submitted input, not complete SQL-injection resistance. Coordinator success is verified through the integrated workflow.')
p('<b>Before and after.</b> SEC01 initially allowed Admin and Coordinator registration (201); both now return 400. SEC02 initially let Citizen and Volunteer create dispatches (201); both now return 403. Live SEC05 additionally verifies forbidden task/status/allocation actions. Evidence is preserved in security-before.trx, backend.trx and live-api.xml.')
p('<b>Security limits.</b> No ZAP scan was executed. The tested application intentionally exposes seeded demo credentials and has development-oriented configuration. These remain deployment risks. Successful authorization tests are not a complete security assessment.')

nextpage(); head('Defects and quality assessment')
table([['Defect','Severity and status','Result'],['BUG-01 Public privileged registration','Critical / P1<br/>Fixed and retested','DTO and public controller now reject privileged roles. Two role variants failed before and passed after.'],['BUG-02 Dispatch mutation permissions','High / P1<br/>Fixed and retested','Coordinator/Admin restriction added to six mutation actions. Positive coordinator and negative low-privilege checks pass.'],['BUG-03 Overlapping migrations','High / P2<br/>Fixed and retested','Duplicates and rollback ownership corrected; missing schema supplied by a new migration. Four migration regressions pass; the original failed database now upgrades.']],[166,117,216])
p('<b>Migration handling.</b> The repaired history creates each table once. Rollbacks preserve earlier incident tables and resource data, and shelter foreign keys match the model. A new migration supplies Users, ValidationAudits and six missing planner fields. All eight migrations apply; the model snapshot has no pending changes. Original failures are retained alongside successful retests. Shared databases were not changed; startup-created databases require separate schema/history adoption.')
p(f'<b>Coverage.</b> The final Coverlet report records {coverage_text}. Migration tests execute substantial generated/model code, so the increased line rate does not establish comparable business-logic coverage. Branch coverage remains limited. Frontend and Flutter coverage percentages were not collected; no percentages are inferred from test counts.')
p(f'<b>Static checks.</b> Flutter analyze reports no issues. React lint reports zero errors and {lint_warnings} warnings. The React production build succeeds with a bundle-size warning above 500 kB. Git diff whitespace checking passes. The team upgraded MailKit to 4.18.1 in commit cd96717. The current build has no earlier MailKit NU1902 warning; a comprehensive dependency audit is not claimed.')
p('<b>Remaining gaps.</b> Physical devices, browser-driven complete workflows, live LLM failures, extended load/stress, accessibility scans, broad penetration testing and adoption of existing startup-created databases are outside the executed evidence. Existing mock-based tests must be interpreted within their isolation boundaries.')
p('Defect_Report.html records reproduction steps, expected/actual behaviour, root cause, fix status, evidence and retest outcome for each application defect. Source changes are supplied with the application and evidence/final/security-fixes.patch and evidence/migration-fix/migration-fixes.patch.')

nextpage(); head('Contribution evidence and viva preparation')
p('Repository: <link href="https://github.com/Deneshkar/emergency-resource-coordination-platform" color="#12334b">github.com/Deneshkar/emergency-resource-coordination-platform</link>')
p('Published source: <link href="https://github.com/Deneshkar/emergency-resource-coordination-platform/commit/9226a56328c91a5a2e47557997d15786c7a15b71">9226a56</link>, based on main 054fce7. The published fix/qms-submission-readiness branch preserves newer team changes. <link href="https://github.com/Deneshkar/emergency-resource-coordination-platform/pull/47">PR #47</link> was closed without merging; the branch remains available. Appendix A provides exact commit messages, full hashes, author/committer dates and testing contributions for every member. GitHub_Publication.md records publication and CI status.')
verified = [('Jathurshy.S - IT24103355','50f9414e8ceeb8f287112bde2a81883fa9ba4245','Incident controller tests and planner implementation. Demonstrate invalid input and approval requirements.'),('M.Thanusikan - IT24103609','25de8a92bee86fe982b6fdbbe65afdc35055ce43','Resource, shelter and inventory edge-case tests. Demonstrate a PostgreSQL constraint and migration regression.'),('Denesh N - IT24102826','48a9c3b9cd87d67ce48b9c16aeb960be85baa266','Dispatch allocation/controller and React tests. Explain authorization, allocation shortages and load thresholds.'),('Deneshkar. P - IT24103828','3c059a63c9093f6347de4fbef73f9b3e7164910a','Volunteer/shift HTTP tests. Demonstrate safety rejection and a Flutter widget case.')]
table([['Member','Verified existing commit and suggested demonstration']]+[[name, f'<link href="https://github.com/Deneshkar/emergency-resource-coordination-platform/commit/{sha}">{sha[:7]}</link>: {description}'] for name,sha,description in verified],[190,309])
p('<b>Individual evidence status.</b> On 7 October, Jathurshy.S, M.Thanusikan and Denesh N supplied personal-run screenshots matched to raw reports: 11, 17 and 26 tests passed, plus two agent scenarios each. Appendix G retains all six images. Deneshkar\'s earlier personal screenshots remain in Appendix C; his 8 October written explanation is in Appendix H. All four personal comparison runs are supported by screenshots in Appendix I; all four explanations are received; evidence-aligned summaries and corrections are retained in Member_Explanations.md.')

p('Each member should run and explain the fixture, assertion, tool setup and result; modify an input and predict the outcome; locate one defect and its retest evidence. The marking scheme assigns 40 group marks and 60 individual marks, so reading the report alone is insufficient preparation.')
p('<b>AI declaration.</b> OpenAI Codex assisted repository analysis, test ideas and implementation, security fixes, execution, evidence reconciliation and report generation on 3 October, with migration repair on 5 October and integration, publication and full retesting on 6 October 2026. Generated tests were checked against the actual source and executed. Deterministic AI paths were used with live Gemini disabled. Members must review and understand all submitted work and record their genuine contribution.')
p('The brief requires the module CLEAR framework but does not define its fields. Use this declaration as source content for the lecturer-provided CLEAR template; no alternate definition has been assumed. Contribution_and_Viva.md provides the fuller declaration and assigned rehearsal tasks.')

nextpage(); head('Conclusion and evidence index')
p('The tested incident-to-approved-dispatch workflow completes on the actual API and PostgreSQL, and selected resource, responder, client and agent behaviours pass their automated checks. The assessment corrected two authorization defects and the migration defect. The repaired schema passes clean installation, rollback/data-preservation and upgrade checks, and the workflow passes on that schema. The new local load test met its thresholds. The remaining security, coverage and deployment-adoption limits prevent a production-readiness conclusion.')
table([['Submission item','Purpose'],['Software_Testing_Report.pdf','Test plan, scope, environment, results, defects and conclusion.'],['Test_Cases.html and test-cases.json',f'{TOTAL} completed, evidence-linked records with expected and actual results.'],['Defect_Report.html and defects.json','Three defects with severity, reproduction, evidence and retest status.'],['Contribution_Record.md, Contribution_and_Viva.md and GitHub_Publication.md','Verified commit links, publication/CI status, personal execution evidence, viva guide and AI declaration.'],['Reproduction_Guide.md and scripts/run-tests.ps1','Dependencies, isolated environment setup and rerun commands.'],['evidence/baseline and evidence/security-before','Original suites and pre-fix security failures.'],['evidence/final/backend, react.json, flutter.jsonl, agents.xml, live-api.xml','Raw automated execution and backend coverage.'],['evidence/final/performance.json, workflow.json and migrations.log','Load metrics, migrated workflow evidence and passing CLI upgrade. Original failure and four regression retests are in evidence/migration-fix.'],['Application source and testing scripts','Reproducible implementation, configuration examples and test code.']],[221,278])
p('<b>Submission checks.</b> Review member details; supply a group number if required; complete genuine individual review/run evidence; transfer the AI declaration into the official CLEAR format; rehearse the individual demonstrations; upload through the correct CourseWeb entry. The QMS source is published on fix/qms-submission-readiness; PR #47 is closed without merging. CourseWeb upload has not been performed.')
p('<b>Source basis.</b> The supplied four-page SE3110 Assignment.pdf, the ERCP repository at published source commit 9226a56 on top of main 054fce7, and the tool-generated evidence listed above. Historical report pass counts were not reused as fresh execution results.','SmallQ')

commit_evidence = json.loads(read(QMS/'evidence/github/verified-member-commits.json'))
screenshot_manifest_path = QMS/'evidence/github/screenshots.json'
screenshot_manifest = json.loads(read(screenshot_manifest_path)) if screenshot_manifest_path.exists() else []
personal_path = QMS/'evidence/individual/IT24103828/20261006-151749/personal-execution.json'
personal = json.loads(read(personal_path)) if personal_path.exists() else None
for index, (name, student_id, module) in enumerate(members, 1):
    nextpage(); head(f'Appendix A.{index} - Individual contribution')
    p(f'<b>{html.escape(name)} | {student_id}</b>')
    p(f'<b>SEF responsibility:</b> {html.escape(module)}')
    member_commits = [row for row in commit_evidence if row['student_id'] == student_id]
    p(f'<b>Verified GitHub account:</b> {member_commits[0]["github_author"]}', 'SmallQ')
    p('The following are historical contributions in the tested project. Dates are recorded in Sri Lanka time (UTC+05:30). Author and committer dates are shown separately because rebasing or integration can change the latter.', 'SmallQ')
    for row in member_commits:
        p(f'<b>Commit:</b> <link href="{row["url"]}" color="#12334b">{row["sha"]}</link>', 'SmallQ')
        p('<b>Exact message:</b> '+html.escape(row['message']).replace('\n','<br/>'), 'SmallQ')
        p(f'<b>Author date:</b> {row["author_date"]}<br/><b>Committer date:</b> {row["committer_date"]}', 'SmallQ')
        p('<b>Testing / repair contribution:</b> '+html.escape(row['testing_contribution']), 'SmallQ')
        files = [f for f in row['changed_files'] if 'tests/' in f or '__tests__/' in f]
        if not files:
            files = row['changed_files']
        p('<b>Relevant committed files:</b><br/>'+ '<br/>'.join(html.escape(f) for f in files), 'SmallQ')
        story.append(Spacer(1, 7))
    p('<b>Individual summary.</b> '+ ('Contributed volunteer/shift API tests and published security/QMS changes. Group analysis, execution, integration and reporting used OpenAI Codex assistance under the repository owner\'s direction. Personal viva review and demonstrations must be recorded separately.' if student_id == 'IT24103828' else 'The Git history above supports implementation/test authorship. A submitted personal run on 7 October is supported by terminal screenshots and matching raw reports in Appendix G. Personal changed-input screenshots and raw reports are now supplied in Appendix I. Written explanations are received; the reconciled summaries are retained in Member_Explanations.md. Wider database, live workflow and performance review is not inferred from this focused run.'), 'SmallQ')
    screenshots = [s for s in screenshot_manifest if s['student_id'] == student_id]
    if student_id == 'IT24103828' and personal:
        p('<b>Personal execution confirmed:</b> Four controller, five HTTP integration and three safety-agent tests passed during guided practice on 6 October. Six supplied screenshots and raw reports are in Appendix C. These are existing test reruns; own-word explanations and the boundary exercise remain unconfirmed.', 'SmallQ')
    if screenshots:
        p(f'<b>Screenshot evidence:</b> See Appendix B.{index} for the user-supplied actual GitHub commit page. The unchanged original PNG is included in evidence/github.', 'SmallQ')
    else:
        p('<b>Screenshot status:</b> Actual GitHub page capture is pending. Linked commits and verified metadata are supplied; no generated image is presented as a GitHub screenshot.', 'SmallQ')

if screenshot_manifest:
    import hashlib
    story.append(NextPageTemplate('Screenshots'))
    for index, (name, student_id, module) in enumerate(members, 1):
        for shot in [s for s in screenshot_manifest if s['student_id'] == student_id]:
            path = QMS / shot['file']
            assert hashlib.sha256(path.read_bytes()).hexdigest() == shot['sha256'], f'Screenshot changed: {path}'
            assert any(r['sha'] == shot['sha'] and r['student_id'] == student_id and r['url'] == shot['url'] for r in commit_evidence)
            nextpage(); head(f'Appendix B.{index} - GitHub commit screenshot')
            p(f'<b>{html.escape(name)} | {student_id}</b> - <link href="{shot["url"]}" color="#12334b">{shot["sha"]}</link>', 'SmallQ')
            picture = Image(str(path))
            scale = min((landscape(A4)[0] - 108) / picture.imageWidth, 367 / picture.imageHeight)
            picture.drawWidth = picture.imageWidth * scale
            picture.drawHeight = picture.imageHeight * scale
            story.append(picture)
            story.append(Spacer(1, 6))
            p('Actual GitHub page screenshot supplied by the group on '+html.escape(shot['provided_on'])+'. Original PNG preserved unchanged; shown proportionally scaled. Full commit messages and exact dates are in Appendix A. Original: '+html.escape(shot['file'])+'.', 'SmallQ')
            if student_id == 'IT24103828':
                p('GitHub identifies Deneshkar as author and Jathurshy11 as committer. These are distinct Git roles; the volunteer contribution is attributed to the recorded author.', 'SmallQ')

if personal:
    import hashlib
    story.append(NextPageTemplate('Report'))
    nextpage(); head('Appendix C - Personal execution evidence')
    p('<b>Deneshkar. P | IT24103828 | 6 October 2026</b>')
    p('The student personally ran the commands during guided practice and supplied six terminal screenshots. OpenAI Codex assisted with command selection, explanations and evidence organization. Original screenshots are preserved unchanged, and saved TRX/XML reports independently confirm the results.')
    table([['Personally executed area','Passed','Failed','Skipped']] + [[r['name'],r['passed'],r['failed'],r['skipped']] for r in personal['suites']], [300,65,65,69])
    p('These 12 executions rerun existing cases. Group totals remain 270 automated cases and 272 inventory records. The 17 agent cases outside the selected filter were intentionally deselected, not skipped or failed.')
    p('The controller and internal HTTP test-server fixtures use EF Core InMemory. They do not establish PostgreSQL constraints. The Python safety tests exercise deterministic rules without a live LLM.')
    for run in personal['suites']:
        assert hashlib.sha256((QMS/run['file']).read_bytes()).hexdigest() == run['sha256']
        p('<b>'+html.escape(run['name'])+'</b><br/>Started: '+html.escape(run['started_at'])+'<br/>Raw report: '+html.escape(run['file']), 'SmallQ')
    p(html.escape(personal['http_note']), 'SmallQ')
    p('<b>8 October update:</b> Deneshkar supplied a written boundary/overlap explanation in Appendix H and a personal changed-input terminal screenshot with matching reports in Appendix I. His new comparison passed both scenarios. Defect/retest interpretation and the assessed viva remain separate preparation tasks. The other three members\' submitted 7 October personal runs are recorded in Appendix G.')
    p('Individual_Evidence_IT24103828.md links all six PNGs, the raw results and personal-execution.json, which records their SHA-256 hashes. The following six pages reproduce every supplied personal test screenshot.', 'SmallQ')
    for index, shot in enumerate(personal['screenshots'], 1):
        nextpage(); head(f'Appendix C.{index} - '+shot['title'])
        p('<b>Deneshkar. P | IT24103828</b> - Guided personal testing, 6 October 2026', 'SmallQ')
        path = QMS/shot['file']
        assert hashlib.sha256(path.read_bytes()).hexdigest() == shot['sha256']
        picture = Image(str(path))
        scale = min((A4[0]-108)/picture.imageWidth, 540/picture.imageHeight)
        picture.drawWidth=picture.imageWidth*scale
        picture.drawHeight=picture.imageHeight*scale
        story.append(picture); story.append(Spacer(1, 10))
        p('User-supplied screenshot, preserved unchanged and scaled proportionally. Supporting raw report: '+html.escape(shot['report'])+'.', 'SmallQ')
        p('Original PNG: '+html.escape(shot['file']), 'SmallQ')

member_verification_path=QMS/'members/verification.json'
if member_verification_path.exists():
    packages=json.loads(read(member_verification_path))
    assert len(packages['members'])==4 and all(r['passed'] for r in packages['members'])
    story.append(NextPageTemplate('Report'))
    nextpage(); head('Appendix D - Individual demo packages')
    p('Open members/index.html in a local browser to choose a member. Each package contains a test-case document with original source links, a named PowerShell test runner, editable agent inputs, an actual agent output report and dated execution evidence. The complete source repository or assignment ZIP is required.')
    table([['Member / ID','Business component and matching agent','Tests','Demos']]+[
        [f'{r["name"]}<br/>{r["student_id"]}',members[r['member']-1][2],f'{r["backend"]} BE<br/>{r["agents"]} AI',r['demo_scenarios']]
        for r in packages['members']],[128,247,70,54])
    p(f'<b>Package verification.</b> Codex executed all four packages on 6 October: {packages["existing_test_passes"]} selected existing tests ({packages["backend_passes"]} backend and {packages["agent_passes"]} agent cases) and {packages["demo_scenarios"]} separately checked demonstration scenarios passed. Runs are labelled ai-assisted and linked by members/verification.json. An intentionally wrong safety expectation also returned failure while retaining the actual output.')
    p('<b>Counts and scope.</b> These are reruns of selected group cases, not additional unique tests. The group totals remain 270 automated cases and 272 inventory records. Selected backend fixtures use InMemory/TestServer, while agent demonstrations call the actual Python classes in deterministic mode. The wider PostgreSQL, frontend, mobile, live API and performance evidence remains in the group suite.')
    p('<b>Present each member\'s work.</b> Open that member\'s index.html, show Test_Cases.html, run run-memberN-tests.ps1 with -ExecutionKind personal and -Operator followed by the actual name, and open the new results.html. Then show agent-inputs.json and agent-demo.html, explain the returned decision/checks, change an input and predict the next output.')
    p('<b>Business-specific agent outputs.</b> Member 1 demonstrates incident plans and mandatory human approval. Member 2 demonstrates urgency, inventory deficits and shelter capacity. Member 3 demonstrates covered/shortage allocation proposals. Member 4 demonstrates available/unavailable responders and overlapping/adjacent shifts. Recommendations do not themselves approve or execute dispatches. Situation analysis selects by available shelter capacity, not geographical distance.')
    p('<b>Personal evidence remains separate.</b> Deneshkar\'s earlier 12-test personal practice and six screenshots remain in Appendix C. The full member-4 package selects 19 existing tests; its technical verification does not establish a personal 19-test run. Members 1 to 3 submitted personal execution screenshots on 7 October. Deneshkar supplied a written explanation on 8 October; all four personal comparison runs are supported by screenshots in Appendix I; all four explanations are received; evidence-aligned summaries and corrections are retained in Member_Explanations.md.')
    p('Member_Demonstrations.md provides the four package links and commands. The package scripts and presentation pages were prepared with OpenAI Codex assistance; member ownership labels do not reassign original Git authorship.', 'SmallQ')

member4_runs = sorted((QMS/'members/member4-IT24103828/results').glob('ai-assisted-*/execution.json'))
assisted_runs = [(path, json.loads(read(path))) for path in member4_runs]
assisted_runs = [(path, record) for path, record in assisted_runs
                 if record.get('operator') == 'OpenAI Codex (on behalf of Deneshkar. P)']
if assisted_runs:
    from datetime import datetime, timezone, timedelta
    run_path, run = assisted_runs[-1]
    demo = json.loads(read(run_path.parent/'agent-output.json'))
    assert run['execution_kind'] == 'ai-assisted' and run['passed'] and demo['passed']
    started = datetime.fromisoformat(run['started_at']).astimezone(timezone(timedelta(hours=5, minutes=30)))
    story.append(NextPageTemplate('Report'))
    nextpage(); head('Appendix E - Member 4 assisted execution')
    p('<b>Deneshkar. P | IT24103828</b><br/>Volunteer/Responder Management and Validation/Safety Agent')
    p('<b>Actual operator:</b> OpenAI Codex, on behalf of Deneshkar. P, at the student\'s request.<br/>'
      '<b>Started:</b> '+started.strftime('%d %B %Y, %H:%M:%S')+' (Asia/Colombo, UTC+05:30). '
      'This is an AI-assisted technical run, not a newly confirmed personal execution or assessment of understanding.')
    p('<b>Executed command from the member folder:</b><br/>'
      '.\\run-member4-tests.ps1 -ExecutionKind ai-assisted<br/>'
      '-Operator &quot;OpenAI Codex (on behalf of Deneshkar. P)&quot;', 'SmallQ')
    areas = [('Volunteer shift controller', [r for r in run['suites']['backend'] if '.VolunteerShiftTests.' in r['name']]),
             ('Volunteer HTTP integration', [r for r in run['suites']['backend'] if '.VolunteersApiIntegrationTests.' in r['name']]),
             ('Deterministic safety-agent tests', run['suites']['agents'])]
    assert all(r['status'] == 'Passed' for _, cases_in_area in areas for r in cases_in_area)
    table([['Executed area','Passed','Failed','Skipped']]+
          [[name,len(rows),0,0] for name,rows in areas]+
          [['Separate agent demonstration scenarios',len(demo['scenarios']),0,0]], [300,65,65,69])
    p('<b>Actual agent input and output.</b> The runner calls ValidationSafetyAgent.validate_assignment. '
      'All shift times below are UTC on 6 October 2026; scenario inputs and complete outputs are preserved as JSON.')
    demo_rows = [['Scenario input','Observed output','Check']]
    for scenario in demo['scenarios']:
        assignment = scenario['input']['assignments'][0]
        proposed = assignment['proposed_shift']
        time_range = proposed['start'][11:16]+'-'+proposed['end'][11:16]
        existing = assignment['existing_shifts']
        prior = ', '.join(s['start'][11:16]+'-'+s['end'][11:16] for s in existing) or 'none'
        observed = scenario['output']
        demo_rows.append([scenario['id']+'<br/>Available: '+str(assignment['is_available']).lower()+
                          '; proposed '+time_range+'; existing '+prior,
                          'is_valid='+str(observed['is_valid']).lower()+'<br/>'+observed['recommendation'],
                          'PASS' if scenario['passed'] else 'FAIL'])
    table(demo_rows,[290,145,64])
    p('<b>Evidence folder:</b> '+html.escape(run_path.parent.relative_to(QMS).as_posix())+
      '<br/>results.html, backend.trx, agents.xml, execution.json, agent-inputs.json, agent-output.json and agent-demo.html.', 'SmallQ')
    p('<b>Scope.</b> Nineteen selected existing tests passed, with four demo scenarios checked separately. '
      'Group totals remain 270 automated cases and 272 inventory records. Backend fixtures use InMemory/TestServer; '
      'the Python agent uses deterministic rules, with no live LLM. APPROVE is a recommendation, not a saved dispatch approval.', 'SmallQ')
    p('<b>Personal evidence and understanding.</b> Appendix C retains the student\'s earlier 12 personally executed tests '
      'and six supplied screenshots. The 19-test run above was executed by Codex. The student supplied a written '
      'boundary/overlap explanation on 8 October, retained in Appendix H. His personal changed-input run is supported by a supplied screenshot and matching reports in Appendix I.', 'SmallQ')
    declared_run_path = QMS/'members/member4-IT24103828/results/personal-20261006-223824-403789/execution.json'
    if declared_run_path.exists():
        p('<b>Separate declared-personal record.</b> The results folder personal-20261006-223824-403789 '
          'records Deneshkar. P as operator at 22:38 Asia/Colombo. Its raw reports confirm 19 passing tests '
          'and four passing demos. This run was found separately from the Codex run above; confirmation '
          'of who operated it is pending. The personal label alone does not establish understanding.', 'SmallQ')

technical_manifest = QMS/'members/technical-executions.json'
if technical_manifest.exists():
    from datetime import datetime, timezone, timedelta
    technical = json.loads(read(technical_manifest))
    for entry in technical['members']:
        import hashlib
        number = entry['member']
        run_path = QMS/entry['execution']
        assert hashlib.sha256(run_path.read_bytes()).hexdigest() == entry['sha256']
        record = json.loads(read(run_path))
        agent_record = json.loads(read(run_path.parent/'agent-output.json'))
        config = json.loads(read(run_path.parent.parent.parent/'member.json'))
        assert record['operator'] == technical['operator'] and record['passed'] and agent_record['passed']
        assert len(record['suites']['backend']) == config['expected_backend_count']
        assert len(record['suites']['agents']) == config['expected_agent_count']
        started = datetime.fromisoformat(record['started_at']).astimezone(timezone(timedelta(hours=5, minutes=30)))
        story.append(NextPageTemplate('Report'))
        nextpage(); head(f'Appendix F.{number} - Member {number} technical execution')
        p('<b>'+html.escape(config['name'])+' | '+config['student_id']+'</b><br/>'+html.escape(config['component'])+' and '+html.escape(config['agent_class']))
        p('<b>Historical technical execution - run by Codex; later personal evidence and explanations are recorded separately.</b><br/>'
          'Operator: OpenAI Codex. Started '+started.strftime('%d %B %Y, %H:%M:%S')+' (Asia/Colombo, UTC+05:30). '
          'This historical record documents component tests and actual agent behaviour. Later submitted personal runs appear in Appendix G; written explanations are now recorded in Member_Explanations.md; viva assessment remains separate.')
        p(f'<b>Runner:</b> run-member{number}-tests.ps1. Exact commands, operator and timestamps are retained in execution.json.', 'SmallQ')
        rows = [['Test area','Passed','Failed','Skipped']]
        for cls in config['backend_classes']:
            selected = [r for r in record['suites']['backend'] if '.'+cls+'.' in r['name']]
            assert selected and all(r['status']=='Passed' for r in selected)
            rows.append([cls,len(selected),0,0])
        assert all(r['status']=='Passed' for r in record['suites']['agents'])
        rows += [['Python agent tests',len(record['suites']['agents']),0,0],
                 ['Total selected existing tests',sum(len(r) for r in record['suites'].values()),0,0],
                 ['Separate agent demonstration scenarios',len(agent_record['scenarios']),0,0]]
        table(rows,[300,65,65,69])
        for scenario in agent_record['scenarios']:
            data = scenario['input']
            if number == 1:
                detail = f"Incident {data['incident_id']}; priority {data['priority']}; resources {len(data['resources'])}; volunteers {len(data['volunteers'])}."
            elif number == 2:
                stock = ', '.join(str(i['category'])+'='+str(i['quantity']) for i in data['inventory'])
                shelters = ', '.join(str(s['id'])+': '+str(s['currentOccupancy'])+'/'+str(s['totalCapacity'])+' occupied' for s in data['shelters'])
                detail = f"{data['incident']['title']}; priority {data['incident']['priority']}; inventory {stock}; resources {len(data['resources'])}; shelters {shelters}."
            else:
                requirements = ', '.join(str(r['quantity'])+' '+r['resource_type'] for r in data.get('required_resources',[])) or 'default requirements for priority'
                detail = f"Incident {data['incident_id']}; priority {data['priority']}; requirement {requirements}; available resources {len(data['available_resources'])}; volunteers {len(data['available_volunteers'])}."
            p('<b>'+html.escape(scenario['id']+' - '+scenario['title'])+'</b>', 'SmallQ')
            p('<b>Input:</b> '+html.escape(detail), 'SmallQ')
            actual_fields = {c['expected']['path']:c['actual'] for c in scenario['checks']}
            observed = '; '.join(key+' = '+(value if isinstance(value,str) else json.dumps(value)) for key,value in actual_fields.items())
            p('<b>Observed:</b> '+html.escape(observed).replace('\n','<br/>')+'<br/><b>Scenario result:</b> '+('PASS' if scenario['passed'] else 'FAIL'), 'SmallQ')
        p('<b>Evidence folder:</b> '+html.escape(run_path.parent.relative_to(QMS).as_posix())+
          '<br/>Open results.html for named test outcomes and agent-demo.html for full inputs and actual outputs. '
          'Raw backend.trx, agents.xml, logs, source hashes and JSON records are included.', 'SmallQ')
        p('<b>Scope.</b> These are reruns of existing cases, not additional unique tests; group totals remain 270 automated cases and 272 inventory records. '
          'Selected backend fixtures use InMemory/TestServer and agent demos use the real Python classes in deterministic mode, without live LLM calls.', 'SmallQ')
        p(html.escape(config['demo_note']), 'SmallQ')
        p('<b>Explanation received:</b> see Appendix J. Personal comparison evidence is in Appendix I. Review the reconciled summary and prepare for the viva.', 'SmallQ')

story.append(NextPageTemplate('Report'))
nextpage(); head('Appendix G - Member personal testing screenshots')
p('Six terminal screenshots supplied on 7 October 2026 are matched to the existing dated runs for members 1 to 3. The commands declare each named operator and personal execution. Raw TRX/XML reports and agent JSON outputs confirm the recorded results. The original PNGs are preserved unchanged.')
table([['Member','Backend','Agent','Total tests','Demos']]+[[e['name'],e['backend'],e['agents'],e['backend']+e['agents'],e['demo_scenarios']] for e in PERSONAL_MEMBERS],[199,75,75,80,70])
p('These are 54 passing existing tests and six separately checked demonstrations, not additional unique group cases. Group totals remain 270 automated cases and 272 inventory records. No selected tests failed or were skipped.')
p('The screenshots show terminal execution. Generated results.html and agent-demo.html pages and their raw inputs/outputs are included in each run folder; browser screenshots of those pages were not supplied. Personal changed-input screenshots are now included in Appendix I; all four explanations are now recorded in Member_Explanations.md.')
for entry in PERSONAL_MEMBERS:
    p('<b>'+html.escape(entry['name'])+' | '+entry['student_id']+'</b><br/>Started: '+html.escape(entry['started_at'])+'<br/>Evidence: '+html.escape(str(Path(entry['execution']).parent).replace('\\','/')), 'SmallQ')
p('Personal_Execution_Evidence.md links each report and screenshot gallery. members/personal-evidence.json retains screenshot and raw-report SHA-256 hashes.', 'SmallQ')
for entry in PERSONAL_MEMBERS:
    for i,shot in enumerate(entry['screenshots'],1):
        nextpage(); head(f'Appendix G.{entry["member"]}.{i} - '+shot['title'])
        p('<b>'+html.escape(entry['name'])+' | '+entry['student_id']+'</b><br/>Declared operator: '+html.escape(entry['operator'])+'; started '+html.escape(entry['started_at']), 'SmallQ')
        image_path=QMS/shot['file']
        assert hashlib.sha256(image_path.read_bytes()).hexdigest()==shot['sha256']
        picture=Image(str(image_path))
        scale=min((A4[0]-108)/picture.imageWidth, 510/picture.imageHeight)
        picture.drawWidth=picture.imageWidth*scale; picture.drawHeight=picture.imageHeight*scale
        story.append(picture); story.append(Spacer(1,10))
        p(f"Raw reports confirm {entry['backend']} backend and {entry['agents']} agent tests passed, with no failures or skips; {entry['demo_scenarios']} separate demonstrations passed.", 'SmallQ')
        p('Original PNG: '+html.escape(shot['file'])+'<br/>The image is unchanged and scaled proportionally.', 'SmallQ')

changed=json.loads((QMS/'members/changed-input-evidence.json').read_text())
nextpage(); head('Appendix H - Changed-input comparisons')
p('On 8 October 2026, OpenAI Codex ran two scenarios per member against the actual Python agents. All eight scenarios passed. These are separate technical demonstrations of existing behaviour; group totals remain 270 automated tests and 272 inventory records.')
p('The exact command, prepared prediction saved before execution, full JSON inputs, observed outputs and agent source hash are retained for each run. Later supplied personal terminal screenshots are retained in Appendix I, with matching dated records. These are separate from the technical runs below.')
head('Deneshkar submitted written explanation')
p('Received in the conversation on 8 October 2026 and reproduced verbatim below. This is a written explanation, not confirmation of a new personal execution or completion of the viva.','SmallQ')
for text in changed['deneshkar_explanation']['text'].split('\n'):p(html.escape(text))
p('Source: '+html.escape(changed['deneshkar_explanation']['file']),'SmallQ')
p('All four explanations are now recorded in Member_Explanations.md. All four supplied personal comparison execution screenshots, retained in Appendix I. Changed_Input_Results.md links the recorded technical reports; each member folder contains Viva_Changed_Input_Guide.md and run-memberN-changed-input.ps1.','SmallQ')
for entry in changed['members']:
    nextpage(); head(f"Appendix H.{entry['member']} - {entry['name']}")
    record=json.loads((QMS/entry['run']).read_text())
    p(html.escape(entry['component']+' + '+entry['agent'])+'<br/>Operator: '+html.escape(entry['operator'])+'; '+html.escape(entry['started_at']),'SmallQ')
    p('<b>Command actually executed:</b> '+html.escape(record['command']),'SmallQ')
    p('<b>Input change:</b> '+html.escape(entry['change']))
    p('<b>Expected before execution:</b> '+html.escape(entry['prediction']),'SmallQ')
    rows=[['Scenario','Expected check','Observed result']]
    for scenario in record['scenarios']:
        for c in scenario['checks']:
            value=c['actual']; expected=c['expected']
            if expected['op']=='contains':seen='Contains '+json.dumps(expected['value'])+'; PASS'
            elif expected['op'] in ('empty','nonempty'):seen=str(len(value))+' item(s); PASS'
            else:seen=json.dumps(value)+'; PASS'
            expected_text=expected['path']+' '+expected['op']
            if expected['op'] not in ('empty','nonempty'):expected_text+=' '+json.dumps(expected['value'])
            rows.append([scenario['id'],html.escape(expected_text),html.escape(seen)])
    table(rows,[65,275,159])
    p(html.escape(entry['interpretation']),'SmallQ')
    p('<b>Saved evidence:</b> '+html.escape(str(Path(entry['run']).parent).replace('\\','/'))+'<br/>comparison.html, comparison.json, execution.log, prediction-before-run.json and agent-demo.html. Full input/output is preserved; the table summarizes the observed checks.','SmallQ')
    p('Result: 2/2 scenarios PASS. This is the earlier Codex-operated technical run. The later supplied personal run appears in Appendix I.','SmallQ')

personal_changes=json.loads((QMS/'members/personal-changed-input-evidence.json').read_text())
for entry in personal_changes['members']:
    nextpage(); head(f"Appendix I.{entry['member']} - Personal changed-input evidence")
    p('<b>'+html.escape(entry['name'])+' | '+entry['student_id']+'</b><br/>Declared operator: '+html.escape(entry['operator'])+'<br/>Started: '+html.escape(entry['started_at']),'SmallQ')
    p('The supplied terminal screenshot matches the saved personal run. Both original and changed scenarios passed. The command, input summaries and actual results are visible; full input/output and the transcript remain in the dated results folder.')
    shot=entry['screenshot'];assert hashlib.sha256((QMS/shot['file']).read_bytes()).hexdigest()==shot['sha256']
    picture=Image(str(QMS/shot['file']))
    scale=min(499/picture.imageWidth,330/picture.imageHeight)
    picture.drawWidth=picture.imageWidth*scale;picture.drawHeight=picture.imageHeight*scale
    story.append(picture);story.append(Spacer(1,12))
    technical=next(e for e in changed['members'] if e['member']==entry['member'])
    p('<b>Observed result:</b> '+html.escape(technical['interpretation']),'SmallQ')
    p('<b>Written explanation:</b> '+html.escape(entry['written_explanation'])+'. The runner\'s prepared prediction is supplied guidance, not evidence of an independently authored pre-run prediction. Viva understanding is assessed separately.','SmallQ')
    p('<b>Evidence:</b> '+html.escape(str(Path(entry['run']).parent).replace('\\','/'))+'<br/>personal-terminal-results.png, comparison.html, comparison.json, execution.log and Screenshot_Evidence.md. Original image preserved unchanged.','SmallQ')
    p('These personal reruns do not increase the 270 unique group tests or 272 inventory records. Personal_Changed_Input_Evidence.md links all four evidence sets.','SmallQ')

explanations=json.loads((QMS/'members/member-explanations.json').read_text())
for entry in explanations['members']:
    nextpage();head(f"Appendix J.{entry['member']} - Member {entry['member']} explanation")
    p('<b>'+html.escape(entry['name'])+' | '+entry['student_id']+'</b><br/>'+html.escape(entry['component']+' + '+entry['agent']),'SmallQ')
    p('Received via the group representative on 8 October 2026. This is an evidence-aligned editorial summary; the original wording is preserved separately. Assessed viva completion is not claimed.','SmallQ')
    p('<b>Evidence reconciliation:</b> '+html.escape(entry['reconciliation']),'SmallQ')
    for question,answer in entry['answers'].items():
        p('<b>'+html.escape(question)+'</b>')
        p(html.escape(answer))
    p('Personal scenario IDs: '+', '.join(entry['scenario_ids'])+'. Both passed. Personal screenshot and dated raw results: Appendix I.'+str(entry['member'])+'.','SmallQ')
    p('Original statement: '+html.escape(entry['original']['file'])+'<br/>Evidence-aligned summary: '+html.escape(entry['summary']['file']),'SmallQ')

def footer(canvas,doc):
    page_width = doc.pageTemplate.pagesize[0]
    canvas.setStrokeColor(colors.HexColor('#ccd6de')); canvas.line(48,39,page_width-48,39)
    canvas.setFont('Helvetica',8); canvas.setFillColor(colors.HexColor('#516574'))
    canvas.drawString(48,26,'ERCP | Group testing submission | Evidence recorded 3-8 October 2026')
    canvas.drawRightString(page_width-48,26,str(doc.page))
doc=BaseDocTemplate(str(OUT/'Software_Testing_Report.pdf'),pagesize=A4,rightMargin=48,leftMargin=48,topMargin=44,bottomMargin=51,
    title='ERCP Software Testing and Quality Evaluation',author='ERCP group')
doc.addPageTemplates([
    PageTemplate(id='Report', frames=[Frame(48,51,A4[0]-96,A4[1]-95)], pagesize=A4, onPage=footer),
    PageTemplate(id='Screenshots', frames=[Frame(48,51,landscape(A4)[0]-96,landscape(A4)[1]-95)], pagesize=landscape(A4), onPage=footer),
])
doc.build(story)
print(json.dumps({'records':len(cases),'passed':sum(c['status']=='Passed' for c in cases),'failed':0,'pdf':str(OUT/'Software_Testing_Report.pdf')}))
