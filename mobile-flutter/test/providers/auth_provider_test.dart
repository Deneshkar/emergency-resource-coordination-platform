import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ercp_app/providers/auth_provider.dart';

/// Unit tests for AuthProvider — state management, init, login, logout flows.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('AuthProvider', () {
    setUp(() {
      SharedPreferences.setMockInitialValues({});
    });

    test('initial state has null user and token', () {
      final auth = AuthProvider();

      expect(auth.user, isNull);
      expect(auth.token, isNull);
      expect(auth.isAuthenticated, isFalse);
      expect(auth.errorMessage, isNull);
    });

    test('isAuthenticated is false when user is null', () {
      final auth = AuthProvider();

      expect(auth.isAuthenticated, isFalse);
    });

    test('init with empty storage sets isLoading to false', () async {
      SharedPreferences.setMockInitialValues({});
      final auth = AuthProvider();

      await auth.init();

      expect(auth.isLoading, isFalse);
      expect(auth.user, isNull);
      expect(auth.token, isNull);
      expect(auth.isAuthenticated, isFalse);
    });

    test('init with no saved token remains unauthenticated', () async {
      SharedPreferences.setMockInitialValues({});
      final auth = AuthProvider();

      await auth.init();

      expect(auth.isAuthenticated, isFalse);
      expect(auth.isLoading, isFalse);
    });

    test('logout clears user, token, and error', () async {
      SharedPreferences.setMockInitialValues({
        'auth_token': 'test-jwt-token',
        'auth_user': '{"id":1,"fullName":"Test User","email":"test@ercp.org","role":"Volunteer"}',
      });
      final auth = AuthProvider();
      await auth.init();

      await auth.logout();

      expect(auth.user, isNull);
      expect(auth.token, isNull);
      expect(auth.errorMessage, isNull);
      expect(auth.isAuthenticated, isFalse);
    });

    test('logout clears SharedPreferences token and user', () async {
      SharedPreferences.setMockInitialValues({
        'auth_token': 'test-jwt-token',
        'auth_user': '{"id":1,"fullName":"Test","email":"t@ercp.org","role":"Citizen"}',
      });
      final auth = AuthProvider();
      await auth.init();

      await auth.logout();

      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getString('auth_token'), isNull);
      expect(prefs.getString('auth_user'), isNull);
    });

    test('login with invalid credentials sets errorMessage', () async {
      SharedPreferences.setMockInitialValues({});
      final auth = AuthProvider();
      await auth.init();

      // This will fail because no backend is running, which tests error handling
      final result = await auth.login('invalid@test.org', 'wrongpassword');

      expect(result, isFalse);
      expect(auth.errorMessage, isNotNull);
      expect(auth.isLoading, isFalse);
      expect(auth.isAuthenticated, isFalse);
    });

    test('register with missing backend sets errorMessage', () async {
      SharedPreferences.setMockInitialValues({});
      final auth = AuthProvider();
      await auth.init();

      final result = await auth.register(
        fullName: 'Test',
        email: 'test@ercp.org',
        password: 'test123',
        role: 'Citizen',
      );

      expect(result, isFalse);
      expect(auth.errorMessage, isNotNull);
      expect(auth.isLoading, isFalse);
    });

    test('multiple logout calls are idempotent', () async {
      SharedPreferences.setMockInitialValues({});
      final auth = AuthProvider();
      await auth.init();

      await auth.logout();
      await auth.logout();
      await auth.logout();

      expect(auth.user, isNull);
      expect(auth.token, isNull);
      expect(auth.isAuthenticated, isFalse);
    });

    test('notifyListeners is called during login (loading transitions)', () async {
      SharedPreferences.setMockInitialValues({});
      final auth = AuthProvider();
      await auth.init();

      int notifyCount = 0;
      auth.addListener(() => notifyCount++);

      await auth.login('test@ercp.org', 'password123');

      // At minimum, loading=true and loading=false transitions
      expect(notifyCount, greaterThanOrEqualTo(2));
    });
  });
}
