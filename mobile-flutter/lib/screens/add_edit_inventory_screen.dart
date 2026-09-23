import 'package:flutter/material.dart';
import '../models/inventory_item.dart';
import '../services/resource_service.dart';

class AddEditInventoryScreen extends StatefulWidget {
  final InventoryItemModel? item;

  const AddEditInventoryScreen({super.key, this.item});

  @override
  State<AddEditInventoryScreen> createState() => _AddEditInventoryScreenState();
}

class _AddEditInventoryScreenState extends State<AddEditInventoryScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _quantityController;
  late TextEditingController _unitController;
  late TextEditingController _thresholdController;
  late TextEditingController _locationController;
  String _category = 'Medical';
  bool _isLoading = false;

  final List<String> _categories = ['Medical', 'Food', 'Water', 'ShelterSupplies', 'Power'];

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.item?.itemName ?? '');
    _quantityController = TextEditingController(text: widget.item?.quantity.toString() ?? '50');
    _unitController = TextEditingController(text: widget.item?.unitOfMeasure ?? 'Kits');
    _thresholdController = TextEditingController(text: widget.item?.minimumThreshold.toString() ?? '10');
    _locationController = TextEditingController(text: widget.item?.location ?? '');
    
    if (widget.item != null && _categories.contains(widget.item!.category)) {
      _category = widget.item!.category;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _quantityController.dispose();
    _unitController.dispose();
    _thresholdController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final data = {
        'itemName': _nameController.text,
        'category': _category,
        'quantity': int.tryParse(_quantityController.text) ?? 0,
        'unitOfMeasure': _unitController.text,
        'minimumThreshold': int.tryParse(_thresholdController.text) ?? 0,
        'location': _locationController.text,
        if (widget.item != null) 'id': widget.item!.id,
        if (widget.item != null) 'status': widget.item!.status,
      };

      if (widget.item == null) {
        await ResourceService.createInventoryItem(data);
      } else {
        await ResourceService.updateInventoryItem(widget.item!.id, data);
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
        title: Text(widget.item == null ? 'Add Inventory Item' : 'Edit Inventory Item'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Item Name (e.g. Trauma Dressing)', border: OutlineInputBorder()),
              validator: (v) => v!.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _category,
              decoration: const InputDecoration(labelText: 'Category', border: OutlineInputBorder()),
              items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
              onChanged: (v) {
                if (v != null) setState(() => _category = v);
              },
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _quantityController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Quantity', border: OutlineInputBorder()),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _unitController,
                    decoration: const InputDecoration(labelText: 'Unit (e.g. Kits, Liters)', border: OutlineInputBorder()),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _thresholdController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Minimum Threshold', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _locationController,
              decoration: const InputDecoration(labelText: 'Location (e.g. Colombo Warehouse A)', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _isLoading ? null : _save,
              style: ElevatedButton.styleFrom(
                minimumSize: const Size.fromHeight(50),
              ),
              child: _isLoading 
                ? const CircularProgressIndicator(color: Colors.white)
                : const Text('Save Item', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}
