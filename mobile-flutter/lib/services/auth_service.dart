import 'dart:async';
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/auth_user.dart';
import 'api_config.dart';

class AuthService {
  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'auth_user';
  static const String _expiryKey = 'auth_expires_at';
  static const _secure = FlutterSecureStorage();
  static const Duration _timeout = Duration(seconds: 15);

  /// Authenticates user with credentials and persists the JWT session.
  /// Token goes to secure storage; non-secret profile stays in prefs.
  static Future<AuthUser> login(String email, String password) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/auth/login');
    final response = await http
        .post(
          url,
          headers: ApiConfig.defaultHeaders(),
          body: jsonEncode({
            'email': email.trim(),
            'password': password,
          }),
        )
        .timeout(_timeout);

    if (response.statusCode == 200) {
      final Map<String, dynamic> data = jsonDecode(response.body);
      final token = data['token'] as String;
      final userJson = data['user'] as Map<String, dynamic>;
      final user = AuthUser.fromJson(userJson);
      final expiresAt = data['expiresAt']?.toString();

      await _saveSession(token, user, expiresAt: expiresAt);
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
    final response = await http
        .post(
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
        )
        .timeout(_timeout);

    if (response.statusCode == 200 || response.statusCode == 201) {
      final Map<String, dynamic> data = jsonDecode(response.body);
      final token = data['token'] as String;
      final userJson = data['user'] as Map<String, dynamic>;
      final user = AuthUser.fromJson(userJson);
      final expiresAt = data['expiresAt']?.toString();

      await _saveSession(token, user, expiresAt: expiresAt);
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
    if (await isTokenExpired()) {
      await logout();
      return null;
    }
    final token = await getToken();
    if (token == null) return null;

    final url = Uri.parse('${ApiConfig.baseUrl}/auth/me');
    final response = await http
        .get(
          url,
          headers: ApiConfig.defaultHeaders(token),
        )
        .timeout(_timeout);

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

  /// Retrieves the active JWT token from secure storage
  /// (falls back to prefs when secure storage is unavailable,
  /// e.g. Windows dev builds, and migrates legacy copies).
  static Future<String?> getToken() async {
    try {
      final secure = await _secure.read(key: _tokenKey);
      if (secure != null && secure.isNotEmpty) return secure;
    } catch (_) {
      // Secure storage unavailable (e.g. desktop plugin missing) — use prefs.
    }
    final prefs = await SharedPreferences.getInstance();
    final legacy = prefs.getString(_tokenKey);
    if (legacy != null && legacy.isNotEmpty) {
      try {
        await _secure.write(key: _tokenKey, value: legacy);
        await prefs.remove(_tokenKey);
      } catch (_) {}
      return legacy;
    }
    return null;
  }

  static Future<bool> isTokenExpired() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_expiryKey);
    if (raw == null || raw.isEmpty) return false;
    try {
      return DateTime.now().toUtc().isAfter(DateTime.parse(raw).toUtc());
    } catch (_) {
      return false;
    }
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
  /// Never throws: secure-storage failures still clear prefs so the
  /// user is always signed out locally.
  static Future<void> logout() async {
    try {
      await _secure.delete(key: _tokenKey);
    } catch (_) {}
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey); // legacy cleanup
    await prefs.remove(_userKey);
    await prefs.remove(_expiryKey);
  }

  static Future<void> _saveSession(String token, AuthUser user, {String? expiresAt}) async {
    bool savedSecure = false;
    try {
      await _secure.write(key: _tokenKey, value: token);
      savedSecure = true;
    } catch (_) {
      savedSecure = false;
    }
    final prefs = await SharedPreferences.getInstance();
    if (savedSecure) {
      await prefs.remove(_tokenKey); // drop legacy copy
    } else {
      // Fallback so session survives restart where secure storage is missing.
      await prefs.setString(_tokenKey, token);
    }
    await prefs.setString(_userKey, jsonEncode(user.toJson()));
    if (expiresAt != null && expiresAt.isNotEmpty) {
      await prefs.setString(_expiryKey, expiresAt);
    } else {
      await prefs.remove(_expiryKey);
    }
  }

  static Future<void> _saveUserOnly(AuthUser user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, jsonEncode(user.toJson()));
  }

  static Future<void> forgotPassword(String email) async {
    final r = await http
        .post(
          Uri.parse('${ApiConfig.baseUrl}/auth/forgot-password'),
          headers: ApiConfig.defaultHeaders(),
          body: jsonEncode({'email': email.trim()}),
        )
        .timeout(_timeout);
    if (r.statusCode != 200) {
      String msg = 'Failed to request reset code';
      try {
        final e = jsonDecode(r.body);
        if (e is Map && e['message'] != null) msg = e['message'].toString();
      } catch (_) {}
      throw Exception(msg);
    }
  }

  static Future<void> resetPassword(String email) async {
    // Kept for legacy callers: request an OTP reset code.
    return forgotPassword(email);
  }

  static Future<void> resetPasswordWithOtp({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    final r = await http
        .post(
          Uri.parse('${ApiConfig.baseUrl}/auth/reset-password'),
          headers: ApiConfig.defaultHeaders(),
          body: jsonEncode({'email': email.trim(), 'otp': otp.trim(), 'newPassword': newPassword}),
        )
        .timeout(_timeout);
    if (r.statusCode != 200) {
      String msg = 'Password reset failed';
      try {
        final e = jsonDecode(r.body);
        if (e is Map && e['message'] != null) msg = e['message'].toString();
      } catch (_) {}
      throw Exception(msg);
    }
  }
}
