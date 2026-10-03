// import 'dart:io' show Platform;
// import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConfig {
  static String? _customBaseUrl;

  static void setBaseUrl(String url) {
    _customBaseUrl = url;
  }

  /// Override via `--dart-define=API_BASE_URL=...` for local dev
  /// (e.g. http://10.0.2.2:5009/api on Android emulator).
  static const String _envBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  );

  static String get baseUrl {
    if (_customBaseUrl != null && _customBaseUrl!.isNotEmpty) {
      return _customBaseUrl!;
    }
    if (_envBaseUrl.isNotEmpty) return _envBaseUrl;

    return 'https://programs-agenda-contracting-seven.trycloudflare.com/api';

    /*
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
    */
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
