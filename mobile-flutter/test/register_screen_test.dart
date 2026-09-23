import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ercp_app/providers/auth_provider.dart';
import 'package:ercp_app/screens/register_screen.dart';

/// Student 4 — RegisterScreen widget tests (no backend: validation happens pre-submit).
Future<void> _pumpRegister(WidgetTester tester) async {
  SharedPreferences.setMockInitialValues({});
  // Initialise provider so isLoading=false (otherwise the submit button shows
  // an infinite CircularProgressIndicator and pumpAndSettle never settles).
  final auth = AuthProvider();
  await auth.init();
  await tester.pumpWidget(
    ChangeNotifierProvider<AuthProvider>.value(
      value: auth,
      child: const MaterialApp(home: RegisterScreen()),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('renders all registration fields and role selector', (tester) async {
    await _pumpRegister(tester);

    expect(find.text('Create New Platform Account'), findsOneWidget);
    expect(find.text('Full Name *'), findsOneWidget);
    expect(find.text('Email Address *'), findsOneWidget);
    expect(find.text('Password *'), findsOneWidget);
    expect(find.textContaining('Register as'), findsOneWidget);
  });

  testWidgets('empty submit shows validation errors, does not call backend', (tester) async {
    await _pumpRegister(tester);

    await tester.ensureVisible(find.textContaining('Register as'));
    await tester.pumpAndSettle();
    await tester.tap(find.textContaining('Register as'));
    await tester.pumpAndSettle();

    // Form validators must fire for the three required fields.
    expect(find.text('Full name is required'), findsOneWidget);
    expect(find.text('Email is required'), findsOneWidget);
    expect(find.text('Password is required'), findsOneWidget);
  });

  testWidgets('invalid email shows email validation error', (tester) async {
    await _pumpRegister(tester);

    await tester.enterText(find.byType(TextFormField).at(0), 'Test User');
    await tester.enterText(find.byType(TextFormField).at(1), 'not-an-email');
    await tester.enterText(find.byType(TextFormField).at(2), 'secret123');
    await tester.enterText(find.byType(TextFormField).at(4), 'medical');

    await tester.ensureVisible(find.textContaining('Register as'));
    await tester.pumpAndSettle();
    await tester.tap(find.textContaining('Register as'));
    await tester.pumpAndSettle();

    expect(find.text('Enter a valid email address'), findsOneWidget);
  });

  testWidgets('switching role to Citizen changes skills label', (tester) async {
    await _pumpRegister(tester);

    // Open the role dropdown and pick Citizen.
    await tester.tap(find.byType(DropdownButtonFormField<String>));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Citizen (Public Reporter)').last);
    await tester.pumpAndSettle();

    expect(find.text('Skills / Neighborhood'), findsOneWidget);
  });
}
