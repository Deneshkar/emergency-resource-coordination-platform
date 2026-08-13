import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/volunteer.dart';

class VolunteerService {
  // Use 10.0.2.2 instead of localhost when testing on an Android emulator
  static const String baseUrl = "http://localhost:5009/api";

  static Future<Volunteer> registerVolunteer({
    required String name,
    required String email,
    required String phone,
    required String skills,
  }) async {
    final response = await http.post(
      Uri.parse("$baseUrl/Volunteers"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({
        "name": name,
        "email": email,
        "phone": phone,
        "skills": skills,
      }),
    );

    if (response.statusCode == 201) {
      return Volunteer.fromJson(jsonDecode(response.body));
    } else {
      throw Exception("Failed to register volunteer");
    }
  }

  static Future<void> updateAvailability(String id, bool isAvailable) async {
    final response = await http.put(
      Uri.parse("$baseUrl/Volunteers/$id/availability"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({"isAvailable": isAvailable}),
    );

    if (response.statusCode != 204) {
      throw Exception("Failed to update availability");
    }
  }
}