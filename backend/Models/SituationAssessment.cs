namespace ERCP.Api.Models;

public class SituationAssessment
{
    public int Id { get; set; }

    public int IncidentId { get; set; }

    public int UrgencyScore { get; set; } // 0 - 100

    public string UrgencyLevel { get; set; } = "Medium"; // Low, Medium, High, Critical

    public string AnalysisSummary { get; set; } = string.Empty;

    public string RecommendedResourceTypes { get; set; } = string.Empty;

    public int? NearestShelterId { get; set; }

    public string ResourceDeficiencyJson { get; set; } = "[]";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
