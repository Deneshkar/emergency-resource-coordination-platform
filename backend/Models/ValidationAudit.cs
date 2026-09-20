namespace ERCP.Api.Models;

/// <summary>
/// Student 4 — Persisted audit trail for the Validation/Safety Agent gate.
/// One row per POST /api/validations/dispatch/{id} run. Stores the
/// structured result (violations/warnings/checks as JSON) plus timing and
/// approver identity so the coordinator decision is auditable and survives refresh.
/// </summary>
public class ValidationAudit
{
    public int Id { get; set; }

    public int DispatchId { get; set; }
    public Dispatch? Dispatch { get; set; }

    public int? IncidentId { get; set; }

    public bool IsValid { get; set; }

    public string Recommendation { get; set; } = "REJECT"; // APPROVE | REVISE | REJECT

    public string ViolationsJson { get; set; } = "[]";
    public string WarningsJson { get; set; } = "[]";
    public string ChecksJson { get; set; } = "[]";

    public string ValidatedBy { get; set; } = "System";

    public long DurationMs { get; set; }

    public DateTime ValidatedAt { get; set; } = DateTime.UtcNow;
}
