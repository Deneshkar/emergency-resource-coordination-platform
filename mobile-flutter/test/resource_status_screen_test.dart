import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:ercp_app/providers/auth_provider.dart';
import 'package:ercp_app/screens/resource_status_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('ResourceStatusScreen renders app bar and loading state', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    final auth = AuthProvider();
    
    await tester.pumpWidget(
      ChangeNotifierProvider.value(
        value: auth,
        child: const MaterialApp(
          home: ResourceStatusScreen(),
        ),
      ),
    );

    // Verify Title text exists
    expect(find.text('Resource Fleet Status'), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
