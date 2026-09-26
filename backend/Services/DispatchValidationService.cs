using System.Diagnostics;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ERCP.Api.Data;
using ERCP.Api.DTOs;
using ERCP.Api.Models;

namespace ERCP.Api.Services;

/// <summary>
/// Student 4 — Validation/Safety Agent (C# deterministic mirror of ai-agents/validation_safety_agent.py).
/// Runs BEFORE coordinator approval. Pure business-rule checks, no LLM randomness:
/// V1 volunteer unavailable, V2 double-booking, S1/S2 shelter status/capacity,
/// R1/R2 resource status/quantity, I1 inventory quantity (+ threshold warnings).
/// Allow-listed tools: check_volunteer_availability, check_shift_overlap,
/// check_shelter_capacity, check_resource_stock.
/// </summary>
public class DispatchValidationService
{
    private readonly AppDbContext _context;

    public static readonly IReadOnlyList<string> AllowedTools =
    [
        "check_volunteer_availability",
        "check_shift_overlap",
        "check_shelter_capacity",
        "check_resource_stock",
    ];

    public DispatchValidationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ValidationResultDto> ValidateDispatchAsync(int dispatchId, ValidateDispatchRequestDto? request = null, string validatedBy = "System")
    {
        var stopwatch = Stopwatch.StartNew();
        var dispatch = await _context.Dispatches
            .Include(d => d.Tasks)
            .FirstOrDefaultAsync(d => d.Id == dispatchId);

        if (dispatch == null)
            throw new KeyNotFoundException($"Dispatch with ID {dispatchId} not found.");

        var violations = new List<ValidationViolationDto>();
        var warnings = new List<ValidationViolationDto>();
        var checks = new List<ValidationCheckDto>();

        // ---- Tool: check_volunteer_availability + check_shift_overlap ----
        foreach (var task in dispatch.Tasks)
        {
            var volunteer = await _context.Volunteers.FindAsync(task.VolunteerId);
            if (volunteer == null)
            {
                violations.Add(new ValidationViolationDto(
                    "V0_VOLUNTEER_NOT_FOUND",
                    $"Task {task.Id}: volunteer {task.VolunteerId} does not exist.",
                    "BLOCKER"));
                checks.Add(new ValidationCheckDto(
                    "check_volunteer_availability", false,
                    $"Task {task.Id}: volunteer record missing."));
                continue;
            }

            // V1: availability
            bool available = volunteer.IsAvailable;
            checks.Add(new ValidationCheckDto(
                "check_volunteer_availability", available,
                $"Volunteer {volunteer.Name} ({volunteer.Id}) available={available}."));
            if (!available)
            {
                violations.Add(new ValidationViolationDto(
                    "V1_VOLUNTEER_UNAVAILABLE",
                    $"Volunteer {volunteer.Name} is marked unavailable/off-duty and cannot be dispatched.",
                    "BLOCKER"));
            }

            // V2: double-booking against Scheduled/Active shifts overlapping proposed window
            if (request?.ProposedShiftStart.HasValue == true && request?.ProposedShiftEnd.HasValue == true)
            {
                var start = request.ProposedShiftStart!.Value;
                var end = request.ProposedShiftEnd!.Value;

                if (start >= end)
                {
                    violations.Add(new ValidationViolationDto(
                        "V3_INVALID_SHIFT_WINDOW",
                        $"Proposed shift start must be before end.",
                        "BLOCKER"));
                    checks.Add(new ValidationCheckDto(
                        "check_shift_overlap", false,
                        "Proposed shift window is invalid (start >= end)."));
                }
                else
                {
                    var overlapping = await _context.Shifts
                        .Where(s => s.VolunteerId == volunteer.Id
                            && s.Status != ShiftStatus.Cancelled
                            && s.Status != ShiftStatus.Completed
                            && s.StartTime < end && start < s.EndTime)
                        .Select(s => s.Id.ToString())
                        .ToListAsync();

                    bool passed = overlapping.Count == 0;
                    checks.Add(new ValidationCheckDto(
                        "check_shift_overlap", passed,
                        $"Volunteer {volunteer.Name}: {overlapping.Count} overlapping shift(s)."));
                    if (!passed)
                    {
                        violations.Add(new ValidationViolationDto(
                            "V2_DOUBLE_BOOKING",
                            $"Volunteer {volunteer.Name} is already booked on overlapping shift(s): {string.Join(", ", overlapping)}.",
                            "BLOCKER"));
                    }
                }
            }

        }

        // ---- Tool: check_shelter_capacity ----
        foreach (var alloc in request?.ShelterAllocations ?? [])
        {
            var shelter = await _context.Shelters.FindAsync(alloc.ShelterId);
            if (shelter == null)
            {
                violations.Add(new ValidationViolationDto(
                    "S0_SHELTER_NOT_FOUND",
                    $"Shelter {alloc.ShelterId} does not exist.",
                    "BLOCKER"));
                checks.Add(new ValidationCheckDto(
                    "check_shelter_capacity", false,
                    $"Shelter {alloc.ShelterId}: record missing."));
                continue;
            }

            int projected = shelter.CurrentOccupancy + alloc.IncomingCount;
            bool passed = shelter.Status == "Active" && projected <= shelter.TotalCapacity;
            checks.Add(new ValidationCheckDto(
                "check_shelter_capacity", passed,
                $"Shelter {shelter.Name}: {shelter.CurrentOccupancy}+{alloc.IncomingCount}/{shelter.TotalCapacity} (status={shelter.Status})."));

            if (shelter.Status != "Active")
            {
                violations.Add(new ValidationViolationDto(
                    "S1_SHELTER_NOT_ACTIVE",
                    $"Shelter {shelter.Name} has status '{shelter.Status}' and cannot receive evacuees.",
                    "BLOCKER"));
            }
            else if (projected > shelter.TotalCapacity)
            {
                violations.Add(new ValidationViolationDto(
                    "S2_SHELTER_OVER_ALLOCATION",
                    $"Shelter {shelter.Name} would exceed capacity ({projected}/{shelter.TotalCapacity}).",
                    "BLOCKER"));
            }
            else if (shelter.TotalCapacity > 0 && (double)projected / shelter.TotalCapacity > 0.9)
            {
                warnings.Add(new ValidationViolationDto(
                    "W3_SHELTER_NEAR_CAPACITY",
                    $"Shelter {shelter.Name} will be >90% full after allocation ({projected}/{shelter.TotalCapacity}).",
                    "WARNING"));
            }
        }

        // ---- Tool: check_resource_stock (inventory) ----
        foreach (var task in dispatch.Tasks.Where(task => task.ResourceId.HasValue))
        {
            var resource = await _context.Resources.FindAsync(task.ResourceId!.Value);
            if (resource == null)
            {
                violations.Add(new ValidationViolationDto(
                    "R0_RESOURCE_NOT_FOUND",
                    $"Task {task.Id}: linked resource {task.ResourceId} does not exist.",
                    "BLOCKER"));
                checks.Add(new ValidationCheckDto(
                    "check_resource_stock", false,
                    $"Task {task.Id}: linked resource {task.ResourceId} is missing."));
                continue;
            }

            bool resourceAvailable = resource.Status == "Available";
            checks.Add(new ValidationCheckDto(
                "check_resource_stock", resourceAvailable,
                $"Task {task.Id}: resource {resource.Name} status is {resource.Status}."));

            if (!resourceAvailable)
            {
                violations.Add(new ValidationViolationDto(
                    "R1_RESOURCE_UNAVAILABLE",
                    $"Task {task.Id}: resource {resource.Name} is {resource.Status}, not Available.",
                    "BLOCKER"));
            }
        }

        foreach (var req in request?.InventoryRequests ?? [])
        {
            var item = await _context.InventoryItems.FindAsync(req.InventoryItemId);
            if (item == null)
            {
                violations.Add(new ValidationViolationDto(
                    "I0_ITEM_NOT_FOUND",
                    $"Inventory item {req.InventoryItemId} does not exist.",
                    "BLOCKER"));
                checks.Add(new ValidationCheckDto(
                    "check_resource_stock", false,
                    $"Inventory {req.InventoryItemId}: record missing."));
                continue;
            }

            bool passed = item.Quantity >= req.RequestedQty;
            checks.Add(new ValidationCheckDto(
                "check_resource_stock", passed,
                $"Inventory {item.ItemName}: requested={req.RequestedQty} available={item.Quantity} threshold={item.MinimumThreshold}."));

            if (!passed)
            {
                violations.Add(new ValidationViolationDto(
                    "I1_INVENTORY_INSUFFICIENT",
                    $"Inventory {item.ItemName} insufficient: requested {req.RequestedQty}, available {item.Quantity}.",
                    "BLOCKER"));
            }
            else if (item.Quantity - req.RequestedQty < item.MinimumThreshold)
            {
                warnings.Add(new ValidationViolationDto(
                    "W2_INVENTORY_BELOW_THRESHOLD",
                    $"Inventory {item.ItemName} will drop below minimum threshold ({item.Quantity - req.RequestedQty} < {item.MinimumThreshold}) after allocation.",
                    "WARNING"));
            }
        }

        // W0: an empty dispatch (no tasks) must not read as a clean APPROVE —
        // nothing was evaluated, so the coordinator must add tasks and re-run
        // before the high-impact approval. Advisory only (still IsValid).
        if (!dispatch.Tasks.Any())
        {
            warnings.Add(new ValidationViolationDto(
                "W0_EMPTY_DISPATCH",
                $"Dispatch {dispatch.Id} has no tasks assigned — add at least one volunteer/resource task and re-run validation before approval.",
                "WARNING"));
        }

        bool isValid = violations.Count == 0;
        string recommendation;
        if (isValid)
            recommendation = warnings.Count == 0 ? "APPROVE" : "REVISE";
        else
        {
            var revisable = new HashSet<string>
                { "S2_SHELTER_OVER_ALLOCATION", "I1_INVENTORY_INSUFFICIENT", "V2_DOUBLE_BOOKING" };
            var codes = violations.Select(v => v.Code).ToHashSet();
            recommendation = codes.IsSubsetOf(revisable) ? "REVISE" : "REJECT";
        }

        stopwatch.Stop();
        var validatedAt = DateTime.UtcNow;

        // ---- Persist auditable result (spec 5.2: workflow state + auditable result) ----
        var audit = new ValidationAudit
        {
            DispatchId = dispatch.Id,
            IncidentId = dispatch.IncidentId,
            IsValid = isValid,
            Recommendation = recommendation,
            ViolationsJson = JsonSerializer.Serialize(violations),
            WarningsJson = JsonSerializer.Serialize(warnings),
            ChecksJson = JsonSerializer.Serialize(checks),
            ValidatedBy = string.IsNullOrWhiteSpace(validatedBy) ? "System" : validatedBy,
            DurationMs = stopwatch.ElapsedMilliseconds,
            ValidatedAt = validatedAt,
        };
        _context.ValidationAudits.Add(audit);

        // Timeline entry so the decision is visible in IncidentDetail activity log.
        // Guarded: seed/test dispatches may reference a non-existent incident.
        if (await _context.Incidents.AnyAsync(i => i.Id == dispatch.IncidentId))
        {
            var topCodes = violations.Select(v => v.Code).Take(3).ToList();
            var summary = violations.Count == 0
                ? warnings.Count == 0
                    ? "All safety checks passed."
                    : $"{warnings.Count} warning(s): {string.Join(", ", warnings.Select(w => w.Code).Take(3))}."
                : $"{violations.Count} blocker(s): {string.Join(", ", topCodes)}.";
            _context.IncidentTimelineEvents.Add(new IncidentTimelineEvent
            {
                IncidentId = dispatch.IncidentId,
                EventType = "ValidationPerformed",
                Title = $"Safety {recommendation} — Dispatch #{dispatch.Id}",
                Description = $"Validation/Safety Agent checked Dispatch #{dispatch.Id}: {summary} ({checks.Count} checks, {audit.DurationMs}ms).",
                CreatedBy = audit.ValidatedBy,
                Timestamp = validatedAt,
            });
        }

        await _context.SaveChangesAsync();

        return new ValidationResultDto(
            dispatch.Id,
            dispatch.IncidentId,
            isValid,
            recommendation,
            violations,
            warnings,
            checks,
            validatedAt,
            audit.Id,
            audit.DurationMs,
            audit.ValidatedBy
        );
    }

    public async Task<List<ValidationHistoryDto>> GetHistoryAsync(int dispatchId)
    {
        var audits = await _context.ValidationAudits
            .Where(a => a.DispatchId == dispatchId)
            .OrderByDescending(a => a.ValidatedAt)
            .ToListAsync();

        static int CountJsonArray(string json)
        {
            try
            {
                using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(json) ? "[]" : json);
                return doc.RootElement.ValueKind == JsonValueKind.Array ? doc.RootElement.GetArrayLength() : 0;
            }
            catch { return 0; }
        }

        return audits.Select(a => new ValidationHistoryDto(
            a.Id,
            a.DispatchId,
            a.IncidentId,
            a.IsValid,
            a.Recommendation,
            CountJsonArray(a.ViolationsJson),
            CountJsonArray(a.WarningsJson),
            CountJsonArray(a.ChecksJson),
            a.ValidatedBy,
            a.DurationMs,
            a.ValidatedAt
        )).ToList();
    }
}
