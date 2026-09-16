import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ercp_app/screens/shelter_locator_screen.dart';

void main() {
  testWidgets('ShelterLocatorScreen renders title and search bar', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: ShelterLocatorScreen(),
      ),
    );

    // Verify Title text exists
    expect(find.text('Evacuation Shelters & Geolocation'), findsOneWidget);
    expect(find.text('3rd-Party Maps & Nearest Shelter Finder'), findsOneWidget);
    expect(find.byType(TextField), findsOneWidget);
    expect(find.byType(ElevatedButton), findsOneWidget);
  });
}
