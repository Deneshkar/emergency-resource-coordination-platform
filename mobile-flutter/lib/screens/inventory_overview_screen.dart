import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../models/inventory_item.dart';
import '../services/resource_service.dart';
import 'add_edit_inventory_screen.dart';

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

  void _refresh() {
    setState(() {
      _inventoryFuture = ResourceService.fetchInventory();
    });
  }

  Future<void> _handleDelete(int id, String name) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Delete Item'),
        content: Text('Are you sure you want to delete "$name"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(c, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirm == true) {
      await ResourceService.deleteInventoryItem(id);
      _refresh();
    }
  }

  Future<void> _handleAdjust(int id, int delta) async {
    await ResourceService.adjustStock(id, delta);
    _refresh();
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final isCoordinator = user?.canCoordinate ?? false;

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
                child: Column(
                  children: [
                    ListTile(
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
                    if (isCoordinator) ...[
                      const Divider(height: 1),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.remove_circle_outline, color: Colors.red),
                                  onPressed: () => _handleAdjust(item.id, -10),
                                  tooltip: '-10 Stock',
                                ),
                                IconButton(
                                  icon: const Icon(Icons.add_circle_outline, color: Colors.green),
                                  onPressed: () => _handleAdjust(item.id, 10),
                                  tooltip: '+10 Stock',
                                ),
                              ],
                            ),
                            Row(
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.edit, color: Colors.blue),
                                  onPressed: () async {
                                    final res = await Navigator.push(
                                      context,
                                      MaterialPageRoute(builder: (_) => AddEditInventoryScreen(item: item)),
                                    );
                                    if (res == true) _refresh();
                                  },
                                ),
                                IconButton(
                                  icon: const Icon(Icons.delete, color: Colors.red),
                                  onPressed: () => _handleDelete(item.id, item.itemName),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              );
            },
          );
        },
      ),
      floatingActionButton: isCoordinator
          ? FloatingActionButton(
              onPressed: () async {
                final res = await Navigator.push(context, MaterialPageRoute(builder: (_) => const AddEditInventoryScreen()));
                if (res == true) _refresh();
              },
              backgroundColor: Colors.indigo,
              foregroundColor: Colors.white,
              child: const Icon(Icons.add),
            )
          : null,
    );
  }
}
