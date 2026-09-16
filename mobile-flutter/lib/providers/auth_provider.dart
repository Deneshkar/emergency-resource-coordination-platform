import 'package:flutter/material.dart';
import '../models/auth_user.dart';
import '../services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  AuthUser? _user;
  String? _token;
  bool _isLoading = true;
  String? _errorMessage;

  AuthUser? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null && _token != null;
  String? get errorMessage => _errorMessage;

  /// Initializes authentication state from local device storage on app launch.
  Future<void> init() async {
    _isLoading = true;
    notifyListeners();

    try {
      _token = await AuthService.getToken();
      if (_token != null && _token!.isNotEmpty) {
        _user = await AuthService.fetchCurrentUser();
      }
    } catch (_) {
      _user = await AuthService.getStoredUser();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Attempts to sign in with provided email and password.
  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final user = await AuthService.login(email, password);
      _user = user;
      _token = await AuthService.getToken();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Attempts to register a new account and immediately logs in.
  Future<bool> register({
    required String fullName,
    required String email,
    required String password,
    required String role,
    String? phoneNumber,
    String? skills,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final user = await AuthService.register(
        fullName: fullName,
        email: email,
        password: password,
        role: role,
        phoneNumber: phoneNumber,
        skills: skills,
      );
      _user = user;
      _token = await AuthService.getToken();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Refreshes the currently authenticated user's profile data.
  Future<void> refreshProfile() async {
    try {
      final updated = await AuthService.fetchCurrentUser();
      if (updated != null) {
        _user = updated;
        notifyListeners();
      }
    } catch (_) {}
  }

  /// Signs out of the application and clears stored session credentials.
  Future<void> logout() async {
    await AuthService.logout();
    _user = null;
    _token = null;
    _errorMessage = null;
    notifyListeners();
  }
}
