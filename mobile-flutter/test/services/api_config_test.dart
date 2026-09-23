import 'package:flutter_test/flutter_test.dart';
import 'package:ercp_app/services/api_config.dart';

/// Unit tests for ApiConfig — base URL logic and header generation.
void main() {
  group('ApiConfig', () {
    tearDown(() {
      // Reset custom URL after each test
      ApiConfig.setBaseUrl('');
    });

    test('setBaseUrl overrides default baseUrl', () {
      ApiConfig.setBaseUrl('https://api.ercp-prod.railway.app/api');

      expect(ApiConfig.baseUrl, 'https://api.ercp-prod.railway.app/api');
    });

    test('setBaseUrl with empty string falls back to default', () {
      ApiConfig.setBaseUrl('');

      // Should return a default URL (varies by platform but not the custom one)
      expect(ApiConfig.baseUrl, isNotEmpty);
      expect(ApiConfig.baseUrl, contains('/api'));
    });

    // ─── Header generation ──────────────────────────────────────────────
    test('defaultHeaders without token includes Content-Type and Accept', () {
      final headers = ApiConfig.defaultHeaders();

      expect(headers['Content-Type'], 'application/json');
      expect(headers['Accept'], 'application/json');
      expect(headers.containsKey('Authorization'), isFalse);
    });

    test('defaultHeaders with null token does not include Authorization', () {
      final headers = ApiConfig.defaultHeaders(null);

      expect(headers.containsKey('Authorization'), isFalse);
    });

    test('defaultHeaders with empty token does not include Authorization', () {
      final headers = ApiConfig.defaultHeaders('');

      expect(headers.containsKey('Authorization'), isFalse);
    });

    test('defaultHeaders with valid token includes Bearer Authorization', () {
      final headers = ApiConfig.defaultHeaders('jwt-test-token-123');

      expect(headers['Authorization'], 'Bearer jwt-test-token-123');
      expect(headers['Content-Type'], 'application/json');
      expect(headers['Accept'], 'application/json');
    });

    test('defaultHeaders returns new map instance each call', () {
      final h1 = ApiConfig.defaultHeaders('token1');
      final h2 = ApiConfig.defaultHeaders('token2');

      expect(identical(h1, h2), isFalse);
      expect(h1['Authorization'], 'Bearer token1');
      expect(h2['Authorization'], 'Bearer token2');
    });
  });
}
