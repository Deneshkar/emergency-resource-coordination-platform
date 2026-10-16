"""Live HTTP integration/security tests. Run only against the isolated QMS instance."""
import json
import os
import uuid
from pathlib import Path
import requests
import pytest

BASE = os.environ.get('QMS_API', 'http://127.0.0.1:5009')
assert BASE.startswith(('http://127.0.0.1:', 'http://localhost:')), 'Local test instance required'

def call(method, path, token=None, **kwargs):
    headers = {'Authorization': f'Bearer {token}'} if token else {}
    return requests.request(method, BASE + path, headers=headers, timeout=30, **kwargs)

@pytest.fixture(scope='module')
def coordinator():
    response = call('POST', '/api/auth/login', json={'email':'coordinator@ercp.org','password':'Coord@123'})
    assert response.status_code == 200, response.text
    return response.json()['token']

def citizen():
    email = f'qms-{uuid.uuid4().hex}@test.local'
    response = call('POST','/api/auth/register',json={'fullName':'QMS Citizen','email':email,'password':'Testing123!','role':'Citizen'})
    assert response.status_code == 201, response.text
    return response.json()['token'], email

def test_E2E01_incident_plan_dispatch_validation_approval_persistence(coordinator):
    token, email = citizen()
    incident = call('POST','/api/incident',token,json={'title':'Warehouse fire emergency','description':'Smoke is spreading through the main storage building and people need rescue.',
        'location':'Colombo Main Road','category':'Fire','priority':'High','affectedCount':5,'reporterContact':email,'autoGeneratePlan':False})
    assert incident.status_code == 201, incident.text
    incident_id = incident.json()['id']
    plan = call('POST',f'/api/incident/{incident_id}/generate-plan',coordinator,json={})
    assert plan.status_code in (200,201), plan.text
    volunteer = call('POST','/api/volunteers',coordinator,json={'name':'QMS Responder','email':f'{uuid.uuid4().hex}@test.local','phone':'0770000000','skills':'medical, rescue'})
    assert volunteer.status_code == 201, volunteer.text
    volunteer_id = volunteer.json()['id']
    dispatch = call('POST','/api/dispatches',coordinator,json={'incidentId':incident_id,'priority':'High'})
    assert dispatch.status_code == 201, dispatch.text
    dispatch_id = dispatch.json()['id']
    # Approval must fail before safety validation.
    assert call('PUT',f'/api/dispatches/{dispatch_id}/status',coordinator,json={'status':'Approved'}).status_code == 400
    task = call('POST',f'/api/dispatches/{dispatch_id}/tasks',coordinator,json={'volunteerId':volunteer_id,'taskType':'Rescue'})
    assert task.status_code == 200, task.text
    validation = call('POST',f'/api/validations/dispatch/{dispatch_id}',coordinator,json={})
    assert validation.status_code == 200, validation.text
    assert validation.json()['isValid'] is True, validation.text
    assert validation.json()['recommendation'] == 'APPROVE'
    approved = call('PUT',f'/api/dispatches/{dispatch_id}/status',coordinator,json={'status':'Approved'})
    assert approved.status_code == 200, approved.text
    saved = call('GET',f'/api/dispatches/{dispatch_id}',coordinator)
    assert saved.json()['status'] == 'Approved'
    assert saved.json()['tasks'][0]['volunteerId'] == volunteer_id
    # Locked tasks must stay immutable after approval.
    assert call('POST',f'/api/dispatches/{dispatch_id}/tasks',coordinator,json={'volunteerId':volunteer_id,'taskType':'Medical'}).status_code == 409
    result = {'incident_id':incident_id,'plan_id':plan.json().get('id'),'dispatch_id':dispatch_id,
        'volunteer_id':volunteer_id,'validation':validation.json(),'saved_dispatch':saved.json(),
        'components':['HTTP client','ASP.NET Core','planner integration','safety service','PostgreSQL'],
        'scope':'API integration workflow; not a browser or mobile E2E test'}
    out = Path(os.environ.get('QMS_WORKFLOW_OUTPUT', str(Path(__file__).resolve().parents[1] / 'evidence/final/workflow.json')))
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result,indent=2),encoding='utf-8')

@pytest.mark.parametrize('role',['Admin','Coordinator'])
def test_SEC04_live_public_role_escalation_blocked(role):
    r = call('POST','/api/auth/register',json={'fullName':'QMS Test','email':f'{uuid.uuid4().hex}@test.local','password':'Testing123!','role':role})
    assert r.status_code == 400

@pytest.mark.parametrize('method,path,payload',[
    ('POST','/api/dispatches',{'incidentId':1,'priority':'High'}),
    ('PUT','/api/dispatches/1/status',{'status':'Approved'}),
    ('POST','/api/dispatches/1/tasks',{'volunteerId':'00000000-0000-0000-0000-000000000001','taskType':'Rescue'}),
    ('PUT','/api/dispatches/1/tasks/1',{'volunteerId':'00000000-0000-0000-0000-000000000001','taskType':'Rescue'}),
    ('DELETE','/api/dispatches/1/tasks/1',None),
    ('POST','/api/dispatches/1/propose-allocation',{'allocationPlanId':1}),
    ('POST','/api/validations/dispatch/1',{})])
def test_SEC05_citizen_cannot_mutate_dispatch(method,path,payload):
    token,_ = citizen()
    assert call(method,path,token,json=payload).status_code == 403

@pytest.mark.parametrize('path',['/api/dispatches','/api/volunteers','/api/incident','/api/auth/me'])
def test_SEC06_anonymous_access_blocked(path):
    assert call('GET',path).status_code == 401

def test_SEC07_sql_injection_login_does_not_authenticate():
    r=call('POST','/api/auth/login',json={'email':"' OR 1=1 --",'password':'anything'})
    assert r.status_code in (400,401)

def test_API01_invalid_incident_is_rejected(coordinator):
    r=call('POST','/api/incident',coordinator,json={'title':'1','description':'bad','location':'none','affectedCount':-1,'reporterContact':'not-email'})
    assert r.status_code == 400

def test_API02_duplicate_registration_is_rejected():
    _,email=citizen()
    r=call('POST','/api/auth/register',json={'fullName':'Duplicate','email':email,'password':'Testing123!','role':'Citizen'})
    assert r.status_code == 409
