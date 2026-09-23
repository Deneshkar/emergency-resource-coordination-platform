import 'package:flutter_test/flutter_test.dart';
import 'package:ercp_app/models/shelter.dart';

/// Unit tests for ShelterModel — mirrors backend SheltersControllerTests.
void main() {
  group('ShelterModel', () {
    test('fromJson parses all fields correctly', () {
      final s = ShelterModel.fromJson({
        'id': 1,
        'name': 'City Hall Shelter',
        'location': 'Downtown',
        'address': '123 Main St',
        'totalCapacity': 200,
        'currentOccupancy': 50,
        'availableCapacity': 150,
        'status': 'Active',
        'contactNumber': '0771234567',
      });

      expect(s.id, 1);
      expect(s.name, 'City Hall Shelter');
      expect(s.location, 'Downtown');
      expect(s.address, '123 Main St');
      expect(s.totalCapacity, 200);
      expect(s.currentOccupancy, 50);
      expect(s.availableCapacity, 150);
      expect(s.status, 'Active');
      expect(s.contactNumber, '0771234567');
    });

    test('fromJson defaults status to Active when missing', () {
      final s = ShelterModel.fromJson({
        'id': 2,
        'name': 'School Shelter',
        'totalCapacity': 100,
      });

      expect(s.status, 'Active');
    });

    test('fromJson sets capacities to 0 when missing', () {
      final s = ShelterModel.fromJson({
        'id': 3,
        'name': 'Empty Shelter',
      });

      expect(s.totalCapacity, 0);
      expect(s.currentOccupancy, 0);
      expect(s.availableCapacity, 0);
    });

    test('shelter at full capacity (occupancy >= total)', () {
      final s = ShelterModel.fromJson({
        'id': 4,
        'name': 'Full Shelter',
        'totalCapacity': 50,
        'currentOccupancy': 50,
        'availableCapacity': 0,
        'status': 'Full',
      });

      expect(s.currentOccupancy >= s.totalCapacity, isTrue);
      expect(s.status, 'Full');
    });

    test('shelter with available space', () {
      final s = ShelterModel.fromJson({
        'id': 5,
        'name': 'Open Shelter',
        'totalCapacity': 300,
        'currentOccupancy': 50,
        'availableCapacity': 250,
        'status': 'Active',
      });

      expect(s.currentOccupancy < s.totalCapacity, isTrue);
      expect(s.availableCapacity, 250);
    });

    test('fromJson defaults string fields to empty when null', () {
      final s = ShelterModel.fromJson({'id': 6});

      expect(s.name, '');
      expect(s.location, '');
      expect(s.address, '');
      expect(s.contactNumber, '');
    });
  });
}
