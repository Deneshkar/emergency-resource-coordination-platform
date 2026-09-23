import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../models/volunteer.dart';
import '../services/volunteer_service.dart';
import 'profile_screen.dart';
import 'add_volunteer_screen.dart';

class SelectProfileScreen extends StatefulWidget {
  const SelectProfileScreen({super.key});

  @override
  State<SelectProfileScreen> createState() => _SelectProfileScreenState();
}

class _SelectProfileScreenState extends State<SelectProfileScreen> {
  late Future<List<Volunteer>> _volunteersFuture;

  @override
  void initState() {
    super.initState();
    _volunteersFuture = VolunteerService.getVolunteers();
  }

  void _refresh() {
    setState(() {
      _volunteersFuture = VolunteerService.getVolunteers();
    });
  }

  Future<void> _handleDelete(String id, String name) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Delete Volunteer'),
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
      await VolunteerService.deleteVolunteer(id);
      _refresh();
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final isCoordinator = user?.canCoordinate ?? false;

    return Scaffold(
      appBar: AppBar(title: const Text("Volunteer Directory")),
      floatingActionButton: isCoordinator
          ? FloatingActionButton(
              onPressed: () async {
                final result = await Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const AddVolunteerScreen()),
                );
                if (result == true) {
                  _refresh();
                }
              },
              child: const Icon(Icons.person_add),
            )
          : null,
      body: FutureBuilder<List<Volunteer>>(
        future: _volunteersFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return const Center(child: Text("Failed to load volunteers."));
          }
          final volunteers = snapshot.data ?? [];
          if (volunteers.isEmpty) {
            return const Center(child: Text("No volunteers registered yet."));
          }
          return ListView.builder(
            itemCount: volunteers.length,
            itemBuilder: (context, index) {
              final v = volunteers[index];
              return ListTile(
                title: Text(v.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text('${v.skills} • ${v.email}'),
                trailing: isCoordinator
                    ? IconButton(
                        icon: const Icon(Icons.delete, color: Colors.red),
                        onPressed: () => _handleDelete(v.id, v.name),
                      )
                    : null,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => ProfileScreen(volunteer: v),
                    ),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}