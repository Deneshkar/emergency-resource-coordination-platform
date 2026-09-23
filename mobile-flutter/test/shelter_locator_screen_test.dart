import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:ercp_app/providers/auth_provider.dart';
import 'package:ercp_app/screens/shelter_locator_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('ShelterLocatorScreen renders title and search bar', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    final auth = AuthProvider();

    await tester.pumpWidget(
      ChangeNotifierProvider.value(
        value: auth,
        child: const MaterialApp(
          home: ShelterLocatorScreen(),
        ),
      ),
    );

    // Verify Title text exists
    expect(find.text('Evacuation Shelters & Geolocation'), findsOneWidget);
    expect(find.text('3rd-Party Maps & Nearest Shelter Finder'), findsOneWidget);
    expect(find.byType(TextField), findsOneWidget);
    expect(find.byType(ElevatedButton), findsOneWidget);
  });
}
