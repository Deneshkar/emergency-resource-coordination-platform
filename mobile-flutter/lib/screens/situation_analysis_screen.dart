import 'package:flutter/material.dart';
import '../models/situation_assessment.dart';
import '../services/resource_service.dart';

class SituationAnalysisScreen extends StatefulWidget {
  const SituationAnalysisScreen({super.key});

  @override
  State<SituationAnalysisScreen> createState() => _SituationAnalysisScreenState();
}

class _SituationAnalysisScreenState extends State<SituationAnalysisScreen> {
  final TextEditingController _incidentIdController = TextEditingController(text: '1');
  SituationAssessmentModel? _assessment;
  bool _isLoading = false;
  String _error = '';

  Future<void> _runAnalysis() async {
    final id = int.tryParse(_incidentIdController.text.trim());
    if (id == null) return;

    setState(() {
      _isLoading = true;
      _error = '';
    });

    try {
      final result = await ResourceService.assessSituation(id);
      setState(() {
        _assessment = result;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Situation Analysis Agent'),
        backgroundColor: Colors.deepPurple,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Run AI Urgency & Gap Analysis',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _incidentIdController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Incident ID',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton(
                  onPressed: _isLoading ? null : _runAnalysis,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.deepPurple,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  ),
                  child: _isLoading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Run AI Agent'),
                ),
              ],
            ),
            if (_error.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(_error, style: const TextStyle(color: Colors.red)),
            ],
            if (_assessment != null) ...[
              const SizedBox(height: 20),
              Card(
                color: Colors.deepPurple.shade50,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Incident #${_assessment!.incidentId}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          Chip(
                            label: Text('Urgency: ${_assessment!.urgencyLevel} (${_assessment!.urgencyScore})'),
                            backgroundColor: Colors.deepPurple,
                            labelStyle: const TextStyle(color: Colors.white),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text('Summary: ${_assessment!.analysisSummary}'),
                      const Divider(height: 24),
                      Text('Recommended: ${_assessment!.recommendedResourceTypes}', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue)),
                      const SizedBox(height: 6),
                      Text('Nearest Shelter: ${_assessment!.nearestShelterName ?? "N/A"} (Avail: ${_assessment!.availableShelterCapacity})', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green)),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
