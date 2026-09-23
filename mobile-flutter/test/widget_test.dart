import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ercp_app/main.dart';
import 'package:ercp_app/providers/auth_provider.dart';
import 'package:ercp_app/providers/settings_provider.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('App smoke test renders login or initialization', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthProvider()..init()),
          ChangeNotifierProvider(create: (_) => SettingsProvider()..init()),
        ],
        child: const ERCPApp(),
      ),
    );

    await tester.pumpAndSettle();

    // Verify Login Screen appears for unauthenticated user
    expect(find.text('AUTHENTICATE'), findsOneWidget);
    expect(find.text('ERCP PORTAL'), findsOneWidget);
  });
}
