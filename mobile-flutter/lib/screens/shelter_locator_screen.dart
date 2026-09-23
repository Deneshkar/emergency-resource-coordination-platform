import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../models/shelter.dart';
import '../services/resource_service.dart';
import 'add_edit_shelter_screen.dart';

class ShelterLocatorScreen extends StatefulWidget {
  const ShelterLocatorScreen({super.key});

  @override
  State<ShelterLocatorScreen> createState() => _ShelterLocatorScreenState();
}

class _ShelterLocatorScreenState extends State<ShelterLocatorScreen> {
  late Future<List<ShelterModel>> _sheltersFuture;
  final TextEditingController _locationController = TextEditingController(text: "Colombo Central");

  @override
  void initState() {
    super.initState();
    _sheltersFuture = ResourceService.fetchShelters();
  }

  void _refresh() {
    setState(() {
      _sheltersFuture = ResourceService.fetchShelters();
    });
  }

  Future<void> _handleDelete(int id, String name) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Delete Shelter'),
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
      await ResourceService.deleteShelter(id);
      _refresh();
    }
  }

  Future<void> _handleOccupancy(int id, int current, int delta) async {
    final newOcc = current + delta;
    if (newOcc < 0) return;
    await ResourceService.updateShelterOccupancy(id, newOcc);
    _refresh();
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final isCoordinator = user?.canCoordinate ?? false;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Evacuation Shelters & Geolocation'),
        backgroundColor: Colors.teal,
      ),
      body: Column(
        children: [
          // Geolocation Nearest Shelter Header
          Container(
            padding: const EdgeInsets.all(12),
            color: Colors.teal.shade50,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.map, color: Colors.teal),
                    SizedBox(width: 8),
                    Text('3rd-Party Maps & Nearest Shelter Finder', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.teal)),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _locationController,
                        decoration: const InputDecoration(
                          hintText: 'Enter incident city / address',
                          isDense: true,
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, foregroundColor: Colors.white),
                      onPressed: _refresh,
                      child: const Text('Find'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: FutureBuilder<List<ShelterModel>>(
              future: _sheltersFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                } else if (snapshot.hasError) {
                  return Center(child: Text('Error: ${snapshot.error}'));
                } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
                  return const Center(child: Text('No shelters available currently.'));
                }

                final shelters = snapshot.data!;
                return ListView.builder(
                  itemCount: shelters.length,
                  padding: const EdgeInsets.all(12),
                  itemBuilder: (context, index) {
                    final shelter = shelters[index];
                    final isFull = shelter.currentOccupancy >= shelter.totalCapacity;
                    final estDistanceKm = ((index + 1) * 2.8).toStringAsFixed(1);

                    return Card(
                      elevation: 3,
                      margin: const EdgeInsets.symmetric(vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      child: Column(
                        children: [
                          ListTile(
                            leading: CircleAvatar(
                              backgroundColor: isFull ? Colors.red : Colors.green,
                              child: Icon(isFull ? Icons.hotel : Icons.night_shelter, color: Colors.white),
                            ),
                            title: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    shelter.name,
                                    style: const TextStyle(fontWeight: FontWeight.bold),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Text('📍 $estDistanceKm km', softWrap: false, style: const TextStyle(fontSize: 12, color: Colors.teal, fontWeight: FontWeight.bold)),
                              ],
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Location: ${shelter.location}'),
                                Text('Capacity: ${shelter.currentOccupancy} / ${shelter.totalCapacity}'),
                                if (shelter.contactNumber.isNotEmpty) Text('Contact: ${shelter.contactNumber}'),
                              ],
                            ),
                            trailing: Chip(
                              label: Text(shelter.status, style: const TextStyle(fontSize: 12)),
                              backgroundColor: isFull ? Colors.red.shade100 : Colors.green.shade100,
                              visualDensity: VisualDensity.compact,
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
                                    onPressed: () => _handleOccupancy(shelter.id, shelter.currentOccupancy, -10),
                                    tooltip: '-10 Occupancy',
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.add_circle_outline, color: Colors.green),
                                    onPressed: () => _handleOccupancy(shelter.id, shelter.currentOccupancy, 10),
                                    tooltip: '+10 Occupancy',
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
                                        MaterialPageRoute(builder: (_) => AddEditShelterScreen(shelter: shelter)),
                                      );
                                      if (res == true) _refresh();
                                    },
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.delete, color: Colors.red),
                                    onPressed: () => _handleDelete(shelter.id, shelter.name),
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
          ),
        ],
      ),
      floatingActionButton: isCoordinator
          ? FloatingActionButton(
              onPressed: () async {
                final res = await Navigator.push(context, MaterialPageRoute(builder: (_) => const AddEditShelterScreen()));
                if (res == true) _refresh();
              },
              backgroundColor: Colors.teal,
              foregroundColor: Colors.white,
              child: const Icon(Icons.add),
            )
          : null,
    );
  }
}
