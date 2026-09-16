class AuthUser {
  final int id;
  final String fullName;
  final String email;
  final String role;
  final String? phoneNumber;
  final String? skills;

  AuthUser({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
    this.phoneNumber,
    this.skills,
  });

  bool get isVolunteer => role.toLowerCase() == 'volunteer';
  bool get isCitizen => role.toLowerCase() == 'citizen';
  bool get isCoordinator => role.toLowerCase() == 'coordinator';
  bool get isAdmin => role.toLowerCase() == 'admin';
  bool get canCoordinate => isCoordinator || isAdmin;

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      fullName: json['fullName'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'Citizen',
      phoneNumber: json['phoneNumber'],
      skills: json['skills'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'email': email,
      'role': role,
      'phoneNumber': phoneNumber,
      'skills': skills,
    };
  }
}
