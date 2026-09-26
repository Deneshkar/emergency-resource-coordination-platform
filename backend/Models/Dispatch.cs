namespace ERCP.Api.Models;

public class Dispatch
{
    public int Id { get; set; }

    public int IncidentId { get; set; }

    public int? AllocationPlanId { get; set; }

    public IncidentPlan? AllocationPlan { get; set; }

    public string Status { get; set; } = "Proposed";

    public string Priority { get; set; } = "Medium";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ApprovedAt { get; set; }

    public string? ApprovedBy { get; set; }

    public ICollection<DispatchTask> Tasks { get; set; } = new List<DispatchTask>();
}