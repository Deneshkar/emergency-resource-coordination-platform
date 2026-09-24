import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/shift.dart';
import '../providers/auth_provider.dart';
import '../services/volunteer_service.dart';

class ShiftsScreen extends StatefulWidget {
  final String volunteerId;

  const ShiftsScreen({super.key, required this.volunteerId});

  @override
  State<ShiftsScreen> createState() => _ShiftsScreenState();
}

class _ShiftsScreenState extends State<ShiftsScreen> {
  late Future<List<Shift>> _shiftsFuture;
  bool _creating = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    setState(() {
      _shiftsFuture = VolunteerService.getShifts(widget.volunteerId);
    });
  }

  Future<void> _showCreateDialog() async {
    DateTime start = DateTime.now().add(const Duration(hours: 1));
    DateTime end = start.add(const Duration(hours: 8));
    String status = 'Scheduled';

    String fmt(DateTime d) =>
        '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')} '
        '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';

    final created = await showDialog<bool>(
      context: context,
      builder: (c) => StatefulBuilder(
        builder: (c, setD) => AlertDialog(
          title: const Text('Schedule Shift'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                title: const Text('Start', style: TextStyle(fontSize: 12, color: Colors.grey)),
                subtitle: Text(fmt(start)),
                trailing: const Icon(Icons.calendar_month),
                onTap: () async {
                  final d = await showDatePicker(
                    // ignore: use_build_context_synchronously
                    context: c,
                    initialDate: start,
                    firstDate: DateTime.now().subtract(const Duration(days: 1)),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                  );
                  if (d == null) return;
                  // ignore: use_build_context_synchronously
                  final t = await showTimePicker(context: c, initialTime: TimeOfDay.fromDateTime(start));
                  if (t == null) return;
                  setD(() => start = DateTime(d.year, d.month, d.day, t.hour, t.minute));
                },
              ),
              ListTile(
                title: const Text('End', style: TextStyle(fontSize: 12, color: Colors.grey)),
                subtitle: Text(fmt(end)),
                trailing: const Icon(Icons.calendar_month),
                onTap: () async {
                  final d = await showDatePicker(
                    // ignore: use_build_context_synchronously
                    context: c,
                    initialDate: end,
                    firstDate: DateTime.now().subtract(const Duration(days: 1)),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                  );
                  if (d == null) return;
                  // ignore: use_build_context_synchronously
                  final t = await showTimePicker(context: c, initialTime: TimeOfDay.fromDateTime(end));
                  if (t == null) return;
                  setD(() => end = DateTime(d.year, d.month, d.day, t.hour, t.minute));
                },
              ),
              DropdownButtonFormField<String>(
                initialValue: status,
                decoration: const InputDecoration(labelText: 'Status'),
                items: Shift.allowedStatuses
                    .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                    .toList(),
                onChanged: (v) {
                  if (v != null) setD(() => status = v);
                },
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                if (!end.isAfter(start)) {
                  ScaffoldMessenger.of(c).showSnackBar(
                    const SnackBar(
                        content: Text('End time must be after start time'),
                        backgroundColor: Colors.red),
                  );
                  return;
                }
                Navigator.pop(c, true);
                await _create(start, end, status);
              },
              child: const Text('Create'),
            ),
          ],
        ),
      ),
    );
    if (created == true) _load();
  }

  Future<void> _create(DateTime start, DateTime end, String status) async {
    setState(() => _creating = true);
    try {
      await VolunteerService.createShift(
        volunteerId: widget.volunteerId,
        startTime: start,
        endTime: end,
        status: status,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Shift scheduled')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) setState(() => _creating = false);
    }
  }

  Future<void> _confirmDelete(Shift s) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Delete shift?'),
        content: Text(s.displayRange),
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
    if (ok != true) return;
    try {
      await VolunteerService.deleteShift(volunteerId: widget.volunteerId, shiftId: s.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Shift deleted')));
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _showEditStatus(Shift s) async {
    String status = s.status;
    final save = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Update shift status'),
        content: DropdownButtonFormField<String>(
          initialValue: Shift.allowedStatuses.contains(status) ? status : 'Scheduled',
          items: Shift.allowedStatuses
              .map((x) => DropdownMenuItem(value: x, child: Text(x)))
              .toList(),
          onChanged: (v) {
            if (v != null) status = v;
          },
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(c, true), child: const Text('Save')),
        ],
      ),
    );
    if (save != true) return;
    try {
      await VolunteerService.updateShift(
        volunteerId: widget.volunteerId,
        shiftId: s.id,
        startTime: s.startTime ?? DateTime.now(),
        endTime: s.endTime ?? DateTime.now().add(const Duration(hours: 8)),
        status: status,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Shift updated')));
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    final canCreate = user?.canCoordinate ?? false;
    final canEditShifts = canCreate || (user?.isVolunteer ?? false);
    return Scaffold(
      appBar: AppBar(title: const Text("Shifts & History")),
      floatingActionButton: canCreate
          ? FloatingActionButton(
              onPressed: _creating ? null : _showCreateDialog,
              child: _creating
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.add),
            )
          : null,
      body: RefreshIndicator(
        onRefresh: () async => _load(),
        child: FutureBuilder<List<Shift>>(
          future: _shiftsFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              return Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(snapshot.error.toString().replaceFirst('Exception: ', '')),
                    const SizedBox(height: 12),
                    ElevatedButton(onPressed: _load, child: const Text('Retry')),
                  ],
                ),
              );
            }
            final shifts = snapshot.data ?? [];
            if (shifts.isEmpty) {
              return Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text("No shifts recorded yet."),
                    if (canCreate)
                      TextButton(onPressed: _showCreateDialog, child: const Text('Schedule first shift')),
                  ],
                ),
              );
            }
            return ListView.builder(
              itemCount: shifts.length,
              itemBuilder: (context, index) {
                final s = shifts[index];
                return ListTile(
                  leading: Icon(
                    s.status == 'Active'
                        ? Icons.play_circle
                        : s.status == 'Completed'
                            ? Icons.check_circle
                            : s.status == 'Cancelled'
                                ? Icons.cancel
                                : Icons.schedule,
                    color: s.status == 'Active'
                        ? Colors.green
                        : s.status == 'Completed'
                            ? Colors.blue
                            : Colors.grey,
                  ),
                  title: Text(s.displayRange),
                  subtitle: Text("Status: ${s.status}"),
                  trailing: canEditShifts
                      ? PopupMenuButton<String>(
                          onSelected: (v) {
                            if (v == 'edit') {
                              _showEditStatus(s);
                            } else {
                              _confirmDelete(s);
                            }
                          },
                          itemBuilder: (_) => const [
                            PopupMenuItem(value: 'edit', child: Text('Edit status')),
                            PopupMenuItem(value: 'delete', child: Text('Delete')),
                          ],
                        )
                      : null,
                );
              },
            );
          },
        ),
      ),
    );
  }
}
