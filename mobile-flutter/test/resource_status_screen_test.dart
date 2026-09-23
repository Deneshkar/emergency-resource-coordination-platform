import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ercp_app/screens/resource_status_screen.dart';

void main() {
  testWidgets('ResourceStatusScreen renders app bar and loading state', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: ResourceStatusScreen(),
      ),
    );

    // Verify Title text exists
    expect(find.text('Resource Fleet Status'), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
