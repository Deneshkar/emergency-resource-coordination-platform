"""Check member selections, saved verification results and local HTML links."""
import hashlib
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse
from paths import QMS, REPO
from member_support import write_json, refresh_member_index

class Links(HTMLParser):
    def __init__(self):
        super().__init__(); self.links=[]
    def handle_starttag(self,tag,attrs):
        if tag=='a': self.links += [v for k,v in attrs if k=='href']

rows=[];backend=set();agents=set()
for item in json.loads((QMS/'members/index.json').read_text()):
    folder=QMS/item['folder']
    config=json.loads((folder/'member.json').read_text())
    candidates=sorted((folder/'results').glob('ai-assisted-*/execution.json'))
    assert candidates, f'No AI-assisted verification: {folder}'
    path=candidates[-1];record=json.loads(path.read_text())
    assert record['execution_kind']=='ai-assisted' and record['passed'] is True
    assert len(record['suites']['backend'])==item['backend']
    assert len(record['suites']['agents'])==item['agents']
    assert set(r['name'] for r in record['suites']['backend'])==set(config['backend_tests'])
    assert set(r['name'] for r in record['suites']['agents'])==set(config['agent_tests'])
    for source,digest in record['source_hashes'].items():
        assert hashlib.sha256((REPO/source).read_bytes()).hexdigest()==digest, f'Source changed since verification: {source}'
    assert hashlib.sha256((QMS/'scripts/test_agents.py').read_bytes()).hexdigest()==record['test_script_sha256']
    demo=json.loads((path.parent/'agent-output.json').read_text())
    assert demo['passed'] and len(demo['scenarios'])==item['demo_scenarios']
    assert not (backend & set(config['backend_tests']))
    assert not (agents & set(config['agent_tests']))
    backend.update(config['backend_tests']);agents.update(config['agent_tests'])
    rows.append(dict(**item,execution=path.relative_to(QMS).as_posix(),results=(path.parent/'results.html').relative_to(QMS).as_posix(),
                     agent_demo=(path.parent/'agent-demo.html').relative_to(QMS).as_posix(),finished_at=record['finished_at'],passed=True))
    refresh_member_index(item['member'])
for path in (QMS/'members').rglob('*.html'):
    parser=Links();parser.feed(path.read_text(encoding='utf-8'))
    for href in parser.links:
        url=urlparse(href)
        if url.scheme or not url.path: continue
        assert (path.parent/unquote(url.path)).exists(), f'Broken link: {path}: {href}'
summary=dict(execution_kind='ai-assisted',operator='OpenAI Codex',members=rows,
             backend_passes=len(backend),agent_passes=len(agents),existing_test_passes=len(backend)+len(agents),
             demo_scenarios=sum(r['demo_scenarios'] for r in rows),
             note='Package verification only. Existing tests are rerun selections of the group inventory; demonstration scenarios are separate. Personal execution must be recorded by each actual member.')
write_json(QMS/'members/verification.json',summary)
print(f'Verified {len(rows)} member packages: {len(backend)} backend + {len(agents)} agent tests, {summary["demo_scenarios"]} scenarios, unchanged tested source and valid HTML links.')
