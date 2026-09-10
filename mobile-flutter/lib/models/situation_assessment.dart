class SituationAssessmentModel {
  final int id;
  final int incidentId;
  final String incidentTitle;
  final int urgencyScore;
  final String urgencyLevel;
  final String analysisSummary;
  final String recommendedResourceTypes;
  final String? nearestShelterName;
  final int availableShelterCapacity;

  SituationAssessmentModel({
    required this.id,
    required this.incidentId,
    required this.incidentTitle,
    required this.urgencyScore,
    required this.urgencyLevel,
    required this.analysisSummary,
    required this.recommendedResourceTypes,
    this.nearestShelterName,
    required this.availableShelterCapacity,
  });

  factory SituationAssessmentModel.fromJson(Map<String, dynamic> json) {
    return SituationAssessmentModel(
      id: json['id'] ?? 0,
      incidentId: json['incidentId'] ?? 0,
      incidentTitle: json['incidentTitle'] ?? '',
      urgencyScore: json['urgencyScore'] ?? 0,
      urgencyLevel: json['urgencyLevel'] ?? 'Medium',
      analysisSummary: json['analysisSummary'] ?? '',
      recommendedResourceTypes: json['recommendedResourceTypes'] ?? '',
      nearestShelterName: json['nearestShelterName'],
      availableShelterCapacity: json['availableShelterCapacity'] ?? 0,
    );
  }
}
