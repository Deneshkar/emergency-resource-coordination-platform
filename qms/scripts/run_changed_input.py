"""Run a saved before/after comparison and preserve input, expectations and actual output."""
import argparse, json, sys, hashlib, subprocess, contextlib, io
from datetime import datetime, timezone, timedelta
from pathlib import Path
from member_support import member_config, write_json, write_html, esc, refresh_member_index
from demo_member_agent import execute

def selected_input(number,data):
    if number==1:return {'incident_id':data['incident_id'],'priority':data['priority'],'resources':len(data['resources']),'volunteers':len(data['volunteers'])}
    if number==2:return {'incident':data['incident'],'inventory':data['inventory'],'vehicles':len(data['resources']),
                         'shelters':[{'id':s['id'],'occupancy':f"{s['currentOccupancy']}/{s['totalCapacity']}"} for s in data['shelters']]}
    if number==3:return {'priority':data['priority'],'required_resources':data['required_resources'],'resources':len(data['available_resources']),'volunteers':len(data['available_volunteers'])}
    a=data['assignments'][0]
    return {'is_available':a['is_available'],'existing_shift':a['existing_shifts'][0]['start'][11:16]+'-'+a['existing_shifts'][0]['end'][11:16]+' UTC',
            'proposed_shift':a['proposed_shift']['start'][11:16]+'-'+a['proposed_shift']['end'][11:16]+' UTC'}

def run(number,operator,kind):
    folder,cfg=member_config(number)
    now=datetime.now(timezone(timedelta(hours=5,minutes=30)))
    destination=folder/'results'/('changed-'+now.strftime('%Y%m%d-%H%M%S-%f'))
    destination.mkdir(parents=True)
    plan=json.loads((folder/'changed-input-plan.json').read_text())
    scenarios=json.loads((folder/'changed-inputs.json').read_text())
    command=subprocess.list2cmdline([sys.executable,*sys.argv])
    prediction={'recorded_before_execution':now.isoformat(),'operator':operator,'execution_kind':kind,
                'expected_prediction':plan['expected_prediction'],'prediction_author':plan['prediction_author'],
                'command':command,'input_sha256':hashlib.sha256((folder/'changed-inputs.json').read_bytes()).hexdigest()}
    write_json(destination/'prediction-before-run.json',prediction)
    write_json(destination/'changed-input-plan.json',plan)
    capture=io.StringIO()
    with contextlib.redirect_stdout(capture):
        result=execute(number,destination,folder/'changed-inputs.json',kind,operator)
    transcript='COMMAND\n'+command+'\n\nPREDICTION RECORDED BEFORE EXECUTION\n'+json.dumps(prediction,indent=2)+'\n\nINPUT\n'+json.dumps(scenarios,indent=2)+'\n\nOUTPUT\n'+json.dumps(result,indent=2)+'\n'+capture.getvalue()
    (destination/'execution.log').write_text(transcript,encoding='utf-8')
    result['command']=command;result['change']=plan['change'];result['expected_prediction']=plan['expected_prediction']
    result['execution_started_at']=now.isoformat()
    write_json(destination/'comparison.json',result)
    note='Technical execution at the user\'s request; personal execution and understanding are assessed separately.' if kind=='ai-assisted' else 'Operator is self-declared. Complete Understanding.md separately in your own words.'
    body=f'<p><b>{esc(cfg["name"])} | {cfg["student_id"]}</b> | {esc(cfg["agent_class"])}</p>'
    body+=f'<p>Operator: <b>{esc(operator)}</b> | {esc(now.isoformat())}<br>{esc(note)}</p>'
    body+='<h2>Command actually executed</h2><pre>'+esc(command)+'</pre>'
    body+='<p><b>Changed:</b> '+esc(plan['change'])+'</p><p><b>Expected before execution:</b> '+esc(plan['expected_prediction'])+'</p>'
    body+='<table><tr><th>Scenario and input summary</th><th>Expected checks and actual output</th><th>Result</th></tr>'
    for s in result['scenarios']:
        checks='<br>'.join(esc(c['expected']['path'])+': expected '+esc(json.dumps(c['expected']['value']))+' ('+esc(c['expected']['op'])+'); actual <b>'+esc(json.dumps(c['actual']))+'</b>' for c in s['checks'])
        body+='<tr><td><b>'+esc(s['id'])+' '+esc(s['title'])+'</b><pre>'+esc(json.dumps(selected_input(number,s['input']),indent=2))+'</pre></td><td>'+checks+'</td><td>'+('PASS' if s['passed'] else 'FAIL')+'</td></tr>'
    body+='</table><p>Input columns summarize the fields relevant to this comparison. Complete unabridged input/output is saved in the links below. Deterministic mode; no live LLM call. These are separate demonstrations, not additional unique group tests.</p>'
    body+='<p><a href="agent-demo.html">Full inputs, outputs and checks</a> | <a href="comparison.json">Comparison JSON</a> | <a href="execution.log">Command and full transcript</a> | <a href="prediction-before-run.json">Saved prediction</a></p>'
    write_html(destination/'comparison.html',f'Member {number} changed-input comparison',body)
    refresh_member_index(number)
    print(capture.getvalue(),end='')
    for s in result['scenarios']:
        print(s['id'],json.dumps(selected_input(number,s['input'])), 'PASS' if s['passed'] else 'FAIL')
        for c in s['checks']: print(' ',c['expected']['path'],'=>',json.dumps(c['actual']))
    print('Report:',destination/'comparison.html')
    return result,destination

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--member',type=int,required=True,choices=range(1,5))
    parser.add_argument('--operator',required=True)
    parser.add_argument('--execution-kind',choices=['practice','personal','ai-assisted'],default='practice')
    args=parser.parse_args()
    record,_=run(args.member,args.operator,args.execution_kind)
    sys.exit(0 if record['passed'] else 1)
