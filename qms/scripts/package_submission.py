"""Package reproducible source and evidence without credentials or installed dependencies."""
from pathlib import Path
import hashlib, json, subprocess, zipfile

from paths import QMS as qms, REPO as repo
root=qms.parent
destination=qms/'ERCP_QMS_Group_Submission.zip'
entries={}

def include(path,arc=None):
    if arc is None:
        arc = ('QMS/' + path.relative_to(qms).as_posix()) if path.is_relative_to(qms) else ('SEF/emergency-resource-coordination-platform/' + path.relative_to(repo).as_posix())
    entries[arc]=path.read_bytes()

for folder in [qms/'submission',qms/'scripts']:
    for path in folder.rglob('*'):
        if path.is_file() and not any(p in ('__pycache__','.pytest_cache') for p in path.parts):
            include(path)
for path in (qms/'evidence').rglob('*'):
    if not path.is_file(): continue
    relative=path.relative_to(qms/'evidence').as_posix()
    if relative.startswith('rerun-'): continue
    if relative.startswith('final/backend/') and relative not in ['final/backend/backend.trx','final/backend/coverage.cobertura.xml']:
        continue
    if path.suffix.lower() in ['.trx','.json','.jsonl','.log','.xml','.txt','.patch']:
        include(path)

files=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard'],cwd=repo,text=True).splitlines()
for name in files:
    path=repo/name
    if not path.is_file(): continue
    if path.name.startswith('.env') or path.suffix.lower() in ['.pfx','.key','.pem']:
        continue
    if any(x in path.parts for x in ['node_modules','bin','obj','dist','.git','.dart_tool','build','__pycache__','.pytest_cache']):
        continue
    if path.name.startswith('appsettings') and path.suffix=='.json' and path.name != 'appsettings.Qms.json':
        # Public archive configuration is intentionally regenerated with test-only values.
        data={'Logging':{'LogLevel':{'Default':'Information','Microsoft.AspNetCore':'Warning'}},
              'AllowedHosts':'*','ConnectionStrings':{'DefaultConnection':'Host=127.0.0.1;Port=55432;Database=ercp_qms_verified;Username=qms'},
              'Jwt':{'Issuer':'ERCP.Api','Audience':'ERCP.Clients','SecretKey':'QMS_TEST_ONLY_CHANGE_BEFORE_DEPLOYMENT_2026_0123456789'},
              'SMTP_USER':'','SMTP_PASS':''}
        entries['SEF/emergency-resource-coordination-platform/'+path.relative_to(repo).as_posix()]=json.dumps(data,indent=2).encode()
    else:
        include(path, 'SEF/emergency-resource-coordination-platform/' + path.relative_to(repo).as_posix())

# Do not distribute a stale repository mirror alongside the outer convenience export.
for name,data in list(entries.items()):
    if name.startswith('QMS/'):
        mirror = 'SEF/emergency-resource-coordination-platform/qms/' + name[4:]
        assert entries.get(mirror) == data, f'Run sync_repository.py before packaging: {name}'

manifest={name:{'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()} for name,data in sorted(entries.items())}
entries['QMS/MANIFEST.json']=json.dumps(manifest,indent=2).encode()
with zipfile.ZipFile(destination,'w',zipfile.ZIP_DEFLATED,compresslevel=7) as archive:
    for name,data in entries.items(): archive.writestr(name,data)
with zipfile.ZipFile(destination) as archive:
    assert archive.testzip() is None
    assert all(hashlib.sha256(archive.read(name)).hexdigest()==value['sha256'] for name,value in manifest.items())
print(json.dumps({'archive':str(destination),'files':len(entries),'bytes':destination.stat().st_size,'manifest_verified':True}))
