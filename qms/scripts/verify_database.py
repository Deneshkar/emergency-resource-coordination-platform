"""Record migration history and independently verify the workflow in PostgreSQL."""
import argparse
import json
import os
import subprocess
from datetime import datetime
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('directory', type=Path)
parser.add_argument('--cli-exit', type=int, required=True)
args = parser.parse_args()
config = dict(x.strip().split('=', 1) for x in os.environ['QMS_POSTGRES'].split(';') if x.strip())
config = {k.lower(): v for k, v in config.items()}
assert config['host'] in ('127.0.0.1','localhost') and config['database'].startswith('ercp_qms')
command = [os.environ.get('QMS_PSQL','psql'), '-X', '-h', config['host'], '-p', config.get('port','5432'), '-U', config['username'], '-d', config['database'], '-At', '-v', 'ON_ERROR_STOP=1', '-c']
env = dict(os.environ)
if 'password' in config: env['PGPASSWORD'] = config['password']
def query(sql):
    return subprocess.check_output(command + [sql], env=env, text=True).strip()
history = query('SELECT "MigrationId" FROM "__EFMigrationsHistory" ORDER BY "MigrationId"').splitlines()
health = json.loads((args.directory / 'health.json').read_text(encoding='utf-8-sig'))
record = {'status': 'Passed' if args.cli_exit == 0 and len(history) == 8 else 'Failed',
    'applied_migrations': history, 'pending_migrations': health['pendingMigrations'],
    'database': config['database'], 'checked_at': datetime.now().astimezone().isoformat(), 'cli_exit': args.cli_exit}
(args.directory / 'migration-check.json').write_text(json.dumps(record, indent=2), encoding='utf-8')
workflow_file = args.directory / 'workflow.json'
workflow = json.loads(workflow_file.read_text(encoding='utf-8-sig'))
dispatch_id = int(workflow['dispatch_id'])
status = query(f'SELECT "Status" FROM "Dispatches" WHERE "Id"={dispatch_id}')
assert status == 'Approved', 'Independent SQL verification did not find the approved dispatch'
workflow.update(postgres_verification={'Id':dispatch_id, 'Status':status}, database=config['database'], execution_date=record['checked_at'])
workflow_file.write_text(json.dumps(workflow, indent=2), encoding='utf-8')
print(json.dumps(record, indent=2))
assert record['status'] == 'Passed'
