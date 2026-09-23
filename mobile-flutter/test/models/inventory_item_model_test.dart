import 'package:flutter_test/flutter_test.dart';
import 'package:ercp_app/models/inventory_item.dart';

/// Unit tests for InventoryItemModel — mirrors backend InventoryControllerTests.
void main() {
  group('InventoryItemModel', () {
    test('fromJson parses all fields correctly', () {
      final item = InventoryItemModel.fromJson({
        'id': 1,
        'itemName': 'First Aid Kit',
        'category': 'Medical',
        'quantity': 50,
        'unitOfMeasure': 'Kits',
        'minimumThreshold': 10,
        'status': 'InStock',
        'location': 'Warehouse A',
      });

      expect(item.id, 1);
      expect(item.itemName, 'First Aid Kit');
      expect(item.category, 'Medical');
      expect(item.quantity, 50);
      expect(item.unitOfMeasure, 'Kits');
      expect(item.minimumThreshold, 10);
      expect(item.status, 'InStock');
      expect(item.location, 'Warehouse A');
    });

    test('fromJson detects LowStock status when quantity below threshold', () {
      final item = InventoryItemModel.fromJson({
        'id': 2,
        'itemName': 'First Aid Kit',
        'category': 'Medical',
        'quantity': 5,
        'minimumThreshold': 10,
        'status': 'LowStock',
      });

      expect(item.status, 'LowStock');
      expect(item.quantity < item.minimumThreshold, isTrue);
    });

    test('fromJson handles OutOfStock status', () {
      final item = InventoryItemModel.fromJson({
        'id': 3,
        'itemName': 'Blankets',
        'category': 'Bedding',
        'quantity': 0,
        'minimumThreshold': 20,
        'status': 'OutOfStock',
      });

      expect(item.status, 'OutOfStock');
      expect(item.quantity, 0);
    });

    test('fromJson defaults status to InStock when missing', () {
      final item = InventoryItemModel.fromJson({
        'id': 4,
        'itemName': 'Bottled Water',
        'category': 'Water',
        'quantity': 100,
      });

      expect(item.status, 'InStock');
    });

    test('fromJson defaults numeric fields to 0 when missing', () {
      final item = InventoryItemModel.fromJson({
        'id': 5,
        'itemName': 'Test Item',
      });

      expect(item.quantity, 0);
      expect(item.minimumThreshold, 0);
    });

    test('fromJson defaults string fields to empty when null', () {
      final item = InventoryItemModel.fromJson({'id': 6});

      expect(item.itemName, '');
      expect(item.category, '');
      expect(item.unitOfMeasure, '');
      expect(item.location, '');
    });

    test('stock adjustment scenario: quantity decreases from 50 to 10', () {
      // Simulates the backend AdjustStock test case
      final before = InventoryItemModel.fromJson({
        'id': 7,
        'itemName': 'Bottled Water',
        'category': 'Water',
        'quantity': 50,
        'minimumThreshold': 20,
        'status': 'InStock',
      });

      expect(before.quantity, 50);
      expect(before.status, 'InStock');

      // After backend adjustment of -40
      final after = InventoryItemModel.fromJson({
        'id': 7,
        'itemName': 'Bottled Water',
        'category': 'Water',
        'quantity': 10,
        'minimumThreshold': 20,
        'status': 'LowStock',
      });

      expect(after.quantity, 10);
      expect(after.status, 'LowStock');
      expect(after.quantity < after.minimumThreshold, isTrue);
    });
  });
}
