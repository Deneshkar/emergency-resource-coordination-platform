class Volunteer {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String skills;
  final bool isAvailable;
  final double rating;

  Volunteer({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.skills,
    required this.isAvailable,
    required this.rating,
  });

  factory Volunteer.fromJson(Map<String, dynamic> json) {
    return Volunteer(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      phone: json['phone'],
      skills: json['skills'],
      isAvailable: json['isAvailable'],
      rating: (json['rating'] as num).toDouble(),
    );
  }
}