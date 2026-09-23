import 'package:flutter_test/flutter_test.dart';
import 'package:ercp_app/models/resource.dart';

/// Unit tests for ResourceModel — mirrors backend ResourcesControllerTests.
void main() {
  group('ResourceModel', () {
    test('fromJson parses all required fields correctly', () {
      final r = ResourceModel.fromJson({
        'id': 1,
        'name': 'Ambulance Unit 1',
        'resourceType': 'Vehicle',
        'status': 'Available',
        'capacity': 4,
        'location': 'Central Depot',
        'shelterId': 2,
        'shelterName': 'City Hall Shelter',
      });

      expect(r.id, 1);
      expect(r.name, 'Ambulance Unit 1');
      expect(r.resourceType, 'Vehicle');
      expect(r.status, 'Available');
      expect(r.capacity, 4);
      expect(r.location, 'Central Depot');
      expect(r.shelterId, 2);
      expect(r.shelterName, 'City Hall Shelter');
    });

    test('fromJson defaults status to Available when missing', () {
      final r = ResourceModel.fromJson({
        'id': 2,
        'name': 'Generator Unit',
        'resourceType': 'Equipment',
        'capacity': 1,
        'location': 'Warehouse A',
      });

      expect(r.status, 'Available');
    });

    test('fromJson defaults capacity to 1 when missing', () {
      final r = ResourceModel.fromJson({
        'id': 3,
        'name': 'Water Tank',
        'resourceType': 'Supply',
        'location': 'Depot B',
      });

      expect(r.capacity, 1);
    });

    test('fromJson handles null optional shelterId and shelterName', () {
      final r = ResourceModel.fromJson({
        'id': 4,
        'name': 'Fire Truck',
        'resourceType': 'Vehicle',
        'capacity': 6,
        'location': 'Station 3',
      });

      expect(r.shelterId, isNull);
      expect(r.shelterName, isNull);
    });

    test('fromJson handles dispatched status', () {
      final r = ResourceModel.fromJson({
        'id': 5,
        'name': 'Truck 1',
        'resourceType': 'Vehicle',
        'status': 'Dispatched',
        'capacity': 2,
        'location': 'North Station',
      });

      expect(r.status, 'Dispatched');
    });

    test('fromJson handles maintenance status', () {
      final r = ResourceModel.fromJson({
        'id': 6,
        'name': 'R3',
        'resourceType': 'Equipment',
        'status': 'Maintenance',
        'capacity': 1,
        'location': 'Workshop',
      });

      expect(r.status, 'Maintenance');
    });

    test('fromJson defaults all string fields to empty when null', () {
      final r = ResourceModel.fromJson({'id': 7});

      expect(r.name, '');
      expect(r.resourceType, '');
      expect(r.location, '');
    });
  });
}
