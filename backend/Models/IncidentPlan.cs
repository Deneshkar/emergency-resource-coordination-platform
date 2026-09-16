namespace ERCP.Api.Models;

public class IncidentPlan
{
    public int Id { get; set; }

    public int IncidentId { get; set; }

    public string PlanTitle { get; set; } = string.Empty;

    public string PlanDescription { get; set; } = string.Empty;

    public string Status { get; set; } = "Draft"; // Draft, Approved, InExecution, Completed, Rejected

    public string Phase { get; set; } = "Immediate Containment"; // Immediate Containment, Resource Mobilization, Public Safety, Recovery

    public string ActionStepsJson { get; set; } = "[]"; // JSON array of action items

    public string EstimatedResourcesJson { get; set; } = "[]"; // JSON array of required resources

    public string RiskAssessment { get; set; } = string.Empty;

    public string ApprovedBy { get; set; } = string.Empty;

    public DateTime? ApprovedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Incident? Incident { get; set; }
}
