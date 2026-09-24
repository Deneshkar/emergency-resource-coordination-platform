import 'package:flutter/material.dart';
import '../models/validation_result.dart';
import '../services/validation_service.dart';
import '../services/dispatch_service.dart';
import '../models/dispatch.dart';

/// Member 4 — Validation/Safety Agent screen.
/// Run deterministic safety gate before approving a dispatch.
/// Coordinator/Admin only (backend enforces 403 otherwise).
class ValidationResultScreen extends StatefulWidget {
  final int? initialDispatchId;
  const ValidationResultScreen({super.key, this.initialDispatchId});

  @override
  State<ValidationResultScreen> createState() => _ValidationResultScreenState();
}

class _ValidationResultScreenState extends State<ValidationResultScreen> {
  final _idCtrl = TextEditingController();
  bool _loading = false;
  bool _loadingHistory = false;
  String? _error;
  ValidationResult? _result;
  List<ValidationHistoryEntry> _history = [];
  List<Dispatch> _dispatches = [];
  int? _selectedId;
  DateTime? _shiftStart;
  DateTime? _shiftEnd;
  final _shelterIdCtrl = TextEditingController();
  final _incomingCtrl = TextEditingController();
  final _inventoryIdCtrl = TextEditingController();
  final _qtyCtrl = TextEditingController();
  Map<String, dynamic>? _tools;
  String? _toolsError;

  @override
  void initState() {
    super.initState();
    if (widget.initialDispatchId != null) {
      _idCtrl.text = '${widget.initialDispatchId}';
      _selectedId = widget.initialDispatchId;
      _run();
    }
    _loadDispatches();
  }

  @override
  void dispose() {
    _idCtrl.dispose();
    _shelterIdCtrl.dispose();
    _incomingCtrl.dispose();
    _inventoryIdCtrl.dispose();
    _qtyCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadDispatches() async {
    try {
      final d = await DispatchService.getDispatches();
      if (mounted) setState(() => _dispatches = d);
    } catch (_) {}
    try {
      final t = await ValidationService.getTools();
      if (mounted) setState(() => _tools = t);
    } catch (e) {
      if (mounted) setState(() => _toolsError = _clean(e));
    }
  }

  Future<void> _run() async {
    final id = int.tryParse(_idCtrl.text.trim());
    if (id == null) {
      setState(() => _error = 'Enter a valid numeric dispatch ID.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
      _result = null;
    });
    try {
      final shelterAllocs = <Map<String, dynamic>>[];
      final sid = int.tryParse(_shelterIdCtrl.text.trim());
      final inc = int.tryParse(_incomingCtrl.text.trim());
      if (sid != null && inc != null) {
        shelterAllocs.add({'shelterId': sid, 'incomingCount': inc});
      }
      final invAllocs = <Map<String, dynamic>>[];
      final iid = int.tryParse(_inventoryIdCtrl.text.trim());
      final qty = int.tryParse(_qtyCtrl.text.trim());
      if (iid != null && qty != null) {
        invAllocs.add({'inventoryItemId': iid, 'requestedQty': qty});
      }
      if (_shiftStart != null && _shiftEnd != null && !_shiftEnd!.isAfter(_shiftStart!)) {
        if (mounted) setState(() => _error = 'Override end time must be after start time.');
        if (mounted) setState(() => _loading = false);
        return;
      }
      final r = await ValidationService.validateDispatch(
        id,
        proposedShiftStart: _shiftStart,
        proposedShiftEnd: _shiftEnd,
        shelterAllocations: shelterAllocs.isEmpty ? null : shelterAllocs,
        inventoryRequests: invAllocs.isEmpty ? null : invAllocs,
      );
      if (!mounted) return;
      setState(() {
        _result = r;
        _selectedId = id;
      });
      await _loadHistory(id);
    } catch (e) {
      if (mounted) setState(() => _error = _clean(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadHistory(int id) async {
    setState(() => _loadingHistory = true);
    try {
      final h = await ValidationService.getHistory(id);
      if (mounted) setState(() => _history = h);
    } catch (_) {
      // history failure is non-fatal; result already shown
    } finally {
      if (mounted) setState(() => _loadingHistory = false);
    }
  }

  String _clean(Object e) => e.toString().replaceFirst('Exception: ', '');

  Color _recColor(String rec) {
    switch (rec.toUpperCase()) {
      case 'APPROVE':
        return Colors.green;
      case 'REVISE':
        return Colors.orange;
      default:
        return Colors.red;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Safety Validation Gate')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Validation / Safety Agent — deterministic pre-approval gate. '
              'Run before approving any dispatch. Requires Coordinator/Admin login.',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _idCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Dispatch ID',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.shield_outlined),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton.icon(
                  onPressed: _loading ? null : _run,
                  icon: _loading
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.play_arrow),
                  label: const Text('Validate'),
                ),
              ],
            ),
            ExpansionTile(
              title: const Text('Override context (optional)', style: TextStyle(fontSize: 13)),
              children: [
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () async {
                          final ctx = context;
                          final d = await showDatePicker(
                            context: ctx,
                            initialDate: _shiftStart ?? DateTime.now(),
                            firstDate: DateTime.now().subtract(const Duration(days: 30)),
                            lastDate: DateTime.now().add(const Duration(days: 365)),
                          );
                          if (d == null || !ctx.mounted) return;
                          final t = await showTimePicker(
                              context: ctx, initialTime: TimeOfDay.now());
                          if (t == null || !ctx.mounted) return;
                          setState(() => _shiftStart =
                              DateTime(d.year, d.month, d.day, t.hour, t.minute));
                        },
                        child: Text(_shiftStart == null
                            ? 'Shift start'
                            : _shiftStart.toString().substring(0, 16)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () async {
                          final ctx = context;
                          final d = await showDatePicker(
                            context: ctx,
                            initialDate: _shiftEnd ?? DateTime.now().add(const Duration(hours: 8)),
                            firstDate: DateTime.now().subtract(const Duration(days: 30)),
                            lastDate: DateTime.now().add(const Duration(days: 365)),
                          );
                          if (d == null || !ctx.mounted) return;
                          final t = await showTimePicker(
                              context: ctx, initialTime: TimeOfDay.now());
                          if (t == null || !ctx.mounted) return;
                          setState(() => _shiftEnd =
                              DateTime(d.year, d.month, d.day, t.hour, t.minute));
                        },
                        child: Text(_shiftEnd == null
                            ? 'Shift end'
                            : _shiftEnd.toString().substring(0, 16)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _shelterIdCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                            labelText: 'Shelter ID', border: OutlineInputBorder()),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _incomingCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                            labelText: 'Incoming', border: OutlineInputBorder()),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _inventoryIdCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                            labelText: 'Inventory ID', border: OutlineInputBorder()),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _qtyCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                            labelText: 'Qty', border: OutlineInputBorder()),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  _tools == null
                      ? (_toolsError ?? 'Allow-list: loading…')
                      : 'Allow-list: ${( _tools!['allowedTools'] as List).join(', ')}',
                  style: const TextStyle(fontSize: 11, color: Colors.grey),
                ),
              ],
            ),
            if (_dispatches.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: _dispatches.take(6).map((d) {
                  return ActionChip(
                    label: Text('#${d.id} ${d.status}'),
                    onPressed: () {
                      _idCtrl.text = '${d.id}';
                      _run();
                    },
                  );
                }).toList(),
              ),
            ],
            if (_error != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.shade200)),
                child: Text(_error!, style: TextStyle(color: Colors.red.shade800)),
              ),
            ],
            if (_result != null) ...[
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: _recColor(_result!.recommendation).withAlpha(30),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: _recColor(_result!.recommendation)),
                            ),
                            child: Text(
                              _result!.recommendation,
                              style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: _recColor(_result!.recommendation)),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(_result!.isValid ? 'Valid' : 'Invalid',
                              style: const TextStyle(fontWeight: FontWeight.bold)),
                          const Spacer(),
                          Text('${_result!.durationMs}ms',
                              style: const TextStyle(fontSize: 12, color: Colors.grey)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                          'Dispatch #${_result!.dispatchId ?? _selectedId} • Audit #${_result!.auditId ?? '-'} • by ${_result!.validatedBy}',
                          style: const TextStyle(fontSize: 12, color: Colors.grey)),
                      const Divider(),
                      Text('Violations (${_result!.violations.length})',
                          style: const TextStyle(fontWeight: FontWeight.bold)),
                      if (_result!.violations.isEmpty)
                        const Text('None', style: TextStyle(color: Colors.grey)),
                      ..._result!.violations.map((v) => ListTile(
                            dense: true,
                            leading: Icon(
                                v.severity == 'BLOCKER' ? Icons.block : Icons.warning,
                                color: v.severity == 'BLOCKER' ? Colors.red : Colors.orange),
                            title: Text(v.code, style: const TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: Text(v.message),
                          )),
                      const SizedBox(height: 8),
                      Text('Warnings (${_result!.warnings.length})',
                          style: const TextStyle(fontWeight: FontWeight.bold)),
                      if (_result!.warnings.isEmpty)
                        const Text('None — no warnings', style: TextStyle(color: Colors.grey)),
                      ..._result!.warnings.map((w) => ListTile(
                            dense: true,
                            leading: const Icon(Icons.info_outline, color: Colors.amber),
                            title: Text(w.code, style: const TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: Text(w.message),
                          )),
                      const SizedBox(height: 8),
                      Text('Tool checks (${_result!.checks.length})',
                          style: const TextStyle(fontWeight: FontWeight.bold)),
                      ..._result!.checks.map((c) => ListTile(
                            dense: true,
                            leading: Icon(c.passed ? Icons.check_circle : Icons.cancel,
                                color: c.passed ? Colors.green : Colors.red),
                            title: Text(c.tool),
                            subtitle: Text(c.detail),
                          )),
                    ],
                  ),
                ),
              ),
            ],
            const SizedBox(height: 16),
            Row(
              children: [
                const Text('History', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(width: 8),
                if (_loadingHistory)
                  const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2)),
              ],
            ),
            if (_history.isEmpty)
              const Text('No validation history loaded yet.', style: TextStyle(color: Colors.grey))
            else
              ..._history.map((h) => ListTile(
                    dense: true,
                    leading: Icon(Icons.history, color: _recColor(h.recommendation)),
                    title: Text('#${h.auditId} ${h.recommendation} — ${h.violationCount}V/${h.warningCount}W'),
                    subtitle: Text('${h.validatedBy} • ${h.validatedAt}'),
                  )),
          ],
        ),
      ),
    );
  }
}
