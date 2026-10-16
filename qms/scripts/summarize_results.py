"""Reconcile raw execution records; missing, failed or skipped evidence fails the gate."""
import argparse
import json
from pathlib import Path
import xml.etree.ElementTree as ET


def tally(statuses):
    statuses = list(statuses)
    return {'total': len(statuses), **{k: statuses.count(k) for k in ('passed', 'failed', 'skipped')}}


def backend_counts(path):
    root = ET.parse(path).getroot()
    rows = list(root.iterfind('.//{*}UnitTestResult'))
    result = tally('passed' if x.get('outcome') == 'Passed' else 'skipped' if x.get('outcome') == 'NotExecuted' else 'failed' for x in rows)
    assert int(root.find('.//{*}Counters').get('total')) == result['total'], 'TRX counters disagree with records'
    database = [x for x in rows if 'QmsPostgresTests.' in x.get('testName','') or 'QmsMigrationTests.' in x.get('testName','')]
    required = {
        'QmsPostgresTests.DB01_DuplicateEmail_IsRejectedByPostgres',
        'QmsPostgresTests.DB02_OrphanShift_IsRejectedByForeignKey',
        'QmsPostgresTests.DB03_DeletingVolunteer_CascadesShift',
        'QmsPostgresTests.DB04_Rollback_DoesNotPersistResource',
        'QmsMigrationTests.MIG01_CleanMigration_MatchesCurrentModelSchema',
        'QmsMigrationTests.MIG02_IncidentMigration_RollbackPreservesResourceData',
        'QmsMigrationTests.MIG03_ResourceRollback_PreservesEarlierIncidentTablesAndData',
        'QmsMigrationTests.MIG04_ReapplyAndFullRollback_AreConsistent',
    }
    observed = {'.'.join(x.get('testName', '').rsplit('.', 2)[-2:]) for x in database}
    assert required <= observed and len(observed) == len(database) and all(
        x.get('outcome') == 'Passed' for x in database
    ), 'Every required PostgreSQL/migration test and additional QMS test must execute and pass'
    return result


def summarize(directory):
    directory = Path(directory)
    suites = {'backend': backend_counts(directory / 'backend/backend.trx')}
    react = json.loads((directory / 'react.json').read_text(encoding='utf-8-sig'))
    suites['react'] = tally('passed' if x['status'] == 'passed' else 'skipped' if x['status'] in ('pending','skipped','todo') else 'failed'
        for s in react['testResults'] for x in s['assertionResults'])
    assert suites['react']['total'] == react['numTotalTests']
    # Flutter may print dependency/update notices before its JSON event stream.
    flutter = [json.loads(x) for x in (directory / 'flutter.jsonl').read_text(encoding='utf-8-sig').splitlines() if x.lstrip().startswith('{')]
    assert any(x.get('type') == 'done' and x.get('success') for x in flutter), 'Flutter stream did not finish successfully'
    suites['flutter'] = tally('skipped' if x.get('skipped') else 'passed' if x['result'] == 'success' else 'failed'
        for x in flutter if x.get('type') == 'testDone' and not x.get('hidden'))
    for name, file in [('agents','agents.xml'), ('http','live-api.xml')]:
        junit = ET.parse(directory / file).getroot()
        suites[name] = tally('skipped' if x.find('skipped') is not None else 'failed' if x.find('failure') is not None or x.find('error') is not None else 'passed'
            for x in junit.iter('testcase'))
        assert sum(int(s.get('tests','0')) for s in junit.iter('testsuite')) == suites[name]['total'], f'{file} counters disagree with records'
    perf = json.loads((directory / 'performance.json').read_text(encoding='utf-8-sig'))
    thresholds = [v['ok'] for m in perf['metrics'].values() for v in m.get('thresholds',{}).values()]
    performance_passed = len(thresholds) >= 3 and all(thresholds) and perf['metrics']['http_reqs']['values']['count'] > 0
    migration = json.loads((directory / 'migration-check.json').read_text(encoding='utf-8-sig'))
    health = json.loads((directory / 'health.json').read_text(encoding='utf-8-sig'))
    migration_passed = (migration['status'] == 'Passed' and
        len(migration['applied_migrations']) >= 8 and
        len(migration['applied_migrations']) == health['appliedMigrations'] and
        migration['pending_migrations'] == health['pendingMigrations'] == 0)
    totals = {key: sum(s[key] for s in suites.values()) for key in ('total','passed','failed','skipped')}
    extras = {'performance_scenario': 'Passed' if performance_passed else 'Failed', 'migration_cli_check': 'Passed' if migration_passed else 'Failed'}
    return {'automated_suites': suites, 'automated': totals, 'additional_checks': extras,
        'inventory_records': totals['total'] + len(extras),
        'passed_gate': totals['failed'] == 0 and totals['skipped'] == 0 and all(s['total'] for s in suites.values()) and performance_passed and migration_passed}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('directory', type=Path)
    parser.add_argument('--backend-only', action='store_true')
    args = parser.parse_args()
    if args.backend_only:
        result = backend_counts(args.directory / 'backend/backend.trx')
        print(json.dumps(result, indent=2))
        raise SystemExit(0 if result['failed'] == result['skipped'] == 0 else 1)
    result = summarize(args.directory)
    (args.directory / 'summary.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(json.dumps(result, indent=2))
    raise SystemExit(0 if result['passed_gate'] else 1)
