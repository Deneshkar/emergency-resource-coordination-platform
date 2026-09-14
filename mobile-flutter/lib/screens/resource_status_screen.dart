import 'package:flutter/material.dart';
import '../models/resource.dart';
import '../services/resource_service.dart';

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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Resource Fleet Status'),
        backgroundColor: Colors.blueAccent,
      ),
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
                child: ListTile(
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
              );
            },
          );
        },
      ),
    );
  }
}
