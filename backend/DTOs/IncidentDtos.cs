namespace ERCP.Api.DTOs;

public class CreateIncidentDto
{
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Location { get; set; } = string.Empty;

    public string Category { get; set; } = "General Emergency"; // Fire, Flood, Medical, Earthquake, Infrastructure, Chemical

    public string Priority { get; set; } = "Medium"; // Low, Medium, High, Critical

    public int AffectedCount { get; set; } = 0;

    public string ReporterContact { get; set; } = string.Empty;

    public double? Latitude { get; set; }

    public double? Longitude { get; set; }

    public bool AutoGeneratePlan { get; set; } = true;
}

public class UpdateIncidentDto
{
    public string? Status { get; set; }

    public string? Priority { get; set; }

    public string? Category { get; set; }

    public int? AffectedCount { get; set; }

    public string? AssignedCoordinator { get; set; }

    public string? Note { get; set; }
}

public class IncidentResponseDto
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Location { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public string Priority { get; set; } = string.Empty;

    public int AffectedCount { get; set; }

    public string ReporterContact { get; set; } = string.Empty;

    public double? Latitude { get; set; }

    public double? Longitude { get; set; }

    public string AssignedCoordinator { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public int PlanCount { get; set; }
}

public class IncidentDetailDto : IncidentResponseDto
{
    public List<IncidentPlanDto> Plans { get; set; } = new();

    public List<IncidentTimelineEventDto> TimelineEvents { get; set; } = new();
}

public class GeneratePlanRequestDto
{
    public string CustomDirectives { get; set; } = string.Empty;

    public string FocusPhase { get; set; } = string.Empty; // e.g. Immediate Containment, Evacuation, Resource Mobilization
}

public class IncidentPlanDto
{
    public int Id { get; set; }

    public int IncidentId { get; set; }

    public string PlanTitle { get; set; } = string.Empty;

    public string PlanDescription { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public string Phase { get; set; } = string.Empty;

    public List<PlanActionStepDto> ActionSteps { get; set; } = new();

    public List<EstimatedResourceDto> EstimatedResources { get; set; } = new();

    public string RiskAssessment { get; set; } = string.Empty;

    public string ApprovedBy { get; set; } = string.Empty;

    public DateTime? ApprovedAt { get; set; }

    public DateTime CreatedAt { get; set; }
}

public class PlanActionStepDto
{
    public int StepNumber { get; set; }

    public string Task { get; set; } = string.Empty;

    public string ResponsibleTeam { get; set; } = string.Empty;

    public string Priority { get; set; } = "High";

    public int EstimatedMinutes { get; set; }

    public bool IsCompleted { get; set; }
}

public class EstimatedResourceDto
{
    public string ResourceType { get; set; } = string.Empty; // Personnel, Vehicle, Medical, Heavy Equipment, Food/Water

    public int Quantity { get; set; }

    public string Unit { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;
}

public class UpdatePlanStatusDto
{
    public string Status { get; set; } = string.Empty; // Approved, InExecution, Completed, Rejected

    public string ApprovedBy { get; set; } = string.Empty;
}

public class AddTimelineEventDto
{
    public string EventType { get; set; } = "DispatcherNote";

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string CreatedBy { get; set; } = "Dispatcher";
}

public class IncidentTimelineEventDto
{
    public int Id { get; set; }

    public int IncidentId { get; set; }

    public string EventType { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string CreatedBy { get; set; } = string.Empty;

    public DateTime Timestamp { get; set; }
}

public class IncidentSummaryStatsDto
{
    public int TotalIncidents { get; set; }

    public int ActiveIncidents { get; set; }

    public int CriticalIncidents { get; set; }

    public int ResolvedIncidents { get; set; }

    public int GeneratedPlansCount { get; set; }

    public Dictionary<string, int> IncidentsByCategory { get; set; } = new();

    public Dictionary<string, int> IncidentsByPriority { get; set; } = new();
}