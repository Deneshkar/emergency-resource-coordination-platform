import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsProvider with ChangeNotifier {
  String _themeMode = 'dark';
  bool _notificationsEnabled = true;
  String _language = 'en';

  String get themeMode => _themeMode;
  bool get notificationsEnabled => _notificationsEnabled;
  String get language => _language;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _themeMode = prefs.getString('ercp_theme') ?? 'dark';
    _notificationsEnabled = prefs.getBool('ercp_notifications') ?? true;
    _language = prefs.getString('ercp_language') ?? 'en';
    notifyListeners();
  }

  Future<void> setThemeMode(String mode) async {
    _themeMode = mode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('ercp_theme', mode);
    notifyListeners();
  }

  Future<void> setLanguage(String lang) async {
    _language = lang;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('ercp_language', lang);
    notifyListeners();
  }

  Future<void> setNotificationsEnabled(bool enabled) async {
    _notificationsEnabled = enabled;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('ercp_notifications', enabled);
    notifyListeners();
  }

  ThemeData getThemeData() {
    switch (_themeMode) {
      case 'light':
        return ThemeData(
          brightness: Brightness.light,
          primarySwatch: Colors.blue,
          useMaterial3: true,
        );
      case 'midnight':
        return ThemeData(
          brightness: Brightness.dark,
          primarySwatch: Colors.indigo,
          scaffoldBackgroundColor: const Color(0xFF0F172A),
          useMaterial3: true,
        );
      case 'hacker':
        return ThemeData(
          brightness: Brightness.dark,
          primarySwatch: Colors.green,
          scaffoldBackgroundColor: Colors.black,
          useMaterial3: true,
        );
      case 'sunset':
        return ThemeData(
          brightness: Brightness.dark,
          primarySwatch: Colors.orange,
          scaffoldBackgroundColor: const Color(0xFF451A03),
          useMaterial3: true,
        );
      case 'ocean':
        return ThemeData(
          brightness: Brightness.dark,
          primarySwatch: Colors.cyan,
          scaffoldBackgroundColor: const Color(0xFF083344),
          useMaterial3: true,
        );
      case 'oled':
        return ThemeData(
          brightness: Brightness.dark,
          primarySwatch: Colors.grey,
          scaffoldBackgroundColor: Colors.black,
          useMaterial3: true,
        );
      case 'purple':
        return ThemeData(
          brightness: Brightness.dark,
          primarySwatch: Colors.purple,
          scaffoldBackgroundColor: const Color(0xFF2E1065),
          useMaterial3: true,
        );
      case 'dark':
      default:
        return ThemeData(
          brightness: Brightness.dark,
          primarySwatch: Colors.blue,
          useMaterial3: true,
        );
    }
  }
}
