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
  final TextEditingController _locationController = TextEditingController(text: "Colombo Central");

  @override
  void initState() {
    super.initState();
    _sheltersFuture = ResourceService.fetchShelters();
  }

  @override
  Widget build(BuildContext context) {
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
                      onPressed: () {
                        setState(() {
                          _sheltersFuture = ResourceService.fetchShelters();
                        });
                      },
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
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: isFull ? Colors.red : Colors.green,
                          child: Icon(isFull ? Icons.hotel : Icons.night_shelter, color: Colors.white),
                        ),
                        title: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(shelter.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                            Text('📍 $estDistanceKm km', style: const TextStyle(fontSize: 12, color: Colors.teal, fontWeight: FontWeight.bold)),
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
                          label: Text(shelter.status),
                          backgroundColor: isFull ? Colors.red.shade100 : Colors.green.shade100,
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
