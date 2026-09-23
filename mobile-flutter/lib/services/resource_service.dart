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

  static Future<void> createResource(Map<String, dynamic> data) async {
    final token = await AuthService.getToken();
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/Resources'),
      headers: ApiConfig.defaultHeaders(token),
      body: json.encode(data),
    );
    if (response.statusCode != 201 && response.statusCode != 200) {
      throw Exception('Failed to create resource');
    }
  }

  static Future<void> updateResource(int id, Map<String, dynamic> data) async {
    final token = await AuthService.getToken();
    final response = await http.put(
      Uri.parse('${ApiConfig.baseUrl}/Resources/$id'),
      headers: ApiConfig.defaultHeaders(token),
      body: json.encode(data),
    );
    if (response.statusCode != 204 && response.statusCode != 200) {
      throw Exception('Failed to update resource');
    }
  }

  static Future<void> deleteResource(int id) async {
    final token = await AuthService.getToken();
    final response = await http.delete(
      Uri.parse('${ApiConfig.baseUrl}/Resources/$id'),
      headers: ApiConfig.defaultHeaders(token),
    );
    if (response.statusCode != 204 && response.statusCode != 200) {
      throw Exception('Failed to delete resource');
    }
  }

  static Future<void> updateResourceStatus(int id, String status) async {
    final token = await AuthService.getToken();
    final response = await http.put(
      Uri.parse('${ApiConfig.baseUrl}/Resources/$id/status'),
      headers: ApiConfig.defaultHeaders(token),
      body: json.encode({'status': status}),
    );
    if (response.statusCode != 204 && response.statusCode != 200) {
      throw Exception('Failed to update resource status');
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

  // ==========================================
  // SHELTER CRUD
  // ==========================================
  
  static Future<void> createShelter(Map<String, dynamic> data) async {
    final token = await AuthService.getToken();
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/Shelters'),
      headers: ApiConfig.defaultHeaders(token),
      body: json.encode(data),
    );
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw Exception('Failed to create shelter');
    }
  }

  static Future<void> updateShelter(int id, Map<String, dynamic> data) async {
    final token = await AuthService.getToken();
    final response = await http.put(
      Uri.parse('${ApiConfig.baseUrl}/Shelters/$id'),
      headers: ApiConfig.defaultHeaders(token),
      body: json.encode(data),
    );
    if (response.statusCode != 200 && response.statusCode != 204) {
      throw Exception('Failed to update shelter');
    }
  }

  static Future<void> deleteShelter(int id) async {
    final token = await AuthService.getToken();
    final response = await http.delete(
      Uri.parse('${ApiConfig.baseUrl}/Shelters/$id'),
      headers: ApiConfig.defaultHeaders(token),
    );
    if (response.statusCode != 200 && response.statusCode != 204) {
      throw Exception('Failed to delete shelter');
    }
  }

  static Future<void> updateShelterOccupancy(int id, int occupancy) async {
    final token = await AuthService.getToken();
    final response = await http.put(
      Uri.parse('${ApiConfig.baseUrl}/Shelters/$id/occupancy'),
      headers: ApiConfig.defaultHeaders(token),
      body: json.encode({'currentOccupancy': occupancy}),
    );
    if (response.statusCode != 200 && response.statusCode != 204) {
      throw Exception('Failed to update shelter occupancy');
    }
  }

  // ==========================================
  // INVENTORY CRUD
  // ==========================================

  static Future<void> createInventoryItem(Map<String, dynamic> data) async {
    final token = await AuthService.getToken();
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/Inventory'),
      headers: ApiConfig.defaultHeaders(token),
      body: json.encode(data),
    );
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw Exception('Failed to create inventory item');
    }
  }

  static Future<void> updateInventoryItem(int id, Map<String, dynamic> data) async {
    final token = await AuthService.getToken();
    final response = await http.put(
      Uri.parse('${ApiConfig.baseUrl}/Inventory/$id'),
      headers: ApiConfig.defaultHeaders(token),
      body: json.encode(data),
    );
    if (response.statusCode != 200 && response.statusCode != 204) {
      throw Exception('Failed to update inventory item');
    }
  }

  static Future<void> deleteInventoryItem(int id) async {
    final token = await AuthService.getToken();
    final response = await http.delete(
      Uri.parse('${ApiConfig.baseUrl}/Inventory/$id'),
      headers: ApiConfig.defaultHeaders(token),
    );
    if (response.statusCode != 200 && response.statusCode != 204) {
      throw Exception('Failed to delete inventory item');
    }
  }

  static Future<void> adjustStock(int id, int delta) async {
    final token = await AuthService.getToken();
    final response = await http.put(
      Uri.parse('${ApiConfig.baseUrl}/Inventory/$id/adjust-stock'),
      headers: ApiConfig.defaultHeaders(token),
      body: json.encode({'quantityAdjustment': delta}),
    );
    if (response.statusCode != 200 && response.statusCode != 204) {
      throw Exception('Failed to adjust stock');
    }
  }
}
