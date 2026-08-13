import 'package:flutter/material.dart';
import '../models/volunteer.dart';
import '../services/volunteer_service.dart';
import '../services/notification_service.dart';
import 'shifts_screen.dart';

class ProfileScreen extends StatefulWidget {
  final Volunteer volunteer;

  const ProfileScreen({super.key, required this.volunteer});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late bool _isAvailable;
  bool _updating = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _isAvailable = widget.volunteer.isAvailable;
  }

  Future<void> _toggleAvailability(bool value) async {
    setState(() {
      _updating = true;
      _error = null;
    });

    try {
      await VolunteerService.updateAvailability(widget.volunteer.id, value);
      setState(() {
        _isAvailable = value;
      });
      await NotificationService.showNotification(
        "Availability Updated",
        value ? "You are now marked as available." : "You are now marked as unavailable.",
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Availability updated")),
        );
      }
    } catch (e) {
      setState(() {
        _error = "Failed to update availability. Please try again.";
      });
    } finally {
      setState(() {
        _updating = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final v = widget.volunteer;

    return Scaffold(
      appBar: AppBar(title: const Text("My Profile")),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("Name: ${v.name}", style: const TextStyle(fontSize: 18)),
            const SizedBox(height: 8),
            Text("Email: ${v.email}"),
            const SizedBox(height: 8),
            Text("Phone: ${v.phone}"),
            const SizedBox(height: 8),
            Text("Skills: ${v.skills}"),
            const SizedBox(height: 8),
            Text("Rating: ${v.rating}"),
            const SizedBox(height: 24),
            if (_error != null)
              Text(_error!, style: const TextStyle(color: Colors.red)),
            Row(
              children: [
                const Text("Available for tasks:"),
                _updating
                    ? const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16),
                        child: SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      )
                    : Switch(
                        value: _isAvailable,
                        onChanged: _toggleAvailability,
                      ),
              ],
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => ShiftsScreen(volunteerId: v.id),
                  ),
                );
              },
              child: const Text("View My Shifts"),
            ),
          ],
        ),
      ),
    );
  }
}