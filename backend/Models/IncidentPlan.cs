namespace ERCP.Api.Models;

public class IncidentPlan
{
    public int Id { get; set; }

    public int IncidentId { get; set; }
    public Incident? Incident { get; set; }

    public string PlanDetails { get; set; } = string.Empty;

    public string Status { get; set; } = "Proposed";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
