class Incident {
  final int id;
  final String title;
  final String description;
  final String location;
  final String status;
  final String priority;
  final String category;
  final int affectedCount;
  final String reporterContact;
  final String assignedCoordinator;
  final DateTime createdAt;
  final DateTime updatedAt;

  Incident({
    required this.id,
    required this.title,
    required this.description,
    required this.location,
    required this.status,
    required this.priority,
    required this.category,
    required this.affectedCount,
    required this.reporterContact,
    required this.assignedCoordinator,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Incident.fromJson(Map<String, dynamic> json) {
    return Incident(
      id: json['id'] ?? 0,
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      location: json['location'] ?? '',
      status: json['status'] ?? 'Reported',
      priority: json['priority'] ?? 'Medium',
      category: json['category'] ?? 'General Emergency',
      affectedCount: json['affectedCount'] ?? 0,
      reporterContact: json['reporterContact'] ?? '',
      assignedCoordinator: json['assignedCoordinator'] ?? 'AI Coordinator',
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'location': location,
      'status': status,
      'priority': priority,
      'category': category,
      'affectedCount': affectedCount,
      'reporterContact': reporterContact,
      'assignedCoordinator': assignedCoordinator,
    };
  }
}
