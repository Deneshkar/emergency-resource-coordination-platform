import 'package:flutter/material.dart';
import '../models/shelter.dart';
import '../services/resource_service.dart';

class ShelterLocatorScreen extends StatefulWidget {
  const ShelterLocatorScreen({super.key});

  @override
  State<ShelterLocatorScreen> createState() => _ShelterLocatorScreenState();
}

class _ShelterLocatorScreenState extends State<ShelterLocatorScreen> {
  late Future<List<ShelterModel>> _sheltersFuture;

  @override
  void initState() {
    super.initState();
    _sheltersFuture = ResourceService.fetchShelters();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Evacuation Shelters'),
        backgroundColor: Colors.teal,
      ),
      body: FutureBuilder<List<ShelterModel>>(
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

              return Card(
                elevation: 3,
                margin: const EdgeInsets.symmetric(vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: isFull ? Colors.red : Colors.green,
                    child: Icon(isFull ? Icons.hotel : Icons.night_shelter, color: Colors.white),
                  ),
                  title: Text(shelter.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Location: ${shelter.location}'),
                      Text('Capacity: ${shelter.currentOccupancy} / ${shelter.totalCapacity}'),
                      if (shelter.contactNumber.isNotEmpty) Text('Contact: ${shelter.contactNumber}'),
                    ],
                  ),
                  trailing: Chip(
                    label: Text(shelter.status),
                    backgroundColor: isFull ? Colors.red.shade100 : Colors.green.shade100,
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
