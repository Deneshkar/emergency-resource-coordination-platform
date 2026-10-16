"""Enrich previously GitHub-verified records with exact local Git object metadata."""
import json
import subprocess
from datetime import datetime, timezone
from paths import QMS, REPO

path = QMS / 'evidence/github/verified-member-commits.json'
rows = json.loads(path.read_text(encoding='utf-8-sig'))
summaries = {
    '50f9414': 'Incident controller tests accompany incident input handling and coordinator/planner implementation. This is backend test authorship evidence.',
    '25de8a9': 'Backend edge-case tests cover shelters, inventory and geolocation. These committed tests are distinct from the later QMS PostgreSQL and migration regressions.',
    '6846af6': 'React page tests cover ShelterList, ResourceList and InventoryList. Existing component tests retain the scope and limitations described in the report.',
    '48a9c3b': 'Backend dispatch allocation, validation and controller tests, plus React dispatch-page and validation-service tests, accompany the dispatch implementation.',
    'cd96717': 'Removed duplicate migration table operations and upgraded MailKit. This is a database repair contribution; this commit does not itself prove execution of the later QMS migration tests.',
    '3c059a6': 'Volunteer shift tests and volunteer API integration tests accompany responder validation and controller changes.',
    'ee924e2': 'Committed public-role and dispatch authorization fixes, PostgreSQL/security regressions, and React protected-route/resource behaviour tests. QMS preparation and execution were AI-assisted.',
}
for row in rows:
    result = subprocess.check_output(
        ['git', 'show', '-s', '--format=%H%n%aI%n%cI%n%B', row['sha']],
        cwd=REPO, text=True, encoding='utf-8').split('\n', 3)
    sha, author_date, committer_date, message = result
    assert sha == row['sha']
    utc = datetime.fromisoformat(author_date).astimezone(timezone.utc).isoformat().replace('+00:00', 'Z')
    assert utc == row['commit_date'], f'Previous GitHub author date differs: {sha}'
    assert message.splitlines()[0] == row['subject']
    row.update(author_date=author_date, committer_date=committer_date,
               message=message.rstrip('\n'), testing_contribution=summaries[sha[:7]],
               metadata_source='GitHub commit API verification on 6 October 2026; exact message and author/committer timestamps cross-checked against the same local Git object.')
path.write_text(json.dumps(rows, indent=2) + '\n', encoding='utf-8', newline='\n')
record_path = QMS / 'submission/Contribution_Record.md'
record = record_path.read_text(encoding='utf-8-sig').split('\n## Exact commit metadata')[0]
record = record.replace('with draft PR #47.', 'with PR #47 (now closed without merging).')
sections = [record.rstrip(), '\n## Exact commit metadata\n',
            'Dates below use Sri Lanka time (UTC+05:30). Author dates record the original contribution; committer dates can differ after integration. Full messages are copied from the Git objects identified by the GitHub-verified hashes. These dates are not personal QMS execution dates.\n']
for row in rows:
    sections += [f'### {row["member"]} / {row["student_id"]} / {row["sha"][:7]}\n',
                 f'- GitHub account: {row["github_author"]}',
                 f'- Full commit: [{row["sha"]}]({row["url"]})',
                 f'- Author date: {row["author_date"]}',
                 f'- Committer date: {row["committer_date"]}\n',
                 'Exact commit message:\n', '```text\n' + row['message'] + '\n```\n',
                 row['testing_contribution'] + '\n',
                 'Relevant files: ' + ', '.join('`'+f+'`' for f in row['changed_files'] if 'tests/' in f or '__tests__/' in f or '/Migrations/' in f) + '.\n']
sections += ['## Individual testing status\n',
             'Backend and React test authorship is supported by the commits above. Denesh N also has a verified database repair commit. Later QMS database, deterministic AI, live HTTP and performance runs are recorded as AI-assisted group execution. They are not allocated to individual members as personally executed work without confirmation.\n',
             'Deneshkar subsequently supplied six screenshots of his guided personal execution on 6 October: four controller, five HTTP integration and three safety-agent tests passed. Raw reports confirm these 12 existing test reruns. See Individual_Evidence_IT24103828.md and PDF Appendix C. Own-word explanations and the boundary exercise remain unconfirmed.\n',
             'Appendix A (pages 9-12) contains each member\'s responsibility and contribution summary. The group supplied four actual GitHub screenshots on 6 October 2026; Appendix B (pages 13-16) embeds them. The unchanged originals and their SHA-256 checksums are recorded in `../evidence/github/screenshots.json`. For volunteer commit 3c059a6, GitHub identifies Deneshkar as author and Jathurshy11 as committer; authorship and commit integration are distinct roles.\n']
record_path.write_text('\n'.join(sections), encoding='utf-8')
print(f'Cross-checked full messages and both timestamps for {len(rows)} verified commits.')
