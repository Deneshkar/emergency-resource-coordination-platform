import 'package:flutter/material.dart';
import '../services/volunteer_service.dart';

class AddVolunteerScreen extends StatefulWidget {
  const AddVolunteerScreen({super.key});

  @override
  State<AddVolunteerScreen> createState() => _AddVolunteerScreenState();
}

class _AddVolunteerScreenState extends State<AddVolunteerScreen> {
  final _formKey = GlobalKey<FormState>();
  
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();

  final _skillsController = TextEditingController(text: 'General Field Operations');
  final List<String> _skillsList = [
    'General Field Operations',
    'Medical',
    'Search & Rescue',
    'Driving',
    'Logistics',
    'Responder',
  ];

  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _skillsController.dispose();
    super.dispose();
  }

  String? _validateName(String? v) {
    if (v == null || v.trim().isEmpty) return 'Full name is required';
    if (v.trim().length < 3) return 'Enter at least 3 characters';
    return null;
  }

  String? _validateEmail(String? v) {
    if (v == null || v.trim().isEmpty) return 'Email is required';
    final e = v.trim();
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(e)) return 'Enter a valid email';
    return null;
  }

  String? _validatePhone(String? v) {
    if (v == null || v.trim().isEmpty) return 'Phone is required';
    final p = v.trim().replaceAll(RegExp(r'[\s\-()+]'), '');
    if (!RegExp(r'^[0-9]{7,15}$').hasMatch(p)) return 'Enter 7-15 digits';
    return null;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      await VolunteerService.registerVolunteer(
        name: _nameController.text.trim(),
        email: _emailController.text.trim(),
        phone: _phoneController.text.trim(),
        skills: _skillsController.text.trim().isEmpty
            ? 'General Field Operations'
            : _skillsController.text.trim(),
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Volunteer added successfully!')),
      );
      Navigator.pop(context, true); // return true to trigger refresh
    } catch (e) {
      if (!mounted) return;
      final msg = e.toString().replaceFirst('Exception: ', '');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Volunteer'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Full Name',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.person),
                ),
                validator: _validateName,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.email),
                ),
                validator: _validateEmail,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Phone',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.phone),
                ),
                validator: _validatePhone,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _skillsController,
                decoration: const InputDecoration(
                  labelText: 'Skills (comma separated, e.g. medical, driving)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.badge),
                ),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Enter at least one skill' : null,
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: _skillsList
                    .map((s) => ActionChip(
                          label: Text(s, style: const TextStyle(fontSize: 12)),
                          onPressed: () {
                            final cur = _skillsController.text.trim();
                            _skillsController.text =
                                cur.isEmpty ? s : '$cur, $s';
                          },
                        ))
                    .toList(),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isLoading 
                  ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator())
                  : const Text('Add Volunteer'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
