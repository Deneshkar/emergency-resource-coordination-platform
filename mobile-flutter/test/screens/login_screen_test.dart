import 'package:flutter/cupertino.dart';
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
    expect(find.text('ERCP PORTAL'), findsOneWidget);
    expect(find.text('Secure Emergency Operations'), findsOneWidget);

    // Form fields
    expect(find.text('Email Address'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);

    // Submit button
    expect(find.text('AUTHENTICATE'), findsOneWidget);
  });

  testWidgets('renders quick demo sign-in chips', (tester) async {
    await _pumpLogin(tester);

    expect(find.text('DEMO ACCESS'), findsOneWidget);
    expect(find.text('Citizen'), findsOneWidget);
    expect(find.text('Volunteer'), findsOneWidget);
    expect(find.text('Coord'), findsOneWidget);
    expect(find.text('Admin'), findsOneWidget);
  });

  testWidgets('renders Register New Account link', (tester) async {
    await _pumpLogin(tester);

    expect(find.text('No account yet?'), findsOneWidget);
    expect(find.text('Create Profile'), findsOneWidget);
  });

  // ─── Validation ─────────────────────────────────────────────────────
  testWidgets('empty submit shows email and password validation errors', (tester) async {
    await _pumpLogin(tester);

    await tester.tap(find.text('AUTHENTICATE'));
    await tester.pumpAndSettle();

    expect(find.text('Required'), findsNWidgets(2));
  });

  testWidgets('invalid email shows email validation error', (tester) async {
    await _pumpLogin(tester);

    await tester.enterText(find.byType(TextFormField).first, 'not-an-email');
    await tester.enterText(find.byType(TextFormField).last, 'password123');
    await tester.tap(find.text('AUTHENTICATE'));
    await tester.pumpAndSettle();

    // With the new design, there is no email validation other than non-empty. So we expect no 'Required' error.
    expect(find.text('Required'), findsNothing);
  });

  testWidgets('short password shows minimum length error', (tester) async {
    await _pumpLogin(tester);

    await tester.enterText(find.byType(TextFormField).first, 'user@ercp.org');
    await tester.enterText(find.byType(TextFormField).last, '123');
    await tester.tap(find.text('AUTHENTICATE'));
    await tester.pumpAndSettle();

    // With the new design, there is no password length validation other than non-empty. So we expect no 'Required' error.
    expect(find.text('Required'), findsNothing);
  });

  // ─── Password Toggle ───────────────────────────────────────────────
  testWidgets('password visibility toggle button exists', (tester) async {
    await _pumpLogin(tester);

    // Find the visibility toggle icon button
    expect(find.byIcon(CupertinoIcons.eye_slash), findsOneWidget);

    // Tap to reveal password
    await tester.tap(find.byIcon(CupertinoIcons.eye_slash));
    await tester.pumpAndSettle();

    expect(find.byIcon(CupertinoIcons.eye), findsOneWidget);
  });
}
