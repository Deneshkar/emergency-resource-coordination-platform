import 'package:flutter_test/flutter_test.dart';
import 'package:ercp_app/models/validation_result.dart';

void main() {
  group('ValidationResult (Student 4 Safety Agent)', () {
    test('parses APPROVE result', () {
      final r = ValidationResult.fromJson({
        'dispatchId': 5,
        'isValid': true,
        'recommendation': 'APPROVE',
        'violations': [],
        'warnings': [],
        'checks': [
          {'tool': 'check_volunteer_availability', 'passed': true, 'detail': 'ok'}
        ],
        'validatedAt': '2026-09-24T00:00:00Z',
        'auditId': 11,
        'durationMs': 42,
        'validatedBy': 'coordinator@ercp.org',
      });
      expect(r.recommendation, 'APPROVE');
      expect(r.isValid, isTrue);
      expect(r.checks, hasLength(1));
    });

    test('parses REJECT with blockers', () {
      final r = ValidationResult.fromJson({
        'dispatchId': 6,
        'isValid': false,
        'recommendation': 'REJECT',
        'violations': [
          {'code': 'V1_VOLUNTEER_UNAVAILABLE', 'message': 'busy', 'severity': 'BLOCKER'}
        ],
        'warnings': [],
        'checks': [],
        'validatedAt': '',
        'durationMs': 3,
        'validatedBy': 'c',
      });
      expect(r.violations.first.code, 'V1_VOLUNTEER_UNAVAILABLE');
    });

    test('history entry parses', () {
      final h = ValidationHistoryEntry.fromJson({
        'auditId': 1,
        'dispatchId': 2,
        'isValid': true,
        'recommendation': 'REVISE',
        'violationCount': 0,
        'warningCount': 1,
        'checkCount': 4,
        'validatedBy': 'c',
        'durationMs': 5,
        'validatedAt': '2026-09-24T00:00:00Z',
      });
      expect(h.recommendation, 'REVISE');
    });
  });
}
