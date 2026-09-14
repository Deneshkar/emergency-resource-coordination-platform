namespace ERCP.Api.Models;

public class IncidentTimelineEvent
{
    public int Id { get; set; }

    public int IncidentId { get; set; }

    public string EventType { get; set; } = "StatusUpdate"; // e.g. Created, StatusUpdate, PlanGenerated, NoteAdded

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string CreatedBy { get; set; } = "System";

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public Incident? Incident { get; set; }
}
