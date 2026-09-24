import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/volunteer.dart';
import '../providers/auth_provider.dart';
import '../services/volunteer_service.dart';
import '../services/notification_service.dart';
import 'shifts_screen.dart';
import 'edit_volunteer_screen.dart';

class ProfileScreen extends StatefulWidget {
  final Volunteer? volunteer;

  const ProfileScreen({super.key, this.volunteer});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Volunteer? _volunteer;
  bool _isAvailable = false;
  bool _updating = false;
  bool _loadingVolunteerRecord = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.volunteer != null) {
      _volunteer = widget.volunteer;
      _isAvailable = widget.volunteer!.isAvailable;
    } else {
      _loadVolunteerDetails();
    }
  }

  Future<void> _loadVolunteerDetails() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final user = auth.user;
    if (user == null) return;
    // Volunteers load their own record; coordinators viewing own profile
    // fall back to user fields when no linked volunteer record exists.
    if (user.isVolunteer) {
      setState(() {
        _loadingVolunteerRecord = true;
        _error = null;
      });
      try {
        final v = await VolunteerService.getVolunteerByEmail(user.email);
        if (v != null && mounted) {
          setState(() {
            _volunteer = v;
            _isAvailable = v.isAvailable;
          });
        } else if (mounted) {
          setState(() => _error = 'No volunteer record linked to ${user.email}. Ask a coordinator to register you.');
        }
      } catch (e) {
        if (mounted) {
          setState(() => _error = 'Failed to load duty status: ${e.toString().replaceFirst('Exception: ', '')}');
        }
      } finally {
        if (mounted) {
          setState(() => _loadingVolunteerRecord = false);
        }
      }
    }
  }

  Future<void> _toggleAvailability(bool value) async {
    if (_volunteer == null) {
      setState(() => _error = 'No volunteer record loaded — cannot update duty status.');
      return;
    }

    setState(() {
      _updating = true;
      _error = null;
    });

    try {
      await VolunteerService.updateAvailability(_volunteer!.id, value);
      setState(() {
        _isAvailable = value;
      });
      await NotificationService.showNotification(
        "Availability Updated",
        value ? "You are now marked as available." : "You are now marked as unavailable.",
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(value ? "You are now ON-DUTY (Available)" : "You are now OFF-DUTY"),
            backgroundColor: value ? Colors.green.shade700 : Colors.blueGrey,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _error = "Failed to update availability: ${e.toString().replaceFirst('Exception: ', '')}";
      });
    } finally {
      if (mounted) {
        setState(() {
          _updating = false;
        });
      }
    }
  }

  Future<void> _handleSignOut() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Sign Out"),
        content: const Text("Are you sure you want to end your active session?"),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text("Cancel")),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text("Sign Out"),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      try {
        await auth.logout();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                  'Sign-out storage issue, session cleared locally: ${e.toString().replaceFirst('Exception: ', '')}'),
            ),
          );
        }
      }
      if (mounted) {
        // AuthGate rebuilds to LoginScreen once isAuthenticated is false;
        // pop any pushed routes (e.g. this ProfileScreen) to reveal it.
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;

    final displayName = _volunteer?.name ?? user?.fullName ?? "Platform User";
    final displayEmail = _volunteer?.email ?? user?.email ?? "";
    final displayPhone = _volunteer?.phone ?? user?.phoneNumber ?? "Not provided";
    final displaySkills = _volunteer?.skills ?? user?.skills ?? "General Assistance";
    final role = user?.role ?? "User";

    return Scaffold(
      appBar: AppBar(
        title: const Text("My Profile & Duty Status"),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: "Sign Out",
            onPressed: _handleSignOut,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // User Header Card
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 32,
                      backgroundColor: Colors.blue.shade100,
                      child: Text(
                        displayName.isNotEmpty ? displayName[0].toUpperCase() : "U",
                        style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: Colors.blue.shade900),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            displayName,
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            displayEmail,
                            style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: role == "Volunteer"
                                  ? Colors.teal.shade50
                                  : role == "Coordinator" || role == "Admin"
                                      ? Colors.purple.shade50
                                      : Colors.blue.shade50,
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(
                                color: role == "Volunteer"
                                    ? Colors.teal.shade300
                                    : role == "Coordinator" || role == "Admin"
                                        ? Colors.purple.shade300
                                        : Colors.blue.shade300,
                              ),
                            ),
                            child: Text(
                              role.toUpperCase(),
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: role == "Volunteer"
                                    ? Colors.teal.shade900
                                    : role == "Coordinator" || role == "Admin"
                                        ? Colors.purple.shade900
                                        : Colors.blue.shade900,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Profile Info Card
            Card(
              elevation: 1,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text("Contact & Capabilities", style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                    const Divider(height: 20),
                    ListTile(
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.phone_outlined, color: Colors.blue),
                      title: const Text("Phone Number", style: TextStyle(fontSize: 12, color: Colors.grey)),
                      subtitle: Text(displayPhone, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                    ),
                    ListTile(
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.build_outlined, color: Colors.orange),
                      title: const Text("Skills / Capabilities", style: TextStyle(fontSize: 12, color: Colors.grey)),
                      subtitle: Text(displaySkills, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                    ),
                    if (_volunteer != null)
                      ListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        leading: const Icon(Icons.star_outline, color: Colors.amber),
                        title: const Text("Responder Rating", style: TextStyle(fontSize: 12, color: Colors.grey)),
                        subtitle: Text("${_volunteer!.rating} / 5.0", style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Volunteer Duty Controls (only for volunteers)
            if (user?.isVolunteer == true || _volunteer != null) ...[
              Card(
                elevation: 1,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text("Field Duty Controls", style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 6),
                      Text(
                        "Set whether you are currently on-duty and available to accept dispatch missions",
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                      ),
                      const Divider(height: 20),
                      if (_error != null) ...[
                        Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 12)),
                        const SizedBox(height: 8),
                      ],
                      if (_loadingVolunteerRecord)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 8),
                          child: Row(
                            children: [
                              SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                              SizedBox(width: 8),
                              Text("Loading duty status...", style: TextStyle(fontSize: 13)),
                            ],
                          ),
                        )
                      else
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 10,
                                  height: 10,
                                  decoration: BoxDecoration(
                                    color: _isAvailable ? Colors.green : Colors.grey,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  _isAvailable ? "Status: Available (On-Duty)" : "Status: Off-Duty",
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    color: _isAvailable ? Colors.green.shade800 : Colors.grey.shade700,
                                  ),
                                ),
                              ],
                            ),
                            _updating
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  )
                                : Switch(
                                    value: _isAvailable,
                                    activeThumbColor: Colors.green,
                                    onChanged: _volunteer != null ? _toggleAvailability : null,
                                  ),
                          ],
                        ),
                      if (_volunteer != null) ...[
                        const SizedBox(height: 14),
                        OutlinedButton.icon(
                          icon: const Icon(Icons.calendar_month),
                          label: const Text("View Assigned Shifts"),
                          style: OutlinedButton.styleFrom(
                            minimumSize: const Size.fromHeight(42),
                          ),
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => ShiftsScreen(volunteerId: _volunteer!.id),
                              ),
                            );
                          },
                        ),
                        const SizedBox(height: 8),
                        OutlinedButton.icon(
                          icon: const Icon(Icons.edit),
                          label: const Text("Edit Profile"),
                          style: OutlinedButton.styleFrom(
                            minimumSize: const Size.fromHeight(42),
                          ),
                          onPressed: () async {
                            final ok = await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) =>
                                    EditVolunteerScreen(volunteer: _volunteer!),
                              ),
                            );
                            if (ok == true && mounted) {
                              try {
                                final fresh =
                                    await VolunteerService.getVolunteerById(
                                        _volunteer!.id);
                                if (mounted) {
                                  setState(() {
                                    _volunteer = fresh;
                                    _isAvailable = fresh.isAvailable;
                                  });
                                }
                              } catch (_) {
                                _loadVolunteerDetails();
                              }
                            }
                          },
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Sign Out Button
            ElevatedButton.icon(
              icon: const Icon(Icons.logout),
              label: const Text("Sign Out of Session"),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red.shade600,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: _handleSignOut,
            ),
          ],
        ),
      ),
    );
  }
}