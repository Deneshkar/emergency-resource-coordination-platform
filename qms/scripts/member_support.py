"""Shared presentation helpers for individually runnable ERCP demonstrations."""
import html
import json
from pathlib import Path
from paths import QMS

def member_config(number):
    matches = list((QMS / 'members').glob(f'member{number}-*/member.json'))
    if len(matches) != 1:
        raise ValueError(f'Expected one package for member {number}; run build_member_packages.py.')
    return matches[0].parent, json.loads(matches[0].read_text(encoding='utf-8-sig'))

def write_json(path, value):
    Path(path).write_text(json.dumps(value, indent=2, ensure_ascii=True) + '\n', encoding='utf-8', newline='\n')

def esc(value):
    return html.escape(str(value), quote=True)

def json_panel(value):
    return '<pre>' + esc(json.dumps(value, indent=2, ensure_ascii=True)) + '</pre>'

def write_html(path, title, body):
    Path(path).write_text('''<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>''' + esc(title) + '''</title>
<style>body{font:16px/1.55 system-ui,sans-serif;color:#173247;background:#edf2f5;margin:0}
main{max-width:1100px;margin:32px auto;padding:32px;background:white;border-radius:12px}
h1{font-size:30px}h2{margin-top:28px}a{color:#145797}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f0f4f7;padding:18px;font:13px/1.5 Consolas,monospace}
table{border-collapse:collapse;width:100%;font-size:14px}td,th{border:1px solid #c6d4df;padding:10px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#e4edf4}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.note{background:#eaf2f8;padding:16px}.pass{color:#14652e}.fail{color:#a31919}details{margin:12px 0}section{border-top:1px solid #c6d4df;margin-top:28px;padding-top:12px}
@media(max-width:750px){main{margin:0;padding:18px}.grid{display:block}}
@media print{body{background:white}main{margin:0;padding:0}pre{font-size:10px}section{break-inside:avoid}}</style>
<main><h1>''' + esc(title) + '</h1>' + body + '</main></html>', encoding='utf-8', newline='\n')

def refresh_member_index(number):
    folder, config = member_config(number)
    body=f'<p><b>{esc(config["name"])} | {config["student_id"]}</b><br>{esc(config["component"])} + {esc(config["agent_class"])}</p>'
    body+='<p><a href="Test_Cases.html">My test cases and source links</a> | <a href="README.md">Run instructions</a> | <a href="agent-inputs.json">Editable agent inputs</a></p>'
    if (folder/'Viva_Changed_Input_Guide.md').exists():
        body+='<p><a href="Viva_Changed_Input_Guide.md">Changed-input command and viva guide</a></p>'
    body+='<p class="note">Run run-member'+str(number)+'-tests.ps1 to create new results. AI-assisted entries verify the package; they are not personal execution evidence. Prior group results remain historical. Explain your own fixtures, assertions and agent decisions.</p>'
    body+='<h2>Saved executions and actual agent outputs</h2><table><tr><th>Run folder</th><th>Execution label / operator</th><th>Evidence</th></tr>'
    for directory in sorted((folder/'results').glob('*'), reverse=True):
        if not directory.is_dir(): continue
        record_path=directory/'execution.json'
        if not record_path.exists(): record_path=directory/'agent-output.json'
        if not record_path.exists(): continue
        record=json.loads(record_path.read_text(encoding='utf-8'))
        links=[]
        for filename,label in [('results.html','Test results'),('comparison.html','Changed-input comparison'),('agent-demo.html','Agent input and output'),('Screenshot_Evidence.md','Supplied screenshots')]:
            if (directory/filename).exists(): links.append(f'<a href="results/{esc(directory.name)}/{filename}">{label}</a>')
        body+='<tr><td>'+esc(directory.name)+'</td><td>'+esc(record['execution_kind'])+' / '+esc(record['operator'])+'<br>'+('PASS' if record['passed'] else 'FAIL')+'</td><td>'+' | '.join(links)+'</td></tr>'
    body+='</table>'
    if number==4:
        body+='<p><a href="../../submission/Individual_Evidence_IT24103828.md">Earlier verified personal execution: 12 tests and six screenshots</a></p>'
    write_html(folder/'index.html',f'Member {number} - My testing demonstration',body)
