"""Run real member agents with saved inputs; render actual outputs and expectations."""
import argparse
import hashlib
import importlib
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from paths import QMS, REPO
from member_support import member_config, write_json, write_html, json_panel, esc, refresh_member_index

def execute(number, output, samples=None, execution_kind='practice', operator='Unrecorded'):
    folder, config = member_config(number)
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    # Set before importing any original module; its dotenv loader respects this key.
    os.environ['GEMINI_API_KEY'] = ''
    sys.path.insert(0, str(REPO / 'ai-agents'))
    module = importlib.import_module(config['agent_module'])
    agent = getattr(module, config['agent_class'])()
    operation = getattr(agent, config['agent_method'])
    source = REPO / 'ai-agents' / (config['agent_module'] + '.py')
    sample_path = Path(samples) if samples else folder / 'agent-inputs.json'
    scenarios = json.loads(sample_path.read_text(encoding='utf-8-sig'))
    if not isinstance(scenarios, list) or not scenarios:
        raise ValueError('Provide a nonempty list of scenarios.')
    rows = []
    for scenario in scenarios:
        checks = []
        result = None
        error = None
        try:
            # Preserve the original input even if an agent mutates its argument.
            result = operation(json.loads(json.dumps(scenario['input'])))
            for expected in scenario['checks']:
                value = result
                for part in expected['path'].split('.'):
                    value = value[int(part)] if isinstance(value, list) else value[part]
                op = expected.get('op', 'equals')
                if op == 'equals': passed = value == expected['value']
                elif op == 'contains': passed = expected['value'] in value
                elif op == 'nonempty': passed = bool(value)
                elif op == 'empty': passed = value == []
                else: raise ValueError('Unknown check operation: ' + op)
                checks.append(dict(expected=expected, actual=value, passed=passed))
        except Exception as exc:
            error = f'{type(exc).__name__}: {exc}'
        rows.append(dict(id=scenario['id'], title=scenario['title'], input=scenario['input'],
                         output=result, checks=checks, error=error,
                         passed=bool(checks) and all(c['passed'] for c in checks) and error is None))
    record = dict(member=config['name'], student_id=config['student_id'], component=config['component'],
                  agent=config['agent_class'], method=config['agent_method'], generated_at=datetime.now().astimezone().isoformat(),
                  execution_kind=execution_kind, operator=operator, live_llm=False,
                  agent_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),
                  scenarios=rows, passed=all(r['passed'] for r in rows))
    write_json(output/'agent-inputs.json', scenarios)
    write_json(output/'agent-output.json', record)
    body = f'<p><b>{esc(config["name"])} | {esc(config["student_id"])}</b><br>{esc(config["component"])} &rarr; {esc(config["agent_class"])}</p>'
    body += f'<p class="note">Execution: {esc(execution_kind)}. Operator: {esc(operator)}. Time: {esc(record["generated_at"])}.<br>Actual Python agent method: {esc(config["agent_method"])}. Deterministic mode; no live LLM calls. A recommendation does not itself approve or save a dispatch.</p>'
    body += '<p>' + esc(config['demo_note']) + '</p><p><a href="agent-output.json">Raw output</a> | <a href="agent-inputs.json">Saved input</a></p>'
    for row in rows:
        status = 'PASS' if row['passed'] else 'FAIL'
        body += f'<section><h2>{esc(row["id"])}: {esc(row["title"])} <span class="{status.lower()}">{status}</span></h2>'
        body += '<table><tr><th>Expected check</th><th>Observed value</th><th>Result</th></tr>'
        for check in row['checks']:
            body += '<tr><td>'+esc(json.dumps(check['expected']))+'</td><td>'+esc(json.dumps(check['actual']))+'</td><td>'+('PASS' if check['passed'] else 'FAIL')+'</td></tr>'
        body += '</table><div class="grid"><div><h3>Input</h3>'+json_panel(row['input'])+'</div><div><h3>Actual output</h3>'+json_panel(row['output'])+'</div></div>'
        if row['error']: body += '<p class="fail">'+esc(row['error'])+'</p>'
        body += '</section>'
    write_html(output/'agent-demo.html', 'Member '+str(number)+' - Agent demonstration', body)
    print(f'Member {number} agent scenarios: {sum(r["passed"] for r in rows)}/{len(rows)} passed. {output / "agent-demo.html"}', flush=True)
    return record

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--member', type=int, choices=range(1,5), required=True)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--samples', type=Path)
    parser.add_argument('--execution-kind', choices=['practice','personal','ai-assisted'], default='practice')
    parser.add_argument('--operator', default='Unrecorded')
    args = parser.parse_args()
    folder, _ = member_config(args.member)
    destination = args.output or folder/'results'/('demo-'+datetime.now().strftime('%Y%m%d-%H%M%S-%f'))
    result = execute(args.member, destination, args.samples, args.execution_kind, args.operator)
    refresh_member_index(args.member)
    sys.exit(0 if result['passed'] else 1)
