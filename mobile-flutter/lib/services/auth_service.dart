import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/auth_user.dart';
import 'api_config.dart';

class AuthService {
  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'auth_user';

  /// Authenticates user with credentials and persists the JWT session.
  static Future<AuthUser> login(String email, String password) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/auth/login');
    final response = await http.post(
      url,
      headers: ApiConfig.defaultHeaders(),
      body: jsonEncode({
        'email': email.trim(),
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      final Map<String, dynamic> data = jsonDecode(response.body);
      final token = data['token'] as String;
      final userJson = data['user'] as Map<String, dynamic>;
      final user = AuthUser.fromJson(userJson);

      await _saveSession(token, user);
      return user;
    } else {
      String errorMessage = 'Login failed. Please check your credentials.';
      try {
        final errorData = jsonDecode(response.body);
        if (errorData is Map && errorData['message'] != null) {
          errorMessage = errorData['message'];
        }
      } catch (_) {}
      throw Exception(errorMessage);
    }
  }

  /// Registers a new user account (Citizen or Volunteer) and starts a session.
  static Future<AuthUser> register({
    required String fullName,
    required String email,
    required String password,
    required String role,
    String? phoneNumber,
    String? skills,
  }) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/auth/register');
    final response = await http.post(
      url,
      headers: ApiConfig.defaultHeaders(),
      body: jsonEncode({
        'fullName': fullName.trim(),
        'email': email.trim(),
        'password': password,
        'role': role.trim(),
        'phoneNumber': phoneNumber?.trim().isEmpty == true ? null : phoneNumber?.trim(),
        'skills': skills?.trim().isEmpty == true ? null : skills?.trim(),
      }),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      final Map<String, dynamic> data = jsonDecode(response.body);
      final token = data['token'] as String;
      final userJson = data['user'] as Map<String, dynamic>;
      final user = AuthUser.fromJson(userJson);

      await _saveSession(token, user);
      return user;
    } else {
      String errorMessage = 'Registration failed. Please check your inputs.';
      try {
        final errorData = jsonDecode(response.body);
        if (errorData is Map && errorData['message'] != null) {
          errorMessage = errorData['message'];
        }
      } catch (_) {}
      throw Exception(errorMessage);
    }
  }

  /// Fetches the profile of the currently authenticated user from the backend.
  static Future<AuthUser?> fetchCurrentUser() async {
    final token = await getToken();
    if (token == null) return null;

    final url = Uri.parse('${ApiConfig.baseUrl}/auth/me');
    final response = await http.get(
      url,
      headers: ApiConfig.defaultHeaders(token),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final user = AuthUser.fromJson(data);
      await _saveUserOnly(user);
      return user;
    } else if (response.statusCode == 401) {
      await logout();
      return null;
    }
    return getStoredUser();
  }

  /// Retrieves the active JWT token from storage.
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  /// Retrieves the cached user profile from storage.
  static Future<AuthUser?> getStoredUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userString = prefs.getString(_userKey);
    if (userString == null) return null;
    try {
      final json = jsonDecode(userString) as Map<String, dynamic>;
      return AuthUser.fromJson(json);
    } catch (_) {
      return null;
    }
  }

  /// Terminates the current session and clears persistent storage.
  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }

  static Future<void> _saveSession(String token, AuthUser user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_userKey, jsonEncode(user.toJson()));
  }

  static Future<void> _saveUserOnly(AuthUser user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, jsonEncode(user.toJson()));
  }

  static Future<void> resetPassword(String email) async {
    // Simulate API call for reset password
    await Future.delayed(const Duration(seconds: 1));
    // In a real app, this would hit ${ApiConfig.baseUrl}/auth/reset-password
  }
}
