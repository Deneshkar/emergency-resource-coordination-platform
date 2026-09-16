import 'package:flutter_test/flutter_test.dart';
import 'package:ercp_app/models/volunteer.dart';
import 'package:ercp_app/models/shift.dart';

void main() {
  group('Volunteer model (Student 4)', () {
    test('fromJson parses all fields correctly', () {
      final v = Volunteer.fromJson({
        'id': 'vol-001',
        'name': 'Marcus Vance',
        'email': 'volunteer@ercp.org',
        'phone': '+1-555-0144',
        'skills': 'Search & Rescue, Medical EMT',
        'isAvailable': true,
        'rating': 4.9,
      });

      expect(v.id, 'vol-001');
      expect(v.name, 'Marcus Vance');
      expect(v.email, 'volunteer@ercp.org');
      expect(v.isAvailable, isTrue);
      expect(v.rating, 4.9);
    });

    test('off-duty volunteer parses isAvailable=false', () {
      final v = Volunteer.fromJson({
        'id': 'vol-002',
        'name': 'Off Duty',
        'email': 'off@test.local',
        'phone': '000',
        'skills': 'driving',
        'isAvailable': false,
        'rating': 3,
      });

      expect(v.isAvailable, isFalse);
      expect(v.rating, 3.0);
    });
  });

  group('Shift model (Student 4)', () {
    test('fromJson parses shift history entry', () {
      final s = Shift.fromJson({
        'id': 'shift-1',
        'startTime': '2026-09-20T08:00:00Z',
        'endTime': '2026-09-20T16:00:00Z',
        'status': 'Scheduled',
      });

      expect(s.id, 'shift-1');
      expect(s.status, 'Scheduled');
      expect(s.startTime, contains('2026-09-20'));
    });

    test('numeric status is stringified (backend enum serialises as int)', () {
      final s = Shift.fromJson({
        'id': 'shift-2',
        'startTime': '2026-09-21T08:00:00Z',
        'endTime': '2026-09-21T16:00:00Z',
        'status': 1,
      });

      expect(s.status, '1');
    });
  });
}
