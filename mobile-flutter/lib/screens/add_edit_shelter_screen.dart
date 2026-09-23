import 'package:flutter/material.dart';
import '../models/shelter.dart';
import '../services/resource_service.dart';

class AddEditShelterScreen extends StatefulWidget {
  final ShelterModel? shelter;

  const AddEditShelterScreen({super.key, this.shelter});

  @override
  State<AddEditShelterScreen> createState() => _AddEditShelterScreenState();
}

class _AddEditShelterScreenState extends State<AddEditShelterScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _locationController;
  late TextEditingController _addressController;
  late TextEditingController _capacityController;
  late TextEditingController _contactController;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.shelter?.name ?? '');
    _locationController = TextEditingController(text: widget.shelter?.location ?? '');
    _addressController = TextEditingController(text: widget.shelter?.address ?? '');
    _capacityController = TextEditingController(text: widget.shelter?.totalCapacity.toString() ?? '100');
    _contactController = TextEditingController(text: widget.shelter?.contactNumber ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _locationController.dispose();
    _addressController.dispose();
    _capacityController.dispose();
    _contactController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final data = {
        'name': _nameController.text,
        'location': _locationController.text,
        'address': _addressController.text,
        'totalCapacity': int.tryParse(_capacityController.text) ?? 100,
        'contactNumber': _contactController.text,
        if (widget.shelter != null) 'id': widget.shelter!.id,
        if (widget.shelter != null) 'currentOccupancy': widget.shelter!.currentOccupancy,
        if (widget.shelter != null) 'status': widget.shelter!.status,
      };

      if (widget.shelter == null) {
        await ResourceService.createShelter(data);
      } else {
        await ResourceService.updateShelter(widget.shelter!.id, data);
      }
      
      if (mounted) Navigator.pop(context, true); // true indicates success
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.shelter == null ? 'Add Shelter' : 'Edit Shelter'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Shelter Name', border: OutlineInputBorder()),
              validator: (v) => v!.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _locationController,
              decoration: const InputDecoration(labelText: 'Location/City', border: OutlineInputBorder()),
              validator: (v) => v!.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _addressController,
              decoration: const InputDecoration(labelText: 'Full Address', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _capacityController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Total Capacity (People)', border: OutlineInputBorder()),
              validator: (v) => v!.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _contactController,
              decoration: const InputDecoration(labelText: 'Contact Number', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _isLoading ? null : _save,
              style: ElevatedButton.styleFrom(
                minimumSize: const Size.fromHeight(50),
              ),
              child: _isLoading 
                ? const CircularProgressIndicator(color: Colors.white)
                : const Text('Save Shelter', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}
