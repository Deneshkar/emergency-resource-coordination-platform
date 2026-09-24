class Volunteer {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String skills;
  final bool isAvailable;
  final double rating;
  final String? createdAt;

  Volunteer({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.skills,
    required this.isAvailable,
    required this.rating,
    this.createdAt,
  });

  static String _str(dynamic v, [String fallback = '']) {
    if (v == null) return fallback;
    return v.toString();
  }

  factory Volunteer.fromJson(Map<String, dynamic> json) {
    double rating = 0.0;
    final rawRating = json['rating'];
    if (rawRating is num) {
      rating = rawRating.toDouble();
    } else if (rawRating is String) {
      rating = double.tryParse(rawRating) ?? 0.0;
    }
    return Volunteer(
      id: _str(json['id'] ?? json['Id']),
      name: _str(json['name'] ?? json['Name'], 'Unknown'),
      email: _str(json['email'] ?? json['Email']),
      phone: _str(json['phone'] ?? json['Phone'], 'Not provided'),
      skills: _str(json['skills'] ?? json['Skills'], 'General Assistance'),
      isAvailable: json['isAvailable'] ?? json['IsAvailable'] ?? false,
      rating: rating,
      createdAt: json['createdAt']?.toString() ?? json['CreatedAt']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'phone': phone,
        'skills': skills,
        'isAvailable': isAvailable,
        'rating': rating,
      };

  Volunteer copyWith({bool? isAvailable, String? skills, String? phone, double? rating}) {
    return Volunteer(
      id: id,
      name: name,
      email: email,
      phone: phone ?? this.phone,
      skills: skills ?? this.skills,
      isAvailable: isAvailable ?? this.isAvailable,
      rating: rating ?? this.rating,
      createdAt: createdAt,
    );
  }
}
