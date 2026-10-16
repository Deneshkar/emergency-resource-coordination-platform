"""Prepare copied member scenarios and expectations without altering canonical tests."""
from copy import deepcopy
from member_support import member_config, write_json
import json

def check(path,value,op='equals'):
    return dict(path=path,op=op,value=value)

for number in range(1,5):
    folder,cfg=member_config(number)
    original=json.loads((folder/'agent-inputs.json').read_text())
    before=deepcopy(original[3] if number==4 else original[0])
    after=deepcopy(before)
    before['id']=f'M{number}-C01';after['id']=f'M{number}-C02'
    before['title']='Original input';after['title']='Changed input'
    if number==1:
        after['input']['resources']=[];after['input']['volunteers']=[]
        after['checks']=[check('incidentId',7),check('requiresHumanApproval',True),
                        check('reasoning','No available resources found','contains'),
                        check('reasoning','No available volunteers found','contains')]
        prediction='With resources and volunteers removed, reasoning should report both shortages while requiresHumanApproval remains true.'
        change='resources: 1 to 0; volunteers: 1 to 0. The incident, High priority and affected count stay unchanged.'
    elif number==2:
        after['input']['inventory'][0]['quantity']=50
        after['input']['resources']*=3
        after['input']['shelters'][1]['currentOccupancy']=100
        after['checks']=[check('urgency_score',85),check('nearest_shelter',None),
                        *[check(f'resource_deficiencies.{i}.isDeficit',False) for i in range(3)],check('llm_enhanced',False)]
        prediction='Medical and vehicle deficits should clear; no shelter should be selected because both are full. Urgency remains 85 because the incident is unchanged.'
        change='Medical stock: 20 to 50; available vehicles: 1 to 3; shelter 2 occupancy: 30/100 to 100/100. Food stays 100; shelter 1 stays 10/10; incident and High priority unchanged.'
    elif number==3:
        after['input']['priority']='High';after['input']['available_resources']=[];after['input']['available_volunteers']=[]
        after['checks']=[check('resource_gaps',None,'nonempty'),check('allocated_resources',None,'empty'),
                        check('allocation_plan.requires_human_approval',True),check('allocation_plan.recommendation','REVISE')]
        prediction='The missing vehicle should produce a resource gap and REVISE; human approval remains required.'
        change='Priority: Medium to High; resources: 1 to 0; volunteers: 1 to 0. The explicit one-vehicle requirement and incident ID stay unchanged.'
    else:
        after['input']['assignments'][0]['proposed_shift']['start']='2026-10-06T09:30:00Z'
        after['checks']=[check('is_valid',False),check('recommendation','REVISE'),check('violations.0.code','V2_DOUBLE_BOOKING')]
        prediction='The original adjacent 10:00-11:00 shift should be valid and APPROVE. Changing only its start to 09:30 should produce is_valid=false, REVISE and V2_DOUBLE_BOOKING.'
        change='Only proposed_shift.start changes: 10:00 to 09:30 UTC. Existing shift remains 09:00-10:00, end remains 11:00, volunteer remains available.'
    write_json(folder/'changed-inputs.json',[before,after])
    write_json(folder/'changed-input-plan.json',{'member':number,'change':change,'expected_prediction':prediction,
               'prediction_author':'OpenAI Codex; prepared from existing source and fixtures',
               'personal_execution_status':'Not established by preparation or a technical run'})
    script=f'''param([Parameter(Mandatory=$true)][string]$Operator, [ValidateSet('practice','personal','ai-assisted')][string]$ExecutionKind = 'personal')
$qmsRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
& python (Join-Path $qmsRoot 'scripts/run_changed_input.py') --member {number} --operator $Operator --execution-kind $ExecutionKind
if ($LASTEXITCODE -ne 0) {{ throw 'Changed-input check failed. Retain the output and inspect the dated report.' }}
'''
    (folder/f'run-member{number}-changed-input.ps1').write_text(script,encoding='utf-8')
    print(f'Prepared member {number}: '+change)
