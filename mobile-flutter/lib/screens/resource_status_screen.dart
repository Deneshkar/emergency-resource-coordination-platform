import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../models/resource.dart';
import '../services/resource_service.dart';
import 'add_edit_resource_screen.dart';

class ResourceStatusScreen extends StatefulWidget {
  const ResourceStatusScreen({super.key});

  @override
  State<ResourceStatusScreen> createState() => _ResourceStatusScreenState();
}

class _ResourceStatusScreenState extends State<ResourceStatusScreen> {
  late Future<List<ResourceModel>> _resourcesFuture;

  @override
  void initState() {
    super.initState();
    _resourcesFuture = ResourceService.fetchResources();
  }

  void _refresh() {
    setState(() {
      _resourcesFuture = ResourceService.fetchResources();
    });
  }

  Future<void> _handleDelete(int id, String name) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Delete Resource'),
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
      await ResourceService.deleteResource(id);
      _refresh();
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final isCoordinator = user?.canCoordinate ?? false;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Resource Fleet Status'),
        backgroundColor: Colors.blueAccent,
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _refresh),
        ],
      ),
      floatingActionButton: isCoordinator
          ? FloatingActionButton(
              onPressed: () async {
                final result = await Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const AddEditResourceScreen()),
                );
                if (result == true) {
                  _refresh();
                }
              },
              child: const Icon(Icons.add),
            )
          : null,
      body: FutureBuilder<List<ResourceModel>>(
        future: _resourcesFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('No resources registered.'));
          }

          final resources = snapshot.data!;
          return ListView.builder(
            itemCount: resources.length,
            padding: const EdgeInsets.all(12),
            itemBuilder: (context, index) {
              final r = resources[index];
              return Card(
                elevation: 2,
                margin: const EdgeInsets.symmetric(vertical: 6),
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.airport_shuttle, color: Colors.blueAccent, size: 36),
                      title: Text(r.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text('Type: ${r.resourceType} | Location: ${r.location}'),
                      trailing: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: r.status == 'Available' ? Colors.green : Colors.orange,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(r.status, style: const TextStyle(color: Colors.white, fontSize: 12)),
                      ),
                    ),
                    if (isCoordinator) ...[
                      const Divider(height: 1),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          TextButton.icon(
                            icon: const Icon(Icons.edit, size: 16),
                            label: const Text('Edit'),
                            onPressed: () async {
                              final result = await Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => AddEditResourceScreen(resource: r)),
                              );
                              if (result == true) _refresh();
                            },
                          ),
                          TextButton.icon(
                            icon: const Icon(Icons.delete, size: 16, color: Colors.red),
                            label: const Text('Delete', style: TextStyle(color: Colors.red)),
                            onPressed: () => _handleDelete(r.id, r.name),
                          ),
                          const SizedBox(width: 8),
                        ],
                      ),
                    ],
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
