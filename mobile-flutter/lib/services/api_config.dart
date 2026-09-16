import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConfig {
  static String? _customBaseUrl;

  static void setBaseUrl(String url) {
    _customBaseUrl = url;
  }

  static String get baseUrl {
    if (_customBaseUrl != null && _customBaseUrl!.isNotEmpty) {
      return _customBaseUrl!;
    }

    if (kIsWeb) {
      return 'http://localhost:5009/api';
    }

    try {
      if (Platform.isAndroid) {
        // Standard loopback IP for Android Emulator
        return 'http://10.0.2.2:5009/api';
      }
    } catch (_) {
      // Fallback if platform check fails
    }

    return 'http://localhost:5009/api';
  }

  static Map<String, String> defaultHeaders([String? token]) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }
}
