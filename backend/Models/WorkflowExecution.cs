namespace ERCP.Api.Models;

// Durable, reviewable state for one incident response run. Only structured
// summaries are stored; model prompts and hidden reasoning are not persisted.
public class WorkflowExecution
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int IncidentId { get; set; }
    public int? IncidentPlanId { get; set; }
    public int? DispatchId { get; set; }
    public string Objective { get; set; } = string.Empty;
    public string Status { get; set; } = "Running";
    public string ApprovalStatus { get; set; } = "NotRequested";
    public string PlanJson { get; set; } = "[]";
    public string CompletedStepsJson { get; set; } = "[]";
    public string ToolResultsJson { get; set; } = "[]";
    public string ValidationJson { get; set; } = "{}";
    public string ErrorsJson { get; set; } = "[]";
    public string FinalOutcome { get; set; } = string.Empty;
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}
