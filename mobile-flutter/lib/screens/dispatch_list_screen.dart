import 'package:flutter/material.dart';
import '../models/dispatch.dart';
import '../services/dispatch_service.dart';

class DispatchListScreen extends StatefulWidget {
  const DispatchListScreen({super.key});

  @override
  State<DispatchListScreen> createState() => _DispatchListScreenState();
}

class _DispatchListScreenState extends State<DispatchListScreen> {
  late Future<List<Dispatch>> _dispatchesFuture;

  @override
  void initState() {
    super.initState();
    _refreshDispatches();
  }

  void _refreshDispatches() {
    setState(() {
      _dispatchesFuture = DispatchService.getDispatches();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dispatch Management'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _refreshDispatches,
          ),
        ],
      ),
      body: FutureBuilder<List<Dispatch>>(
        future: _dispatchesFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}', style: const TextStyle(color: Colors.red)));
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('No active dispatches.'));
          }

          final dispatches = snapshot.data!;
          dispatches.sort((a, b) => b.createdAt.compareTo(a.createdAt));

          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: dispatches.length,
            itemBuilder: (context, index) {
              final dispatch = dispatches[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 16),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Dispatch #${dispatch.id}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          Chip(
                            label: Text(dispatch.status),
                            backgroundColor: dispatch.status == 'Proposed' ? Colors.orange : Colors.green,
                            labelStyle: const TextStyle(color: Colors.white, fontSize: 12),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text('Incident ID: ${dispatch.incidentId} | Priority: ${dispatch.priority}'),
                      const Divider(height: 24),
                      const Text('Tasks / Assignments', style: TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      if (dispatch.tasks.isEmpty)
                        const Text('No tasks assigned yet.', style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic))
                      else
                        ...dispatch.tasks.map((task) => Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              child: Row(
                                children: [
                                  Icon(Icons.assignment_ind, size: 16, color: Colors.blue.shade700),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text('${task.taskType} (Vol: ${task.volunteerId.split('-').first})'),
                                  ),
                                  Text(task.status, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                ],
                              ),
                            )),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
