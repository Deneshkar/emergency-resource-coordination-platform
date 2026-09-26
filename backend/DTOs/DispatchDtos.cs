using System.ComponentModel.DataAnnotations;

namespace ERCP.Api.DTOs;

public record CreateDispatchDto(
    [Required] int IncidentId,
    [Required] string Priority
);

public record UpdateDispatchStatusDto(
    [Required] string Status
);

public record ProposeDispatchAllocationDto(
    [Required] int AllocationPlanId
);

public record UpdateDispatchTaskDto(
    [Required] Guid VolunteerId,
    int? ResourceId,
    [Required] string TaskType
);

public record CreateDispatchTaskDto(
    [Required] Guid VolunteerId,
    int? ResourceId,
    [Required] string TaskType
);

public record DispatchTaskResponseDto(
    int Id,
    Guid VolunteerId,
    int? ResourceId,
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
    List<DispatchTaskResponseDto> Tasks,
    IncidentPlanDto? AllocationProposal = null
);