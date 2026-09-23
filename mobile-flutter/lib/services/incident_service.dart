import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/incident.dart';
import 'api_config.dart';

class IncidentService {
  static Future<List<Incident>> getIncidents() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/Incident'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => Incident.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load incidents: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error connecting to Incident API: $e');
    }
  }

  static Future<Incident> getIncident(int id) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/Incident/$id'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        return Incident.fromJson(json.decode(response.body));
      } else {
        throw Exception('Failed to load incident: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error connecting to Incident API: $e');
    }
  }

  static Future<Incident> createIncident(Map<String, dynamic> incidentData) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/Incident'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(incidentData),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        return Incident.fromJson(json.decode(response.body));
      } else {
        throw Exception('Failed to report emergency: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error reporting emergency: $e');
    }
  }
  static Future<void> updateIncident(int id, Map<String, dynamic> data) async {
    try {
      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/Incident/$id'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(data),
      );

      if (response.statusCode != 200 && response.statusCode != 204) {
        throw Exception('Failed to update incident: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error updating incident: $e');
    }
  }

  static Future<void> deleteIncident(int id) async {
    try {
      final response = await http.delete(
        Uri.parse('${ApiConfig.baseUrl}/Incident/$id'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode != 200 && response.statusCode != 204) {
        throw Exception('Failed to delete incident: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error deleting incident: $e');
    }
  }
}
