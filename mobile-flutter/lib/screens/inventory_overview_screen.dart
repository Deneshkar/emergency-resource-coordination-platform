import 'package:flutter/material.dart';
import '../models/inventory_item.dart';
import '../services/resource_service.dart';

class InventoryOverviewScreen extends StatefulWidget {
  const InventoryOverviewScreen({super.key});

  @override
  State<InventoryOverviewScreen> createState() => _InventoryOverviewScreenState();
}

class _InventoryOverviewScreenState extends State<InventoryOverviewScreen> {
  late Future<List<InventoryItemModel>> _inventoryFuture;

  @override
  void initState() {
    super.initState();
    _inventoryFuture = ResourceService.fetchInventory();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Inventory Supplies'),
        backgroundColor: Colors.indigo,
      ),
      body: FutureBuilder<List<InventoryItemModel>>(
        future: _inventoryFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('No inventory items logged.'));
          }

          final items = snapshot.data!;
          return ListView.builder(
            itemCount: items.length,
            padding: const EdgeInsets.all(12),
            itemBuilder: (context, index) {
              final item = items[index];
              final isLow = item.status == 'LowStock' || item.status == 'OutOfStock';

              return Card(
                elevation: 2,
                margin: const EdgeInsets.symmetric(vertical: 6),
                child: ListTile(
                  leading: Icon(
                    isLow ? Icons.warning_amber_rounded : Icons.medical_services_outlined,
                    color: isLow ? Colors.red : Colors.green,
                    size: 32,
                  ),
                  title: Text(item.itemName, style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text('Category: ${item.category} | Qty: ${item.quantity} ${item.unitOfMeasure}'),
                  trailing: Text(
                    item.status,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: isLow ? Colors.red : Colors.green,
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
