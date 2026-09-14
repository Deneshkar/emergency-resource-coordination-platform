class ShelterModel {
  final int id;
  final String name;
  final String location;
  final String address;
  final int totalCapacity;
  final int currentOccupancy;
  final int availableCapacity;
  final String status;
  final String contactNumber;

  ShelterModel({
    required this.id,
    required this.name,
    required this.location,
    required this.address,
    required this.totalCapacity,
    required this.currentOccupancy,
    required this.availableCapacity,
    required this.status,
    required this.contactNumber,
  });

  factory ShelterModel.fromJson(Map<String, dynamic> json) {
    return ShelterModel(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      location: json['location'] ?? '',
      address: json['address'] ?? '',
      totalCapacity: json['totalCapacity'] ?? 0,
      currentOccupancy: json['currentOccupancy'] ?? 0,
      availableCapacity: json['availableCapacity'] ?? 0,
      status: json['status'] ?? 'Active',
      contactNumber: json['contactNumber'] ?? '',
    );
  }
}
