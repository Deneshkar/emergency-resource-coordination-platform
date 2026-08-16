using System.ComponentModel.DataAnnotations;

namespace ERCP.Api.DTOs;

public record CreateDispatchDto(
    [Required] int IncidentId,
    [Required] string Priority
);

public record UpdateDispatchStatusDto(
    [Required] string Status
);

public record CreateDispatchTaskDto(
    [Required] Guid VolunteerId,
    Guid? ResourceId,
    [Required] string TaskType
);

public record DispatchTaskResponseDto(
    int Id,
    Guid VolunteerId,
    Guid? ResourceId,
    string TaskType,
    string Status
);

public record DispatchResponseDto(
    int Id,
    int IncidentId,
    string Status,
    string Priority,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? ApprovedAt,
    string? ApprovedBy,
    List<DispatchTaskResponseDto> Tasks
);