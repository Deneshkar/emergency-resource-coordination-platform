namespace ERCP.Api.DTOs;

// Student 4 — Validation/Safety Agent DTOs (deterministic pre-approval gate)

public record ShelterAllocationDto(
    int ShelterId,
    int IncomingCount
);

public record InventoryRequestDto(
    int InventoryItemId,
    int RequestedQty
);

/// <summary>
/// Optional context for dispatch validation. Shelter/inventory are optional
/// because a dispatch may only assign volunteers/resources.
/// </summary>
public record ValidateDispatchRequestDto(
    List<ShelterAllocationDto>? ShelterAllocations = null,
    List<InventoryRequestDto>? InventoryRequests = null,
    DateTime? ProposedShiftStart = null,
    DateTime? ProposedShiftEnd = null
);

public record ValidationCheckDto(
    string Tool,
    bool Passed,
    string Detail
);

public record ValidationViolationDto(
    string Code,
    string Message,
    string Severity // BLOCKER or WARNING
);

public record ValidationResultDto(
    int? DispatchId,
    int? IncidentId,
    bool IsValid,
    string Recommendation, // APPROVE | REVISE | REJECT
    List<ValidationViolationDto> Violations,
    List<ValidationViolationDto> Warnings,
    List<ValidationCheckDto> Checks,
    DateTime ValidatedAt,
    int? AuditId = null,
    long DurationMs = 0,
    string ValidatedBy = "System",
    bool LlmEnhanced = false,
    string? AiInsight = null
);

public record ValidationHistoryDto(
    int AuditId,
    int DispatchId,
    int? IncidentId,
    bool IsValid,
    string Recommendation,
    int ViolationCount,
    int WarningCount,
    int CheckCount,
    string ValidatedBy,
    long DurationMs,
    DateTime ValidatedAt,
    bool LlmEnhanced = false,
    string? AiInsight = null
);
