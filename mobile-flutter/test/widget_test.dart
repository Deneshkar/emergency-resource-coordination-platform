import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ercp_app/main.dart';
import 'package:ercp_app/providers/auth_provider.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('App smoke test renders login or initialization', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AuthProvider()..init(),
        child: const ERCPApp(),
      ),
    );

    await tester.pumpAndSettle();

    // Verify Login Screen appears for unauthenticated user
    expect(find.text('Sign In to Operations'), findsOneWidget);
    expect(find.text('ERCP Operations'), findsOneWidget);
  });
}
