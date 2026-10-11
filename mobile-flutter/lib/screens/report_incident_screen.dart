import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/incident_service.dart';

class ReportIncidentScreen extends StatefulWidget {
  const ReportIncidentScreen({super.key});

  @override
  State<ReportIncidentScreen> createState() => _ReportIncidentScreenState();
}

class _ReportIncidentScreenState extends State<ReportIncidentScreen> {
  final _formKey = GlobalKey<FormState>();

  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _locationController = TextEditingController();
  final _affectedCountController = TextEditingController(text: '0');
  final _contactController = TextEditingController();

  String _selectedCategory = 'Fire';
  String _selectedPriority = 'High';
  bool _isLoading = false;

  final List<String> _categories = [
    'Fire',
    'Flood',
    'Medical',
    'Earthquake',
    'Infrastructure',
    'Chemical',
    'General Emergency',
  ];

  final List<String> _priorities = ['Critical', 'High', 'Medium', 'Low'];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final user = auth.user;
      if (user != null) {
        if (user.email.isNotEmpty) {
          _contactController.text = user.email;
        } else if (user.phoneNumber != null && user.phoneNumber!.isNotEmpty) {
          _contactController.text = user.phoneNumber!;
        }
      }
    });
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _locationController.dispose();
    _affectedCountController.dispose();
    _contactController.dispose();
    super.dispose();
  }

  void _fillSample(String type) {
    setState(() {
      switch (type) {
        case 'Fire':
          _titleController.text = 'Commercial Building Fire';
          _selectedCategory = 'Fire';
          _selectedPriority = 'Critical';
          _locationController.text = '450 Industrial Parkway, Sector 4';
          _affectedCountController.text = '8';
          _descriptionController.text =
              'Three-story warehouse fire with heavy smoke and fire spreading. Emergency evacuation underway, multiple people trapped.';
          break;
        case 'Flood':
          _titleController.text = 'Severe Flash Flood';
          _selectedCategory = 'Flood';
          _selectedPriority = 'High';
          _locationController.text = 'Riverdale Road Bridge, North Sector';
          _affectedCountController.text = '15';
          _descriptionController.text =
              'Water levels rising rapidly due to heavy rain. Multiple vehicles stranded on the roadway, urgent rescue boats needed.';
          break;
        case 'Medical':
          _titleController.text = 'Multi-Vehicle Road Collision';
          _selectedCategory = 'Medical';
          _selectedPriority = 'Critical';
          _locationController.text = 'Highway 101 Mile Marker 42 North';
          _affectedCountController.text = '5';
          _descriptionController.text =
              'Severe multi-car collision on the highway. Several injured passengers trapped inside vehicles requiring immediate paramedic support.';
          break;
        case 'Chemical':
          _titleController.text = 'Toxic Chemical Gas Leak';
          _selectedCategory = 'Chemical';
          _selectedPriority = 'Critical';
          _locationController.text = '78 Chemical Zone Road, Gate 3';
          _affectedCountController.text = '25';
          _descriptionController.text =
              'Hazardous vapor cloud escaping from chemical storage tank. Immediate hazmat response and evacuation perimeter required.';
          break;
      }
    });
  }

  Future<void> _submitReport() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final fallbackContact = auth.user?.email ?? 'citizen@ercp.org';
    final reporterContact = _contactController.text.trim().isNotEmpty
        ? _contactController.text.trim()
        : fallbackContact;

    try {
      await IncidentService.createIncident({
        'title': _titleController.text.trim(),
        'description': _descriptionController.text.trim(),
        'location': _locationController.text.trim(),
        'category': _selectedCategory,
        'priority': _selectedPriority,
        'affectedCount': int.tryParse(_affectedCountController.text.trim()) ?? 0,
        'reporterContact': reporterContact,
        'autoGeneratePlan': true,
      });

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('🚨 Emergency reported successfully! AI Agent is analyzing...'),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
        ),
      );
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      final msg = e.toString().replaceFirst(RegExp(r'^Exception:\s*'), '');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(msg),
          backgroundColor: Colors.red.shade800,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 5),
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Report Emergency'),
        backgroundColor: Colors.red.shade800,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.red.withAlpha(26),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.warning_amber_rounded, color: Colors.red, size: 32),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Submit this form only for genuine emergencies. AI agents will analyze and mobilize response units.',
                        style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Quick Fill Presets for Instant Testing
              Row(
                children: [
                  const Icon(Icons.flash_on, size: 16, color: Colors.amber),
                  const SizedBox(width: 4),
                  Text(
                    'Quick Fill Sample:',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    ActionChip(
                      avatar: const Text('🔥'),
                      label: const Text('Fire'),
                      onPressed: () => _fillSample('Fire'),
                    ),
                    const SizedBox(width: 8),
                    ActionChip(
                      avatar: const Text('🌊'),
                      label: const Text('Flood'),
                      onPressed: () => _fillSample('Flood'),
                    ),
                    const SizedBox(width: 8),
                    ActionChip(
                      avatar: const Text('🚑'),
                      label: const Text('Medical'),
                      onPressed: () => _fillSample('Medical'),
                    ),
                    const SizedBox(width: 8),
                    ActionChip(
                      avatar: const Text('☣️'),
                      label: const Text('Chemical'),
                      onPressed: () => _fillSample('Chemical'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Emergency Title *',
                  hintText: 'e.g., Major accident on Main St',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.title),
                ),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) return 'Emergency title is required';
                  final trimmed = val.trim();
                  if (trimmed.length < 5) return 'Title must be at least 5 characters';
                  final words = trimmed.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toList();
                  if (words.length < 2) return 'Please provide at least two words (e.g. Building Fire)';
                  return null;
                },
              ),
              const SizedBox(height: 16),

              DropdownButtonFormField<String>(
                key: ValueKey('category_$_selectedCategory'),
                initialValue: _selectedCategory,
                decoration: const InputDecoration(
                  labelText: 'Category *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.category),
                ),
                items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _selectedCategory = val);
                },
              ),
              const SizedBox(height: 16),

              DropdownButtonFormField<String>(
                key: ValueKey('priority_$_selectedPriority'),
                initialValue: _selectedPriority,
                decoration: const InputDecoration(
                  labelText: 'Priority Level *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.priority_high),
                ),
                items: _priorities.map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _selectedPriority = val);
                },
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _locationController,
                decoration: const InputDecoration(
                  labelText: 'Specific Location *',
                  hintText: 'Street address, landmark, or intersection',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.location_on),
                ),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) return 'Location is required';
                  final trimmed = val.trim();
                  if (trimmed.length < 5) return 'Location must be at least 5 characters';
                  final lower = trimmed.toLowerCase();
                  if (['test', 'none', 'n/a', 'unknown', 'placeholder'].contains(lower)) {
                    return 'Please provide a real address or landmark';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _affectedCountController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Estimated People Affected',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.people),
                ),
                validator: (val) {
                  if (val != null && val.trim().isNotEmpty) {
                    final parsed = int.tryParse(val.trim());
                    if (parsed == null || parsed < 0) return 'Must be a positive number';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _contactController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'Reporter Contact (Email or Phone)',
                  hintText: 'e.g., citizen@ercp.org or +1-555-0199',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.contact_mail),
                ),
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _descriptionController,
                maxLines: 4,
                decoration: const InputDecoration(
                  labelText: 'Detailed Description * (min 20 characters)',
                  hintText: 'Describe the situation, hazards, trapped individuals, and urgency...',
                  border: OutlineInputBorder(),
                  alignLabelWithHint: true,
                ),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) return 'Description is required';
                  final trimmed = val.trim();
                  if (trimmed.length < 20) {
                    return 'Please add more detail (${trimmed.length}/20 min characters)';
                  }
                  final words = trimmed.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toList();
                  if (words.length < 3) return 'Description must contain at least 3 words';
                  return null;
                },
              ),
              const SizedBox(height: 32),

              ElevatedButton(
                onPressed: _isLoading ? null : _submitReport,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red.shade800,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  textStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 24,
                        width: 24,
                        child: CircularProgressIndicator(color: Colors.white),
                      )
                    : const Text('DISPATCH REPORT'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
