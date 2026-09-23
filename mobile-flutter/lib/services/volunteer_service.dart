import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/volunteer.dart';
import '../models/shift.dart';
import 'api_config.dart';
import 'auth_service.dart';

class VolunteerService {
  static Future<Volunteer> registerVolunteer({
    required String name,
    required String email,
    required String phone,
    required String skills,
  }) async {
    final token = await AuthService.getToken();
    final response = await http.post(
      Uri.parse("${ApiConfig.baseUrl}/Volunteers"),
      headers: ApiConfig.defaultHeaders(token),
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
      String msg = "Failed to register volunteer";
      try {
        final err = jsonDecode(response.body);
        if (err is Map && err['message'] != null) msg = err['message'];
      } catch (_) {}
      throw Exception(msg);
    }
  }

  static Future<void> updateAvailability(String id, bool isAvailable) async {
    final token = await AuthService.getToken();
    final response = await http.put(
      Uri.parse("${ApiConfig.baseUrl}/Volunteers/$id/availability"),
      headers: ApiConfig.defaultHeaders(token),
      body: jsonEncode({"isAvailable": isAvailable}),
    );

    if (response.statusCode != 204) {
      String msg = "Failed to update availability";
      try {
        final err = jsonDecode(response.body);
        if (err is Map && err['message'] != null) msg = err['message'];
      } catch (_) {}
      throw Exception(msg);
    }
  }

  static Future<List<Volunteer>> getVolunteers() async {
    final token = await AuthService.getToken();
    final response = await http.get(
      Uri.parse("${ApiConfig.baseUrl}/Volunteers"),
      headers: ApiConfig.defaultHeaders(token),
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => Volunteer.fromJson(json)).toList();
    } else {
      throw Exception("Failed to load volunteers");
    }
  }

  static Future<Volunteer?> getVolunteerByEmail(String email) async {
    try {
      final volunteers = await getVolunteers();
      final clean = email.trim().toLowerCase();
      for (final v in volunteers) {
        if (v.email.trim().toLowerCase() == clean) {
          return v;
        }
      }
    } catch (_) {}
    return null;
  }

  static Future<List<Shift>> getShifts(String volunteerId) async {
    final token = await AuthService.getToken();
    final response = await http.get(
      Uri.parse("${ApiConfig.baseUrl}/Volunteers/$volunteerId/shifts"),
      headers: ApiConfig.defaultHeaders(token),
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => Shift.fromJson(json)).toList();
    } else {
      throw Exception("Failed to load shifts");
    }
  }

  static Future<void> deleteVolunteer(String id) async {
    final token = await AuthService.getToken();
    final response = await http.delete(
      Uri.parse("${ApiConfig.baseUrl}/Volunteers/$id"),
      headers: ApiConfig.defaultHeaders(token),
    );

    if (response.statusCode != 200 && response.statusCode != 204) {
      throw Exception("Failed to delete volunteer");
    }
  }

  static Future<void> deleteAllVolunteers() async {
    final token = await AuthService.getToken();
    final response = await http.delete(
      Uri.parse("${ApiConfig.baseUrl}/Volunteers"),
      headers: ApiConfig.defaultHeaders(token),
    );

    if (response.statusCode != 200 && response.statusCode != 204) {
      throw Exception("Failed to delete all volunteers");
    }
  }
}