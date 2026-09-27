namespace ERCP.Api.DTOs;

public class CreateVolunteerDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Skills { get; set; } = string.Empty;
}

public class UpdateAvailabilityDto
{
    public bool IsAvailable { get; set; }
}

public class UpdateVolunteerDto
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Skills { get; set; } = string.Empty;
}

public class UpdateShiftDto
{
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Status { get; set; } = "Scheduled";
}

public class CreateShiftDto
{
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Status { get; set; } = "Scheduled";
}

public class VolunteerResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Skills { get; set; } = string.Empty;
    public bool IsAvailable { get; set; }
    public double Rating { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ShiftResponseDto
{
    public Guid Id { get; set; }
    public Guid VolunteerId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Status { get; set; } = "Scheduled";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class VolunteerTaskDto
{
    public int TaskId { get; set; }
    public int DispatchId { get; set; }
    public int IncidentId { get; set; }
    public string IncidentTitle { get; set; } = string.Empty;
    public string DispatchStatus { get; set; } = string.Empty;
    public string DispatchPriority { get; set; } = string.Empty;
    public string TaskType { get; set; } = string.Empty;
    public string TaskStatus { get; set; } = string.Empty;
    public int? ResourceId { get; set; }
    public string? ResourceName { get; set; }
    public DateTime? AssignedAt { get; set; }
}