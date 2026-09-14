namespace ERCP.Api.Models;

public class Incident
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Location { get; set; } = string.Empty;

    public string Status { get; set; } = "Reported";

    public string Priority { get; set; } = "Medium";

    public string Category { get; set; } = "General Emergency"; // Fire, Flood, Medical, Earthquake, Infrastructure, Chemical

    public int AffectedCount { get; set; } = 0;

    public string ReporterContact { get; set; } = string.Empty;

    public double? Latitude { get; set; }

    public double? Longitude { get; set; }

    public string AssignedCoordinator { get; set; } = "AI Coordinator";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<IncidentPlan> Plans { get; set; } = new List<IncidentPlan>();
<<<<<<< HEAD

    public ICollection<IncidentTimelineEvent> TimelineEvents { get; set; } = new List<IncidentTimelineEvent>();
}
=======
}
>>>>>>> origin/main
