import 'package:flutter/material.dart';
import '../models/volunteer.dart';
import '../services/volunteer_service.dart';
import 'profile_screen.dart';

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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Select Your Profile (temporary)")),
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
                title: Text(v.name),
                subtitle: Text(v.email),
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