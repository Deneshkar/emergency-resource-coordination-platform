using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace ERCP.Api.DTOs;

public class CreateIncidentDto : IValidatableObject
{
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Location { get; set; } = string.Empty;

    public string Category { get; set; } = "General Emergency"; // Fire, Flood, Medical, Earthquake, Infrastructure, Chemical

    public string Priority { get; set; } = "Medium"; // Low, Medium, High, Critical

    [Range(0, int.MaxValue, ErrorMessage = "Affected count cannot be negative.")]
    public int AffectedCount { get; set; } = 0;

    public string ReporterContact { get; set; } = string.Empty;

    public double? Latitude { get; set; }

    public double? Longitude { get; set; }

    public bool AutoGeneratePlan { get; set; } = true;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var title = Title?.Trim() ?? string.Empty;
        if (title.Length < 5) yield return new ValidationResult("Give the incident a clear title (min 5 characters).", new[] { nameof(Title) });
        if (Regex.IsMatch(title, @"^\d+$")) yield return new ValidationResult("Title must contain meaningful text, not just numbers.", new[] { nameof(Title) });
        if (Regex.IsMatch(title, @"^(.)\1+$")) yield return new ValidationResult("Title must contain meaningful text.", new[] { nameof(Title) });
        if (!Regex.IsMatch(title, @"[a-zA-Z]")) yield return new ValidationResult("Title must contain at least some letters.", new[] { nameof(Title) });

        var loc = Location?.Trim() ?? string.Empty;
        if (loc.Length < 5) yield return new ValidationResult("A specific location or address is required (min 5 characters).", new[] { nameof(Location) });
        if (Regex.IsMatch(loc, @"^\d+$")) yield return new ValidationResult("Address must contain meaningful text, not just numbers.", new[] { nameof(Location) });
        if (Regex.IsMatch(loc, @"^(.)\1+$")) yield return new ValidationResult("Address must contain meaningful text.", new[] { nameof(Location) });
        
        var letters = Regex.Matches(loc, @"[a-zA-Z]");
        if (letters.Count < 3) yield return new ValidationResult("Address must contain enough letters to be meaningful.", new[] { nameof(Location) });
        
        var lower = loc.ToLower();
        if (lower == "test" || lower == "none" || lower == "n/a" || lower == "unknown" || lower == "placeholder") 
            yield return new ValidationResult("Please provide a real address.", new[] { nameof(Location) });

        var desc = Description?.Trim() ?? string.Empty;
        if (desc.Length < 20) yield return new ValidationResult($"Add more situational detail ({desc.Length}/20 min characters).", new[] { nameof(Description) });
        if (Regex.IsMatch(desc, @"^\d+$")) yield return new ValidationResult("Summary must contain meaningful text, not just numbers.", new[] { nameof(Description) });
        if (Regex.IsMatch(desc, @"^(.)\1+$")) yield return new ValidationResult("Summary must contain meaningful text.", new[] { nameof(Description) });
        if (!Regex.IsMatch(desc, @"[a-zA-Z]")) yield return new ValidationResult("Summary must contain at least some letters.", new[] { nameof(Description) });
        
        var words = desc.ToLower().Split(new[] { ' ', '\t', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries);
        if (words.Length > 2 && words.All(w => w == words[0]))
        {
            yield return new ValidationResult("Summary must contain meaningful content, not repeated words.", new[] { nameof(Description) });
        }

        var rep = ReporterContact?.Trim() ?? string.Empty;
        if (!string.IsNullOrEmpty(rep) && !Regex.IsMatch(rep, @"^[^\s@]+@[^\s@]+\.[^\s@]+$"))
        {
            yield return new ValidationResult("Please enter a valid email address.", new[] { nameof(ReporterContact) });
        }
    }
}

public class UpdateIncidentDto : IValidatableObject
{
    public string? Status { get; set; }

    public string? Priority { get; set; }

    public string? Category { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Affected count cannot be negative.")]
    public int? AffectedCount { get; set; }

    public string? AssignedCoordinator { get; set; }

    public string? Note { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (AffectedCount.HasValue && AffectedCount.Value < 0)
        {
            yield return new ValidationResult("Affected count cannot be negative.", new[] { nameof(AffectedCount) });
        }
    }
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

    public string Reasoning { get; set; } = string.Empty;

    public List<string> Risks { get; set; } = new();

    public List<string> Constraints { get; set; } = new();

    public bool RequiresHumanApproval { get; set; } = true;

    public List<SuggestedAssignmentDto> SuggestedAssignments { get; set; } = new();

    public List<DispatchPlanStepDto> DispatchPlan { get; set; } = new();

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

public class SuggestedAssignmentDto
{
    public string Role { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}

public class DispatchPlanStepDto
{
    public string Action { get; set; } = string.Empty;
    public string Resource { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
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

public class StructuredAiPlannerOutputDto
{
    public int IncidentId { get; set; }

    public string Priority { get; set; } = string.Empty;

    public string Objective { get; set; } = string.Empty;

    public List<string> Actions { get; set; } = new();

    public List<string> RequiredResources { get; set; } = new();

    public string Status { get; set; } = "Generated";
}