import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/resource.dart';
import '../models/shelter.dart';
import '../models/inventory_item.dart';
import '../models/situation_assessment.dart';

class ResourceService {
  static const String baseUrl = 'http://10.0.2.2:5009/api'; // Android Emulator default

  static Future<List<ShelterModel>> fetchShelters() async {
    final response = await http.get(Uri.parse('$baseUrl/Shelters'));
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => ShelterModel.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load shelters');
    }
  }

  static Future<List<ResourceModel>> fetchResources() async {
    final response = await http.get(Uri.parse('$baseUrl/Resources'));
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => ResourceModel.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load resources');
    }
  }

  static Future<List<InventoryItemModel>> fetchInventory() async {
    final response = await http.get(Uri.parse('$baseUrl/Inventory'));
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => InventoryItemModel.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load inventory');
    }
  }

  static Future<SituationAssessmentModel> assessSituation(int incidentId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/SituationAnalysis/assess'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'incidentId': incidentId}),
    );
    if (response.statusCode == 200) {
      return SituationAssessmentModel.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to run Situation Analysis Agent');
    }
  }
}
