import 'package:flutter_test/flutter_test.dart';
import 'package:ercp_app/models/situation_assessment.dart';

/// Unit tests for SituationAssessmentModel — mirrors backend SituationAnalysisAgentTests.
void main() {
  group('SituationAssessmentModel', () {
    test('fromJson parses full assessment response', () {
      final a = SituationAssessmentModel.fromJson({
        'id': 1,
        'incidentId': 10,
        'incidentTitle': 'Major River Flood & Medical Emergency',
        'urgencyScore': 92,
        'urgencyLevel': 'Critical',
        'analysisSummary': 'Rising water level and multiple casualties. Nearest shelter identified.',
        'recommendedResourceTypes': 'Ambulance, Rescue Boat, Medical Team',
        'nearestShelterName': 'High School Evacuation Hub',
        'availableShelterCapacity': 250,
      });

      expect(a.id, 1);
      expect(a.incidentId, 10);
      expect(a.incidentTitle, 'Major River Flood & Medical Emergency');
      expect(a.urgencyScore, 92);
      expect(a.urgencyLevel, 'Critical');
      expect(a.analysisSummary, contains('Nearest shelter identified'));
      expect(a.recommendedResourceTypes, contains('Ambulance'));
      expect(a.nearestShelterName, 'High School Evacuation Hub');
      expect(a.availableShelterCapacity, 250);
    });

    test('fromJson critical urgency score >= 85', () {
      final a = SituationAssessmentModel.fromJson({
        'id': 2,
        'incidentId': 11,
        'urgencyScore': 85,
        'urgencyLevel': 'Critical',
      });

      expect(a.urgencyScore >= 85, isTrue);
      expect(a.urgencyLevel, 'Critical');
    });

    test('fromJson high urgency assessment', () {
      final a = SituationAssessmentModel.fromJson({
        'id': 3,
        'incidentId': 12,
        'urgencyScore': 70,
        'urgencyLevel': 'High',
        'analysisSummary': 'Localized flooding with moderate damage.',
        'recommendedResourceTypes': 'Rescue Team, Water Pump',
      });

      expect(a.urgencyScore, 70);
      expect(a.urgencyLevel, 'High');
    });

    test('fromJson medium urgency assessment', () {
      final a = SituationAssessmentModel.fromJson({
        'id': 4,
        'incidentId': 13,
        'urgencyScore': 45,
        'urgencyLevel': 'Medium',
      });

      expect(a.urgencyScore, 45);
      expect(a.urgencyLevel, 'Medium');
    });

    test('fromJson defaults urgencyLevel to Medium when missing', () {
      final a = SituationAssessmentModel.fromJson({
        'id': 5,
        'incidentId': 14,
        'urgencyScore': 30,
      });

      expect(a.urgencyLevel, 'Medium');
    });

    test('fromJson handles null nearestShelterName', () {
      final a = SituationAssessmentModel.fromJson({
        'id': 6,
        'incidentId': 15,
        'urgencyScore': 50,
        'urgencyLevel': 'Medium',
      });

      expect(a.nearestShelterName, isNull);
    });

    test('fromJson defaults numeric fields to 0 when missing', () {
      final a = SituationAssessmentModel.fromJson({
        'id': 7,
        'incidentId': 16,
      });

      expect(a.urgencyScore, 0);
      expect(a.availableShelterCapacity, 0);
    });

    test('fromJson defaults string fields to empty when null', () {
      final a = SituationAssessmentModel.fromJson({
        'id': 8,
      });

      expect(a.incidentTitle, '');
      expect(a.analysisSummary, '');
      expect(a.recommendedResourceTypes, '');
    });
  });
}
