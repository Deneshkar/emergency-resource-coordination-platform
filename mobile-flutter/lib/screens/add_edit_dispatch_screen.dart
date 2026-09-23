import 'package:flutter/material.dart';
import '../services/dispatch_service.dart';

class AddEditDispatchScreen extends StatefulWidget {
  const AddEditDispatchScreen({super.key});

  @override
  State<AddEditDispatchScreen> createState() => _AddEditDispatchScreenState();
}

class _AddEditDispatchScreenState extends State<AddEditDispatchScreen> {
  final _formKey = GlobalKey<FormState>();
  final _incidentIdController = TextEditingController();
  String _priority = 'Medium';
  String _status = 'Proposed';
  bool _isLoading = false;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    try {
      final incidentId = int.tryParse(_incidentIdController.text) ?? 0;
      final payload = {
        'incidentId': incidentId,
        'priority': _priority,
        'status': _status,
      };

      await DispatchService.createDispatch(payload);
      if (mounted) {
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _incidentIdController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Dispatch'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _incidentIdController,
                decoration: const InputDecoration(labelText: 'Incident ID', border: OutlineInputBorder()),
                keyboardType: TextInputType.number,
                validator: (val) => val == null || val.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _priority,
                decoration: const InputDecoration(labelText: 'Priority', border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(value: 'High', child: Text('High')),
                  DropdownMenuItem(value: 'Medium', child: Text('Medium')),
                  DropdownMenuItem(value: 'Low', child: Text('Low')),
                ],
                onChanged: (val) => setState(() => _priority = val!),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _status,
                decoration: const InputDecoration(labelText: 'Status', border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(value: 'Proposed', child: Text('Proposed')),
                  DropdownMenuItem(value: 'Active', child: Text('Active')),
                ],
                onChanged: (val) => setState(() => _status = val!),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                child: _isLoading ? const CircularProgressIndicator() : const Text('Create Dispatch'),
              )
            ],
          ),
        ),
      ),
    );
  }
}
