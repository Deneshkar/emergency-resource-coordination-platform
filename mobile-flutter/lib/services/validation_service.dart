import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../models/validation_result.dart';
import 'api_config.dart';
import 'auth_service.dart';

/// Member 4 — Validation/Safety Agent client.
/// Backend: backend/Controllers/ValidationsController.cs (Coordinator,Admin only).
/// Deterministic pre-approval gate: must run before coordinator approves a dispatch.
class ValidationService {
  static const Duration _timeout = Duration(seconds: 20);

  static String _err(http.Response r, String fallback) {
    try {
      final e = jsonDecode(r.body);
      if (e is Map && e['message'] != null) return e['message'].toString();
    } catch (_) {}
    if (r.statusCode == 401) return 'Session expired. Please log in again.';
    if (r.statusCode == 403) {
      return 'Validation requires Coordinator/Admin login. Volunteers cannot run the safety gate.';
    }
    if (r.statusCode == 404) return 'Dispatch not found.';
    return '$fallback (${r.statusCode})';
  }

  /// POST /api/validations/dispatch/{id} — body optional, pass {} when no overrides.
  static Future<ValidationResult> validateDispatch(
    int dispatchId, {
    DateTime? proposedShiftStart,
    DateTime? proposedShiftEnd,
    List<Map<String, dynamic>>? shelterAllocations,
    List<Map<String, dynamic>>? inventoryRequests,
  }) async {
    final token = await AuthService.getToken();
    final body = <String, dynamic>{};
    if (proposedShiftStart != null) {
      body['proposedShiftStart'] = proposedShiftStart.toUtc().toIso8601String();
    }
    if (proposedShiftEnd != null) {
      body['proposedShiftEnd'] = proposedShiftEnd.toUtc().toIso8601String();
    }
    if (shelterAllocations != null && shelterAllocations.isNotEmpty) {
      body['shelterAllocations'] = shelterAllocations;
    }
    if (inventoryRequests != null && inventoryRequests.isNotEmpty) {
      body['inventoryRequests'] = inventoryRequests;
    }
    try {
      final r = await http
          .post(
            Uri.parse('${ApiConfig.baseUrl}/validations/dispatch/$dispatchId'),
            headers: ApiConfig.defaultHeaders(token),
            body: jsonEncode(body),
          )
          .timeout(_timeout);
      if (r.statusCode == 200) {
        return ValidationResult.fromJson(jsonDecode(r.body));
      }
      throw Exception(_err(r, 'Validation failed'));
    } on SocketException {
      throw Exception('No network connection. Retry.');
    } on TimeoutException {
      throw Exception('Validation timed out. Retry.');
    }
  }

  /// GET /api/validations/dispatch/{id}/history
  static Future<List<ValidationHistoryEntry>> getHistory(int dispatchId) async {
    final token = await AuthService.getToken();
    try {
      final r = await http
          .get(
            Uri.parse('${ApiConfig.baseUrl}/validations/dispatch/$dispatchId/history'),
            headers: ApiConfig.defaultHeaders(token),
          )
          .timeout(_timeout);
      if (r.statusCode == 200) {
        final List<dynamic> data = jsonDecode(r.body);
        return data
            .map((e) => ValidationHistoryEntry.fromJson((e as Map).cast<String, dynamic>()))
            .toList();
      }
      throw Exception(_err(r, 'Failed to load validation history'));
    } on SocketException {
      throw Exception('No network connection. Retry.');
    } on TimeoutException {
      throw Exception('Request timed out. Retry.');
    }
  }

  /// GET /api/validations/tools — allow-list for orchestration conformance.
  static Future<Map<String, dynamic>> getTools() async {
    final token = await AuthService.getToken();
    final r = await http
        .get(Uri.parse('${ApiConfig.baseUrl}/validations/tools'),
            headers: ApiConfig.defaultHeaders(token))
        .timeout(_timeout);
    if (r.statusCode == 200) return jsonDecode(r.body);
    throw Exception(_err(r, 'Failed to load tool allow-list'));
  }
}
