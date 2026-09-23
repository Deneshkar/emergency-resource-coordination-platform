import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ercp_app/providers/auth_provider.dart';
import 'package:ercp_app/screens/login_screen.dart';

/// Widget tests for LoginScreen — form validation, UI elements, quick-fill chips.
Future<void> _pumpLogin(WidgetTester tester) async {
  SharedPreferences.setMockInitialValues({});
  final auth = AuthProvider();
  await auth.init();
  await tester.pumpWidget(
    ChangeNotifierProvider.value(
      value: auth,
      child: const MaterialApp(home: LoginScreen()),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  // ─── UI Elements ────────────────────────────────────────────────────
  testWidgets('renders brand header, fields, and sign-in button', (tester) async {
    await _pumpLogin(tester);

    // Brand
    expect(find.text('ERCP Operations'), findsOneWidget);
    expect(find.text('Emergency Resource Coordination Platform'), findsOneWidget);

    // Form fields
    expect(find.text('Email Address'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);

    // Submit button
    expect(find.text('Sign In to Operations'), findsOneWidget);
  });

  testWidgets('renders quick demo sign-in chips', (tester) async {
    await _pumpLogin(tester);

    expect(find.text('Quick Demo Sign-In'), findsOneWidget);
    expect(find.text('Volunteer'), findsOneWidget);
    expect(find.text('Citizen'), findsOneWidget);
    expect(find.text('Coordinator'), findsOneWidget);
    expect(find.text('Admin'), findsOneWidget);
  });

  testWidgets('renders Register New Account link', (tester) async {
    await _pumpLogin(tester);

    expect(find.text('Need an account? '), findsOneWidget);
    expect(find.text('Register New Account'), findsOneWidget);
  });

  // ─── Validation ─────────────────────────────────────────────────────
  testWidgets('empty submit shows email and password validation errors', (tester) async {
    await _pumpLogin(tester);

    await tester.tap(find.text('Sign In to Operations'));
    await tester.pumpAndSettle();

    expect(find.text('Email is required'), findsOneWidget);
    expect(find.text('Password is required'), findsOneWidget);
  });

  testWidgets('invalid email shows email validation error', (tester) async {
    await _pumpLogin(tester);

    await tester.enterText(find.byType(TextFormField).first, 'not-an-email');
    await tester.enterText(find.byType(TextFormField).last, 'password123');
    await tester.tap(find.text('Sign In to Operations'));
    await tester.pumpAndSettle();

    expect(find.text('Enter a valid email address'), findsOneWidget);
  });

  testWidgets('short password shows minimum length error', (tester) async {
    await _pumpLogin(tester);

    await tester.enterText(find.byType(TextFormField).first, 'user@ercp.org');
    await tester.enterText(find.byType(TextFormField).last, '123');
    await tester.tap(find.text('Sign In to Operations'));
    await tester.pumpAndSettle();

    expect(find.text('Password must be at least 6 characters'), findsOneWidget);
  });

  // ─── Password Toggle ───────────────────────────────────────────────
  testWidgets('password visibility toggle button exists', (tester) async {
    await _pumpLogin(tester);

    // Find the visibility toggle icon button
    expect(find.byIcon(Icons.visibility_off), findsOneWidget);

    // Tap to reveal password
    await tester.tap(find.byIcon(Icons.visibility_off));
    await tester.pumpAndSettle();

    expect(find.byIcon(Icons.visibility), findsOneWidget);
  });
}
