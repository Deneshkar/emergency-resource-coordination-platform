import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ercp_app/providers/auth_provider.dart';
import 'package:ercp_app/screens/report_incident_screen.dart';

Future<void> _pumpReportScreen(WidgetTester tester) async {
  // Set larger screen surface to avoid small view scroll clipping
  tester.view.physicalSize = const Size(1080, 2400);
  tester.view.devicePixelRatio = 2.0;
  addTearDown(() {
    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
  });

  SharedPreferences.setMockInitialValues({});
  final auth = AuthProvider();
  await auth.init();

  await tester.pumpWidget(
    ChangeNotifierProvider<AuthProvider>.value(
      value: auth,
      child: const MaterialApp(home: ReportIncidentScreen()),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('renders all emergency report fields and action buttons', (tester) async {
    await _pumpReportScreen(tester);

    expect(find.text('Report Emergency'), findsOneWidget);
    expect(find.text('Emergency Title *'), findsOneWidget);
    expect(find.text('Category *'), findsOneWidget);
    expect(find.text('Priority Level *'), findsOneWidget);
    expect(find.text('Specific Location *'), findsOneWidget);
    expect(find.text('Estimated People Affected'), findsOneWidget);
    expect(find.text('Reporter Contact (Email or Phone)'), findsOneWidget);
    expect(find.textContaining('Detailed Description *'), findsOneWidget);
    expect(find.text('DISPATCH REPORT'), findsOneWidget);
  });

  testWidgets('quick fill preset buttons populate complete emergency data', (tester) async {
    await _pumpReportScreen(tester);

    // Tap Fire preset
    expect(find.text('Fire'), findsWidgets);
    await tester.tap(find.widgetWithText(ActionChip, 'Fire'));
    await tester.pumpAndSettle();

    expect(find.text('Commercial Building Fire'), findsOneWidget);
    expect(find.text('450 Industrial Parkway, Sector 4'), findsOneWidget);
    expect(find.text('8'), findsOneWidget);
    expect(find.textContaining('warehouse fire'), findsOneWidget);

    // Tap Flood preset
    await tester.tap(find.widgetWithText(ActionChip, 'Flood'));
    await tester.pumpAndSettle();

    expect(find.text('Severe Flash Flood'), findsOneWidget);
    expect(find.text('Riverdale Road Bridge, North Sector'), findsOneWidget);
    expect(find.text('15'), findsOneWidget);
    expect(find.textContaining('Water levels rising rapidly'), findsOneWidget);
  });

  testWidgets('empty submit shows comprehensive validation errors', (tester) async {
    await _pumpReportScreen(tester);

    await tester.ensureVisible(find.text('DISPATCH REPORT'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('DISPATCH REPORT'));
    await tester.pumpAndSettle();

    expect(find.text('Emergency title is required'), findsOneWidget);
    expect(find.text('Location is required'), findsOneWidget);
    expect(find.text('Description is required'), findsOneWidget);
  });

  testWidgets('short title or single word title triggers descriptive validation', (tester) async {
    await _pumpReportScreen(tester);

    // Enter single word title in field 0
    await tester.enterText(find.byType(TextFormField).at(0), 'Firestorm');
    await tester.ensureVisible(find.text('DISPATCH REPORT'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('DISPATCH REPORT'));
    await tester.pumpAndSettle();

    expect(find.text('Please provide at least two words (e.g. Building Fire)'), findsOneWidget);
  });

  testWidgets('short description triggers minimum length validation error', (tester) async {
    await _pumpReportScreen(tester);

    await tester.enterText(find.byType(TextFormField).at(0), 'Building Fire');
    await tester.enterText(find.byType(TextFormField).at(1), '123 Main Street');
    // Field 4 is description
    await tester.enterText(find.byType(TextFormField).at(4), 'Short fire text');

    await tester.ensureVisible(find.text('DISPATCH REPORT'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('DISPATCH REPORT'));
    await tester.pumpAndSettle();

    expect(find.textContaining('Please add more detail'), findsOneWidget);
  });
}
