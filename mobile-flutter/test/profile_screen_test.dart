import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ercp_app/models/volunteer.dart';
import 'package:ercp_app/providers/auth_provider.dart';
import 'package:ercp_app/screens/profile_screen.dart';

/// Student 4 — ProfileScreen (duty controls) widget tests.
/// Passes a Volunteer directly so no network call is made.
Volunteer _onDuty() => Volunteer(
      id: 'vol-001',
      name: 'Marcus Vance',
      email: 'volunteer@ercp.org',
      phone: '+1-555-0144',
      skills: 'Search & Rescue, Medical EMT',
      isAvailable: true,
      rating: 4.9,
    );

Volunteer _offDuty() => Volunteer(
      id: 'vol-002',
      name: 'Off Duty Responder',
      email: 'off@test.local',
      phone: '000',
      skills: 'driving',
      isAvailable: false,
      rating: 4.0,
    );

Future<void> _pumpProfile(WidgetTester tester, Volunteer v) async {
  SharedPreferences.setMockInitialValues({});
  await tester.pumpWidget(
    ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: MaterialApp(home: ProfileScreen(volunteer: v)),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('on-duty volunteer shows Available status + shifts button', (tester) async {
    await _pumpProfile(tester, _onDuty());

    expect(find.text('Marcus Vance'), findsWidgets);
    expect(find.textContaining('Status: Available'), findsOneWidget);
    expect(find.text('View Assigned Shifts'), findsOneWidget);
    expect(find.byType(Switch), findsOneWidget);
    expect(find.text('4.9 / 5.0'), findsOneWidget);
  });

  testWidgets('off-duty volunteer shows Off-Duty status', (tester) async {
    await _pumpProfile(tester, _offDuty());

    expect(find.textContaining('Status: Off-Duty'), findsOneWidget);
    expect(find.text('View Assigned Shifts'), findsOneWidget);
  });

  testWidgets('sign out button is always present', (tester) async {
    await _pumpProfile(tester, _onDuty());

    expect(find.text('Sign Out of Session'), findsOneWidget);
  });
}
