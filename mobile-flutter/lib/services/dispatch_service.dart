import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/dispatch.dart';
import 'api_config.dart';
import 'auth_service.dart';

class DispatchService {
  static Future<List<Dispatch>> getDispatches() async {
    try {
      final token = await AuthService.getToken();
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/dispatches'),
        headers: ApiConfig.defaultHeaders(token),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => Dispatch.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load dispatches: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error connecting to Dispatch API: $e');
    }
  }

  static Future<void> updateDispatchStatus(int id, String status) async {
    try {
      final token = await AuthService.getToken();
      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/dispatches/$id/status'),
        headers: ApiConfig.defaultHeaders(token),
        body: json.encode({'status': status}),
      );

      if (response.statusCode != 200 && response.statusCode != 204) {
        throw Exception('Failed to update dispatch status');
      }
    } catch (e) {
      throw Exception('Error updating dispatch status: $e');
    }
  }

  static Future<void> createDispatch(Map<String, dynamic> data) async {
    try {
      final token = await AuthService.getToken();
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/dispatches'),
        headers: ApiConfig.defaultHeaders(token),
        body: json.encode(data),
      );

      if (response.statusCode != 201 && response.statusCode != 200) {
        throw Exception('Failed to create dispatch');
      }
    } catch (e) {
      throw Exception('Error creating dispatch: $e');
    }
  }
}
