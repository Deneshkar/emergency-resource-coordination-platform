class ResourceModel {
  final int id;
  final String name;
  final String resourceType;
  final String status;
  final int capacity;
  final String location;
  final int? shelterId;
  final String? shelterName;

  ResourceModel({
    required this.id,
    required this.name,
    required this.resourceType,
    required this.status,
    required this.capacity,
    required this.location,
    this.shelterId,
    this.shelterName,
  });

  factory ResourceModel.fromJson(Map<String, dynamic> json) {
    return ResourceModel(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      resourceType: json['resourceType'] ?? '',
      status: json['status'] ?? 'Available',
      capacity: json['capacity'] ?? 1,
      location: json['location'] ?? '',
      shelterId: json['shelterId'],
      shelterName: json['shelterName'],
    );
  }
}
