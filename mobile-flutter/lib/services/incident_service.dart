import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../models/incident.dart';
import 'api_config.dart';
import 'auth_service.dart';

class IncidentService {
  static const Duration _timeout = Duration(seconds: 15);

  static String _cleanError(http.Response r, String fallback) {
    try {
      final err = jsonDecode(r.body);
      if (err is Map) {
        if (err['message'] != null) return err['message'].toString();
        if (err['errors'] is Map) {
          final errs = (err['errors'] as Map).values.expand((e) => e is List ? e : [e]);
          return errs.map((e) => e.toString()).join('\n');
        }
        if (err['title'] != null) return err['title'].toString();
      }
    } catch (_) {}
    if (r.statusCode == 401) return 'Session expired. Please log in again.';
    if (r.statusCode == 403) return 'You do not have permission for this action.';
    if (r.statusCode == 404) return 'Incident not found.';
    return '$fallback (${r.statusCode})';
  }

  static void _throwNetwork(Object e) {
    if (e is SocketException) {
      throw Exception('No network connection. Check internet and retry.');
    }
    if (e is TimeoutException) {
      throw Exception('Server timed out. Please retry in a moment.');
    }
  }

  static Future<List<Incident>> getIncidents() async {
    final token = await AuthService.getToken();
    try {
      final response = await http
          .get(
            Uri.parse('${ApiConfig.baseUrl}/Incident'),
            headers: ApiConfig.defaultHeaders(token),
          )
          .timeout(_timeout);

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => Incident.fromJson(json)).toList();
      } else {
        throw Exception(_cleanError(response, 'Failed to load incidents'));
      }
    } catch (e) {
      _throwNetwork(e);
      if (e is Exception) rethrow;
      throw Exception('Error connecting to Incident API: $e');
    }
  }

  static Future<Incident> getIncident(int id) async {
    final token = await AuthService.getToken();
    try {
      final response = await http
          .get(
            Uri.parse('${ApiConfig.baseUrl}/Incident/$id'),
            headers: ApiConfig.defaultHeaders(token),
          )
          .timeout(_timeout);

      if (response.statusCode == 200) {
        return Incident.fromJson(json.decode(response.body));
      } else {
        throw Exception(_cleanError(response, 'Failed to load incident'));
      }
    } catch (e) {
      _throwNetwork(e);
      if (e is Exception) rethrow;
      throw Exception('Error connecting to Incident API: $e');
    }
  }

  static Future<Incident> createIncident(Map<String, dynamic> incidentData) async {
    final token = await AuthService.getToken();
    try {
      final response = await http
          .post(
            Uri.parse('${ApiConfig.baseUrl}/Incident'),
            headers: ApiConfig.defaultHeaders(token),
            body: json.encode(incidentData),
          )
          .timeout(_timeout);

      if (response.statusCode == 201 || response.statusCode == 200) {
        return Incident.fromJson(json.decode(response.body));
      } else {
        throw Exception(_cleanError(response, 'Failed to report emergency'));
      }
    } catch (e) {
      _throwNetwork(e);
      if (e is Exception) rethrow;
      throw Exception('Error reporting emergency: $e');
    }
  }

  static Future<void> updateIncident(int id, Map<String, dynamic> data) async {
    final token = await AuthService.getToken();
    try {
      final response = await http
          .put(
            Uri.parse('${ApiConfig.baseUrl}/Incident/$id'),
            headers: ApiConfig.defaultHeaders(token),
            body: json.encode(data),
          )
          .timeout(_timeout);

      if (response.statusCode != 200 && response.statusCode != 204) {
        throw Exception(_cleanError(response, 'Failed to update incident'));
      }
    } catch (e) {
      _throwNetwork(e);
      if (e is Exception) rethrow;
      throw Exception('Error updating incident: $e');
    }
  }

  static Future<void> deleteIncident(int id) async {
    final token = await AuthService.getToken();
    try {
      final response = await http
          .delete(
            Uri.parse('${ApiConfig.baseUrl}/Incident/$id'),
            headers: ApiConfig.defaultHeaders(token),
          )
          .timeout(_timeout);

      if (response.statusCode != 200 && response.statusCode != 204) {
        throw Exception(_cleanError(response, 'Failed to delete incident'));
      }
    } catch (e) {
      _throwNetwork(e);
      if (e is Exception) rethrow;
      throw Exception('Error deleting incident: $e');
    }
  }
}
