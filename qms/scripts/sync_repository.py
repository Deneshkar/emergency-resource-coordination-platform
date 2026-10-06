"""Mirror the curated assignment QMS deliverables into the application repository.

The outer QMS folder is a convenient export. The repo/qms mirror makes the same
scripts, documents and evidence available in a GitHub checkout. Never copy local
tools, PostgreSQL data, caches, archived ZIPs or raw rerun directories.
"""
from pathlib import Path
import shutil
from paths import QMS, REPO

target = REPO / 'qms'
if target.resolve() == QMS.resolve():
    print('Already running from the repository QMS directory.')
else:
    count = 0
    for folder in ('scripts', 'submission', 'evidence', 'members'):
        for path in (QMS / folder).rglob('*'):
            relative = path.relative_to(QMS)
            if not path.is_file() or any(p in ('__pycache__','.pytest_cache') or p.startswith('rerun-') for p in relative.parts): continue
            if folder == 'evidence':
                if path.suffix.lower() not in ('.trx','.json','.jsonl','.log','.xml','.txt','.patch','.png'): continue
                if relative.as_posix().startswith('evidence/final/backend/') and relative.as_posix() not in ('evidence/final/backend/backend.trx','evidence/final/backend/coverage.cobertura.xml'): continue
            destination = target / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, destination)
            assert path.read_bytes() == destination.read_bytes()
            count += 1
    print(f'Mirrored and verified {count} QMS files under {target}')
