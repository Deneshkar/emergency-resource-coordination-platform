import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/resource.dart';
import '../models/shelter.dart';
import '../models/inventory_item.dart';
import '../models/situation_assessment.dart';
import 'api_config.dart';
import 'auth_service.dart';

class ResourceService {
  static Future<List<ShelterModel>> fetchShelters() async {
    final token = await AuthService.getToken();
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}/Shelters'),
      headers: ApiConfig.defaultHeaders(token),
    );
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => ShelterModel.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load shelters');
    }
  }

  static Future<List<ResourceModel>> fetchResources() async {
    final token = await AuthService.getToken();
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}/Resources'),
      headers: ApiConfig.defaultHeaders(token),
    );
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => ResourceModel.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load resources');
    }
  }

  static Future<List<InventoryItemModel>> fetchInventory() async {
    final token = await AuthService.getToken();
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}/Inventory'),
      headers: ApiConfig.defaultHeaders(token),
    );
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => InventoryItemModel.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load inventory');
    }
  }

  static Future<SituationAssessmentModel> assessSituation(int incidentId) async {
    final token = await AuthService.getToken();
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/SituationAnalysis/assess'),
      headers: ApiConfig.defaultHeaders(token),
      body: json.encode({'incidentId': incidentId}),
    );
    if (response.statusCode == 200) {
      return SituationAssessmentModel.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to run Situation Analysis Agent');
    }
  }
}
