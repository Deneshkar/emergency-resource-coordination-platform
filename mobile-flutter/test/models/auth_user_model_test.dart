import 'package:flutter_test/flutter_test.dart';
import 'package:ercp_app/models/auth_user.dart';

/// Unit tests for AuthUser model — JSON parsing, role helpers, and toJson round-trip.
void main() {
  group('AuthUser model', () {
    // ─── fromJson ───────────────────────────────────────────────────────
    test('fromJson parses all fields correctly', () {
      final user = AuthUser.fromJson({
        'id': 1,
        'fullName': 'Test Admin',
        'email': 'admin@ercp.org',
        'role': 'Admin',
        'phoneNumber': '+94771234567',
        'skills': 'System Administration',
      });

      expect(user.id, 1);
      expect(user.fullName, 'Test Admin');
      expect(user.email, 'admin@ercp.org');
      expect(user.role, 'Admin');
      expect(user.phoneNumber, '+94771234567');
      expect(user.skills, 'System Administration');
    });

    test('fromJson handles missing optional fields with null', () {
      final user = AuthUser.fromJson({
        'id': 2,
        'fullName': 'Minimal User',
        'email': 'minimal@ercp.org',
        'role': 'Citizen',
      });

      expect(user.id, 2);
      expect(user.phoneNumber, isNull);
      expect(user.skills, isNull);
    });

    test('fromJson handles string id by parsing to int', () {
      final user = AuthUser.fromJson({
        'id': '42',
        'fullName': 'String ID User',
        'email': 'string@ercp.org',
        'role': 'Volunteer',
      });

      expect(user.id, 42);
    });

    test('fromJson handles null id gracefully (defaults to 0)', () {
      final user = AuthUser.fromJson({
        'fullName': 'No ID User',
        'email': 'noid@ercp.org',
        'role': 'Citizen',
      });

      expect(user.id, 0);
    });

    test('fromJson defaults role to Citizen when missing', () {
      final user = AuthUser.fromJson({
        'id': 5,
        'fullName': 'No Role',
        'email': 'norole@ercp.org',
      });

      expect(user.role, 'Citizen');
    });

    test('fromJson defaults fullName and email to empty string when null', () {
      final user = AuthUser.fromJson({'id': 6});

      expect(user.fullName, '');
      expect(user.email, '');
    });

    // ─── Role helpers ───────────────────────────────────────────────────
    test('isVolunteer returns true for Volunteer role (case-insensitive)', () {
      final user = AuthUser.fromJson({
        'id': 10,
        'fullName': 'Vol User',
        'email': 'vol@ercp.org',
        'role': 'Volunteer',
      });

      expect(user.isVolunteer, isTrue);
      expect(user.isCitizen, isFalse);
      expect(user.isCoordinator, isFalse);
      expect(user.isAdmin, isFalse);
    });

    test('isCitizen returns true for Citizen role', () {
      final user = AuthUser.fromJson({
        'id': 11,
        'fullName': 'Cit User',
        'email': 'cit@ercp.org',
        'role': 'Citizen',
      });

      expect(user.isCitizen, isTrue);
      expect(user.isVolunteer, isFalse);
    });

    test('isCoordinator returns true for Coordinator role', () {
      final user = AuthUser.fromJson({
        'id': 12,
        'fullName': 'Coord User',
        'email': 'coord@ercp.org',
        'role': 'Coordinator',
      });

      expect(user.isCoordinator, isTrue);
      expect(user.canCoordinate, isTrue);
    });

    test('isAdmin returns true for Admin role', () {
      final user = AuthUser.fromJson({
        'id': 13,
        'fullName': 'Admin User',
        'email': 'admin@ercp.org',
        'role': 'Admin',
      });

      expect(user.isAdmin, isTrue);
      expect(user.canCoordinate, isTrue);
    });

    test('canCoordinate returns false for Volunteer and Citizen', () {
      final volunteer = AuthUser.fromJson({
        'id': 14,
        'fullName': 'V',
        'email': 'v@ercp.org',
        'role': 'Volunteer',
      });
      final citizen = AuthUser.fromJson({
        'id': 15,
        'fullName': 'C',
        'email': 'c@ercp.org',
        'role': 'Citizen',
      });

      expect(volunteer.canCoordinate, isFalse);
      expect(citizen.canCoordinate, isFalse);
    });

    // ─── toJson round-trip ──────────────────────────────────────────────
    test('toJson produces correct map structure', () {
      final user = AuthUser(
        id: 1,
        fullName: 'Round Trip',
        email: 'rt@ercp.org',
        role: 'Admin',
        phoneNumber: '123456',
        skills: 'Dart, Flutter',
      );

      final json = user.toJson();

      expect(json['id'], 1);
      expect(json['fullName'], 'Round Trip');
      expect(json['email'], 'rt@ercp.org');
      expect(json['role'], 'Admin');
      expect(json['phoneNumber'], '123456');
      expect(json['skills'], 'Dart, Flutter');
    });

    test('fromJson -> toJson -> fromJson round-trip preserves data', () {
      final original = {
        'id': 99,
        'fullName': 'Consistency Check',
        'email': 'consistency@ercp.org',
        'role': 'Coordinator',
        'phoneNumber': '+94770000000',
        'skills': 'Planning, Logistics',
      };

      final user1 = AuthUser.fromJson(original);
      final json = user1.toJson();
      final user2 = AuthUser.fromJson(json);

      expect(user2.id, user1.id);
      expect(user2.fullName, user1.fullName);
      expect(user2.email, user1.email);
      expect(user2.role, user1.role);
      expect(user2.phoneNumber, user1.phoneNumber);
      expect(user2.skills, user1.skills);
    });
  });
}
