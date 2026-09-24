import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../models/volunteer.dart';
import '../models/shift.dart';
import 'api_config.dart';
import 'auth_service.dart';

/// Member 4 — Volunteer/Responder Management API client.
/// Matches backend/Controllers/VolunteersController.cs exactly.
class VolunteerService {
  static const Duration _timeout = Duration(seconds: 15);

  static String _cleanError(http.Response r, String fallback) {
    try {
      final err = jsonDecode(r.body);
      if (err is Map) {
        if (err['message'] != null) return err['message'].toString();
        // ASP.NET ModelState: {"errors": {...}} or {"title": ...}
        if (err['title'] != null) return err['title'].toString();
        if (err['errors'] is Map) {
          final errs = (err['errors'] as Map).values.expand((e) => e is List ? e : [e]);
          return errs.map((e) => e.toString()).join('\n');
        }
      }
    } catch (_) {}
    if (r.statusCode == 401) return 'Session expired. Please log in again.';
    if (r.statusCode == 403) return 'You do not have permission for this action.';
    if (r.statusCode == 404) return 'Record not found.';
    return '$fallback (${r.statusCode})';
  }

  static void _throwNetwork(Object e) {
    if (e is SocketException) {
      throw Exception('No network connection. Check internet and retry.');
    }
    if (e is TimeoutException) {
      throw Exception('Server timed out (cold start?). Retry in a moment.');
    }
    // other errors fall through to the rethrow at the call site
  }

  static Future<Volunteer> registerVolunteer({
    required String name,
    required String email,
    required String phone,
    required String skills,
  }) async {
    final token = await AuthService.getToken();
    try {
      final response = await http
          .post(
            Uri.parse("${ApiConfig.baseUrl}/Volunteers"),
            headers: ApiConfig.defaultHeaders(token),
            body: jsonEncode({
              "name": name,
              "email": email,
              "phone": phone,
              "skills": skills,
            }),
          )
          .timeout(_timeout);

      if (response.statusCode == 201) {
        return Volunteer.fromJson(jsonDecode(response.body));
      } else {
        throw Exception(_cleanError(response, 'Failed to register volunteer'));
      }
    } catch (e) {
      _throwNetwork(e);
      rethrow;
    }
  }

  static Future<void> updateAvailability(String id, bool isAvailable) async {
    final token = await AuthService.getToken();
    try {
      final response = await http
          .put(
            Uri.parse("${ApiConfig.baseUrl}/Volunteers/$id/availability"),
            headers: ApiConfig.defaultHeaders(token),
            body: jsonEncode({"isAvailable": isAvailable}),
          )
          .timeout(_timeout);

      if (response.statusCode != 204) {
        throw Exception(_cleanError(response, 'Failed to update availability'));
      }
    } catch (e) {
      _throwNetwork(e);
      rethrow;
    }
  }

  /// GET /api/volunteers?search=&isAvailable=&page=&pageSize=
  /// Backend defaults page=1 pageSize=10; end of list when returned < pageSize.
  static Future<List<Volunteer>> getVolunteers({
    String? search,
    bool? isAvailable,
    int page = 1,
    int pageSize = 20,
  }) async {
    final token = await AuthService.getToken();
    final qp = <String, String>{
      'page': '$page',
      'pageSize': '$pageSize',
    };
    if (search != null && search.trim().isNotEmpty) qp['search'] = search.trim();
    if (isAvailable != null) qp['isAvailable'] = '$isAvailable';
    final uri = Uri.parse("${ApiConfig.baseUrl}/Volunteers").replace(queryParameters: qp);
    try {
      final response =
          await http.get(uri, headers: ApiConfig.defaultHeaders(token)).timeout(_timeout);

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => Volunteer.fromJson(json as Map<String, dynamic>)).toList();
      } else {
        throw Exception(_cleanError(response, 'Failed to load volunteers'));
      }
    } catch (e) {
      _throwNetwork(e);
      rethrow;
    }
  }

  static Future<Volunteer> getVolunteerById(String id) async {
    final token = await AuthService.getToken();
    try {
      final response = await http
          .get(
            Uri.parse("${ApiConfig.baseUrl}/Volunteers/$id"),
            headers: ApiConfig.defaultHeaders(token),
          )
          .timeout(_timeout);
      if (response.statusCode == 200) {
        return Volunteer.fromJson(jsonDecode(response.body));
      }
      throw Exception(_cleanError(response, 'Failed to load volunteer'));
    } catch (e) {
      _throwNetwork(e);
      rethrow;
    }
  }

  /// GET /api/volunteers/available?skill=medical
  static Future<List<Volunteer>> getAvailableBySkill(String skill) async {
    final token = await AuthService.getToken();
    final uri = Uri.parse("${ApiConfig.baseUrl}/Volunteers/available")
        .replace(queryParameters: {'skill': skill});
    try {
      final response =
          await http.get(uri, headers: ApiConfig.defaultHeaders(token)).timeout(_timeout);
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => Volunteer.fromJson(json as Map<String, dynamic>)).toList();
      }
      throw Exception(_cleanError(response, 'Failed to load available volunteers'));
    } catch (e) {
      _throwNetwork(e);
      rethrow;
    }
  }

  /// Paginated scan for email (backend has no by-email endpoint).
  /// Returns null when genuinely not found; throws on auth/network errors.
  static Future<Volunteer?> getVolunteerByEmail(String email) async {
    final clean = email.trim().toLowerCase();
    int page = 1;
    const pageSize = 50;
    while (true) {
      final batch = await getVolunteers(page: page, pageSize: pageSize);
      for (final v in batch) {
        if (v.email.trim().toLowerCase() == clean) return v;
      }
      if (batch.length < pageSize) return null;
      page++;
      if (page > 20) return null; // safety cap (1000 records)
    }
  }

  static Future<List<Shift>> getShifts(String volunteerId) async {
    final token = await AuthService.getToken();
    try {
      final response = await http
          .get(
            Uri.parse("${ApiConfig.baseUrl}/Volunteers/$volunteerId/shifts"),
            headers: ApiConfig.defaultHeaders(token),
          )
          .timeout(_timeout);

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => Shift.fromJson(json as Map<String, dynamic>)).toList();
      } else {
        throw Exception(_cleanError(response, 'Failed to load shifts'));
      }
    } catch (e) {
      _throwNetwork(e);
      rethrow;
    }
  }

  /// POST /api/volunteers/{id}/shifts {startTime, endTime, status}
  /// Coordinator/Admin only per backend.
  static Future<Shift> createShift({
    required String volunteerId,
    required DateTime startTime,
    required DateTime endTime,
    String status = 'Scheduled',
  }) async {
    final token = await AuthService.getToken();
    try {
      final response = await http
          .post(
            Uri.parse("${ApiConfig.baseUrl}/Volunteers/$volunteerId/shifts"),
            headers: ApiConfig.defaultHeaders(token),
            body: jsonEncode({
              "startTime": startTime.toUtc().toIso8601String(),
              "endTime": endTime.toUtc().toIso8601String(),
              "status": status,
            }),
          )
          .timeout(_timeout);
      if (response.statusCode == 201) {
        return Shift.fromJson(jsonDecode(response.body));
      }
      throw Exception(_cleanError(response, 'Failed to create shift'));
    } catch (e) {
      _throwNetwork(e);
      rethrow;
    }
  }

  /// PUT /api/volunteers/{id} {name, phone, skills}
  /// Coordinator/Admin any record, Volunteer own record only (backend 403 otherwise).
  static Future<Volunteer> updateVolunteer({
    required String id,
    required String name,
    required String phone,
    required String skills,
  }) async {
    final token = await AuthService.getToken();
    try {
      final response = await http
          .put(
            Uri.parse("${ApiConfig.baseUrl}/Volunteers/$id"),
            headers: ApiConfig.defaultHeaders(token),
            body: jsonEncode({"name": name, "phone": phone, "skills": skills}),
          )
          .timeout(_timeout);
      if (response.statusCode == 200) {
        return Volunteer.fromJson(jsonDecode(response.body));
      }
      throw Exception(_cleanError(response, 'Failed to update volunteer'));
    } catch (e) {
      _throwNetwork(e);
      rethrow;
    }
  }

  /// PUT /api/volunteers/{id}/shifts/{shiftId}
  static Future<Shift> updateShift({
    required String volunteerId,
    required String shiftId,
    required DateTime startTime,
    required DateTime endTime,
    required String status,
  }) async {
    final token = await AuthService.getToken();
    try {
      final response = await http
          .put(
            Uri.parse("${ApiConfig.baseUrl}/Volunteers/$volunteerId/shifts/$shiftId"),
            headers: ApiConfig.defaultHeaders(token),
            body: jsonEncode({
              "startTime": startTime.toUtc().toIso8601String(),
              "endTime": endTime.toUtc().toIso8601String(),
              "status": status,
            }),
          )
          .timeout(_timeout);
      if (response.statusCode == 200) {
        return Shift.fromJson(jsonDecode(response.body));
      }
      throw Exception(_cleanError(response, 'Failed to update shift'));
    } catch (e) {
      _throwNetwork(e);
      rethrow;
    }
  }

  /// DELETE /api/volunteers/{id}/shifts/{shiftId}
  static Future<void> deleteShift({
    required String volunteerId,
    required String shiftId,
  }) async {
    final token = await AuthService.getToken();
    try {
      final response = await http
          .delete(
            Uri.parse("${ApiConfig.baseUrl}/Volunteers/$volunteerId/shifts/$shiftId"),
            headers: ApiConfig.defaultHeaders(token),
          )
          .timeout(_timeout);
      if (response.statusCode != 200 && response.statusCode != 204) {
        throw Exception(_cleanError(response, 'Failed to delete shift'));
      }
    } catch (e) {
      _throwNetwork(e);
      rethrow;
    }
  }

  static Future<void> deleteVolunteer(String id) async {
    final token = await AuthService.getToken();
    try {
      final response = await http
          .delete(
            Uri.parse("${ApiConfig.baseUrl}/Volunteers/$id"),
            headers: ApiConfig.defaultHeaders(token),
          )
          .timeout(_timeout);

      if (response.statusCode != 200 && response.statusCode != 204) {
        throw Exception(_cleanError(response, 'Failed to delete volunteer'));
      }
    } catch (e) {
      _throwNetwork(e);
      rethrow;
    }
  }
}
