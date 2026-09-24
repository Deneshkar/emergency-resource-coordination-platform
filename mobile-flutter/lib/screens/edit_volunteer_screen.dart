import 'package:flutter/material.dart';
import '../models/volunteer.dart';
import '../services/volunteer_service.dart';

/// Member 4 — Edit volunteer (PUT /api/volunteers/{id}).
/// Coordinator/Admin any record, Volunteer own record only.
class EditVolunteerScreen extends StatefulWidget {
  final Volunteer volunteer;
  const EditVolunteerScreen({super.key, required this.volunteer});

  @override
  State<EditVolunteerScreen> createState() => _EditVolunteerScreenState();
}

class _EditVolunteerScreenState extends State<EditVolunteerScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _phone;
  late final TextEditingController _skills;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _name = TextEditingController(text: widget.volunteer.name);
    _phone = TextEditingController(text: widget.volunteer.phone);
    _skills = TextEditingController(text: widget.volunteer.skills);
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _skills.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await VolunteerService.updateVolunteer(
        id: widget.volunteer.id,
        name: _name.text.trim(),
        phone: _phone.text.trim(),
        skills: _skills.text.trim(),
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Volunteer updated')));
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit Volunteer')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _name,
                decoration: const InputDecoration(
                    labelText: 'Full Name', border: OutlineInputBorder()),
                validator: (v) =>
                    v == null || v.trim().length < 3 ? 'Enter at least 3 characters' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: TextEditingController(text: widget.volunteer.email),
                enabled: false,
                decoration: const InputDecoration(
                  labelText: 'Email (cannot change)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _phone,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                    labelText: 'Phone', border: OutlineInputBorder()),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Phone is required';
                  final p = v.trim().replaceAll(RegExp(r'[\s\-()+]'), '');
                  if (!RegExp(r'^[0-9]{7,15}$').hasMatch(p)) return 'Enter 7-15 digits';
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _skills,
                decoration: const InputDecoration(
                  labelText: 'Skills (comma separated)',
                  border: OutlineInputBorder(),
                ),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Enter at least one skill' : null,
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(
                        width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Save changes'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
