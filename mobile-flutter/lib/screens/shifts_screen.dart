import 'package:flutter/material.dart';
import '../models/shift.dart';
import '../services/volunteer_service.dart';

class ShiftsScreen extends StatefulWidget {
  final String volunteerId;

  const ShiftsScreen({super.key, required this.volunteerId});

  @override
  State<ShiftsScreen> createState() => _ShiftsScreenState();
}

class _ShiftsScreenState extends State<ShiftsScreen> {
  late Future<List<Shift>> _shiftsFuture;

  @override
  void initState() {
    super.initState();
    _shiftsFuture = VolunteerService.getShifts(widget.volunteerId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("My Shifts")),
      body: FutureBuilder<List<Shift>>(
        future: _shiftsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return const Center(child: Text("Failed to load shift history."));
          }
          final shifts = snapshot.data ?? [];
          if (shifts.isEmpty) {
            return const Center(child: Text("No shifts recorded yet."));
          }
          return ListView.builder(
            itemCount: shifts.length,
            itemBuilder: (context, index) {
              final s = shifts[index];
              return ListTile(
                title: Text("${s.startTime} → ${s.endTime}"),
                subtitle: Text("Status: ${s.status}"),
              );
            },
          );
        },
      ),
    );
  }
}