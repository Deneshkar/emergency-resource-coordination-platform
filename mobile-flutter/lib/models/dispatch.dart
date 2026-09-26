class DispatchTask {
  final int id;
  final int dispatchId;
  final String volunteerId;
  final int? resourceId;
  final String taskType;
  final String status;
  final DateTime? assignedAt;

  DispatchTask({
    required this.id,
    required this.dispatchId,
    required this.volunteerId,
    this.resourceId,
    required this.taskType,
    required this.status,
    this.assignedAt,
  });

  factory DispatchTask.fromJson(Map<String, dynamic> json) {
    return DispatchTask(
      id: json['id'] ?? 0,
      dispatchId: json['dispatchId'] ?? 0,
      volunteerId: json['volunteerId'] ?? '',
      resourceId: (json['resourceId'] as num?)?.toInt(),
      taskType: json['taskType'] ?? '',
      status: json['status'] ?? 'Assigned',
      assignedAt: json['assignedAt'] != null ? DateTime.parse(json['assignedAt']) : null,
    );
  }
}

class Dispatch {
  final int id;
  final int incidentId;
  final String status;
  final String priority;
  final DateTime createdAt;
  final List<DispatchTask> tasks;

  Dispatch({
    required this.id,
    required this.incidentId,
    required this.status,
    required this.priority,
    required this.createdAt,
    this.tasks = const [],
  });

  factory Dispatch.fromJson(Map<String, dynamic> json) {
    return Dispatch(
      id: json['id'] ?? 0,
      incidentId: json['incidentId'] ?? 0,
      status: json['status'] ?? 'Proposed',
      priority: json['priority'] ?? 'Medium',
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
      tasks: json['tasks'] != null
          ? (json['tasks'] as List).map((t) => DispatchTask.fromJson(t)).toList()
          : [],
    );
  }
}
