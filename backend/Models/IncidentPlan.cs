namespace ERCP.Api.Models;

public class IncidentPlan
{
    public int Id { get; set; }

    public int IncidentId { get; set; }

    public string PlanTitle { get; set; } = string.Empty;

    public string PlanDescription { get; set; } = string.Empty;

    public string Status { get; set; } = "Generated";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Incident? Incident { get; set; }
}
