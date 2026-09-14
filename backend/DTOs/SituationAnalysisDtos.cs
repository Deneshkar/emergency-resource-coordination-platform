namespace ERCP.Api.DTOs;

public class AssessSituationRequestDto
{
    public int IncidentId { get; set; }
}

public class SituationAssessmentResponseDto
{
    public int Id { get; set; }
    public int IncidentId { get; set; }
    public string IncidentTitle { get; set; } = string.Empty;
    public string IncidentLocation { get; set; } = string.Empty;
    public int UrgencyScore { get; set; }
    public string UrgencyLevel { get; set; } = string.Empty;
    public string AnalysisSummary { get; set; } = string.Empty;
    public string RecommendedResourceTypes { get; set; } = string.Empty;
    public int? NearestShelterId { get; set; }
    public string? NearestShelterName { get; set; }
    public int AvailableShelterCapacity { get; set; }
    public List<ResourceDeficiencyDto> ResourceDeficiencies { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class ResourceDeficiencyDto
{
    public string Category { get; set; } = string.Empty;
    public int Available { get; set; }
    public int Recommended { get; set; }
    public bool IsDeficit { get; set; }
}
