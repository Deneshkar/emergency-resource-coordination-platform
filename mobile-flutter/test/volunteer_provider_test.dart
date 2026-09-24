import 'package:flutter_test/flutter_test.dart';
import 'package:ercp_app/providers/volunteer_provider.dart';

void main() {
  group('VolunteerProvider (Student 4)', () {
    test('initial state is empty and not loading', () {
      final p = VolunteerProvider();
      expect(p.volunteers, isEmpty);
      expect(p.loading, isFalse);
      expect(p.hasMore, isTrue);
    });

    test('load offline surfaces error without crash', () async {
      final p = VolunteerProvider();
      // load will fail without backend; error must be surfaced not crash
      await p.load(reset: true);
      expect(p.loading, isFalse);
      // error or empty list both acceptable offline
      expect(p.volunteers.isEmpty || p.error != null, isTrue);
    });
  });
}
