class ResourceDeficiency {
  final String category;
  final int available;
  final int recommended;
  final bool isDeficit;

  ResourceDeficiency({
    required this.category,
    required this.available,
    required this.recommended,
    required this.isDeficit,
  });

  factory ResourceDeficiency.fromJson(Map<String, dynamic> json) {
    return ResourceDeficiency(
      category: json['category'] ?? '',
      available: json['available'] ?? 0,
      recommended: json['recommended'] ?? 0,
      isDeficit: json['isDeficit'] ?? false,
    );
  }
}

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
  final List<ResourceDeficiency> resourceDeficiencies;

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
    this.resourceDeficiencies = const [],
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
      resourceDeficiencies: json['resourceDeficiencies'] != null
          ? (json['resourceDeficiencies'] as List)
              .map((d) => ResourceDeficiency.fromJson(d))
              .toList()
          : [],
    );
  }
}
