using System.Diagnostics;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
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
    private readonly HttpClient _httpClient;
    private readonly IConfiguration? _configuration;

    public static readonly IReadOnlyList<string> AllowedTools =
    [
        "check_volunteer_availability",
        "check_shift_overlap",
        "check_shelter_capacity",
        "check_resource_stock",
    ];

    // Codes the Gemini verdict may return. Unknown codes are rejected and the
    // deterministic rule result is kept (safety fallback).
    private static readonly HashSet<string> GeminiAllowedCodes = new(StringComparer.Ordinal)
    {
        "V1_VOLUNTEER_UNAVAILABLE", "V2_DOUBLE_BOOKING", "V3_INVALID_SHIFT_WINDOW",
        "V0_VOLUNTEER_NOT_FOUND",
        "S0_SHELTER_NOT_FOUND", "S1_SHELTER_NOT_ACTIVE", "S2_SHELTER_OVER_ALLOCATION",
        "R0_RESOURCE_NOT_FOUND", "R1_RESOURCE_UNAVAILABLE", "R2_RESOURCE_INSUFFICIENT",
        "I0_ITEM_NOT_FOUND", "I1_INVENTORY_INSUFFICIENT",
        "E0_INVALID_PAYLOAD",
    };

    private static readonly HashSet<string> GeminiAllowedRecommendations = new(StringComparer.Ordinal)
        { "APPROVE", "REVISE", "REJECT" };

    private const string GeminiModel = "gemini-3.6-flash";

    // Optional params keep existing callers/tests (new DispatchValidationService(ctx)) working.
    public DispatchValidationService(AppDbContext context, HttpClient? httpClient = null, IConfiguration? configuration = null)
    {
        _context = context;
        _httpClient = httpClient ?? new HttpClient { Timeout = TimeSpan.FromSeconds(12) };
        _configuration = configuration;
    }

    private string GetGeminiKey()
    {
        // QMS/test runs never call the live LLM (mirrors IncidentPlannerService).
        var env = Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")
            ?? Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        if (string.Equals(env, "Qms", StringComparison.OrdinalIgnoreCase))
            return string.Empty;
        return (_configuration?["GEMINI_API_KEY"]
            ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY")
            ?? string.Empty).Trim();
    }

    /// <summary>
    /// Ask Gemini for the FINAL dispatch verdict. Returns null when the key is
    /// missing, the call fails, or the response is not valid strict JSON, in
    /// which case the deterministic rule result is kept.
    /// </summary>
    private async Task<(bool IsValid, string Recommendation, List<ValidationViolationDto> Violations, string? AiInsight)?> TryGetGeminiVerdictAsync(
        int dispatchId, bool ruleIsValid, string ruleRecommendation,
        IReadOnlyList<string> ruleViolationCodes, IReadOnlyList<string> ruleWarningCodes, int checkCount,
        CancellationToken cancellationToken = default)
    {
        var apiKey = GetGeminiKey();
        if (string.IsNullOrWhiteSpace(apiKey))
            return null;

        try
        {
            var prompt = "You are the ERCP Validation/Safety Agent deciding a dispatch safety gate. "
                + "Given this deterministic rule summary, return the FINAL safety verdict. "
                + "Return ONLY a valid JSON object with exactly these keys: "
                + "'is_valid' (boolean), 'recommendation' (one of APPROVE, REVISE, REJECT), "
                + "'violations' (array of {code, message} using only known rule codes), "
                + "'ai_insight' (1-2 sentence plain-English explanation for a coordinator). "
                + "Rules: APPROVE only when no blockers. REVISE only for fixable capacity/double-booking "
                + "(S2, R2, I1, V2). Otherwise REJECT. "
                + $"Rule summary: {JsonSerializer.Serialize(new { dispatch_id = dispatchId, rule_is_valid = ruleIsValid, rule_recommendation = ruleRecommendation, rule_violations = ruleViolationCodes, rule_warnings = ruleWarningCodes, check_count = checkCount })}";

            using var request = new HttpRequestMessage(HttpMethod.Post,
                $"https://generativelanguage.googleapis.com/v1beta/models/{GeminiModel}:generateContent?key={apiKey}");
            request.Content = new StringContent(JsonSerializer.Serialize(new
            {
                contents = new[] { new { parts = new[] { new { text = prompt } } } },
                generationConfig = new { temperature = 0.0, maxOutputTokens = 512, responseMimeType = "application/json" },
            }), Encoding.UTF8, "application/json");

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"[ValidationSafetyAgent] Gemini verdict skipped: HTTP {(int)response.StatusCode}. Rule result kept.");
                return null;
            }

            using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
            if (!doc.RootElement.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
            {
                Console.WriteLine("[ValidationSafetyAgent] Gemini verdict skipped: empty candidates. Rule result kept.");
                return null;
            }
            var text = candidates[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString() ?? string.Empty;
            text = text.Trim();
            if (text.StartsWith("```json", StringComparison.Ordinal)) text = text["```json".Length..];
            if (text.StartsWith("```", StringComparison.Ordinal)) text = text["```".Length..];
            if (text.EndsWith("```", StringComparison.Ordinal)) text = text[..^"```".Length];
            text = text.Trim();

            JsonDocument? parsed = null;
            try { parsed = JsonDocument.Parse(text); }
            catch (JsonException)
            {
                // Model sometimes wraps JSON with prose: extract first {...} block.
                var start = text.IndexOf('{');
                var end = text.LastIndexOf('}');
                if (start < 0 || end <= start)
                {
                    Console.WriteLine("[ValidationSafetyAgent] Gemini verdict skipped: no JSON object in response. Rule result kept.");
                    return null;
                }
                try { parsed = JsonDocument.Parse(text[start..(end + 1)]); }
                catch (JsonException)
                {
                    Console.WriteLine("[ValidationSafetyAgent] Gemini verdict skipped: unparseable JSON. Rule result kept.");
                    return null;
                }
            }
            using (parsed)
            {
                var root = parsed.RootElement;
                if (!root.TryGetProperty("is_valid", out var isValidEl)
                    || (isValidEl.ValueKind != JsonValueKind.True && isValidEl.ValueKind != JsonValueKind.False))
                {
                    Console.WriteLine("[ValidationSafetyAgent] Gemini verdict skipped: missing/invalid is_valid. Rule result kept.");
                    return null;
                }
                if (!root.TryGetProperty("recommendation", out var recEl)
                    || !GeminiAllowedRecommendations.Contains(recEl.GetString() ?? string.Empty))
                {
                    Console.WriteLine("[ValidationSafetyAgent] Gemini verdict skipped: invalid recommendation. Rule result kept.");
                    return null;
                }
                if (!root.TryGetProperty("violations", out var violsEl) || violsEl.ValueKind != JsonValueKind.Array)
                {
                    Console.WriteLine("[ValidationSafetyAgent] Gemini verdict skipped: violations not an array. Rule result kept.");
                    return null;
                }

                var llmViolations = new List<ValidationViolationDto>();
                foreach (var v in violsEl.EnumerateArray())
                {
                    if (v.ValueKind != JsonValueKind.Object
                        || !v.TryGetProperty("code", out var codeEl))
                    {
                        Console.WriteLine("[ValidationSafetyAgent] Gemini verdict skipped: malformed violation entry. Rule result kept.");
                        return null;
                    }
                    var code = codeEl.GetString() ?? string.Empty;
                    if (!GeminiAllowedCodes.Contains(code))
                    {
                        Console.WriteLine($"[ValidationSafetyAgent] Gemini verdict skipped: unknown code '{code}'. Rule result kept.");
                        return null;
                    }
                    var message = v.TryGetProperty("message", out var msgEl) ? msgEl.GetString() ?? code : code;
                    llmViolations.Add(new ValidationViolationDto(code, message, "BLOCKER"));
                }

                var recommendation = recEl.GetString()!;
                var isValid = isValidEl.GetBoolean() && llmViolations.Count == 0;
                if (!isValid && llmViolations.Count == 0)
                    return null; // claimed invalid with no blockers: keep rules
                if (llmViolations.Count > 0 && recommendation == "APPROVE")
                    recommendation = "REJECT"; // coherence guard
                if (llmViolations.Count == 0)
                {
                    isValid = true;
                    if (recommendation is not ("APPROVE" or "REVISE"))
                        recommendation = "APPROVE";
                }

                string? insight = null;
                if (root.TryGetProperty("ai_insight", out var insightEl) && insightEl.ValueKind == JsonValueKind.String)
                {
                    var raw = insightEl.GetString() ?? string.Empty;
                    if (!string.IsNullOrWhiteSpace(raw))
                        insight = raw.Length > 500 ? raw[..500] : raw;
                }
                return (isValid, recommendation, llmViolations, insight);
            }
        }
        catch (Exception ex) when (cancellationToken.IsCancellationRequested == false)
        {
            // Any LLM failure (network, timeout, parse) falls back to rules.
            Console.WriteLine($"[ValidationSafetyAgent] Gemini verdict skipped: {ex.GetType().Name}. Rule result kept.");
            return null;
        }
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

        // ---- Gemini full verdict (hybrid: rules always run first) ----
        // Rules above are the safety ground truth. When GEMINI_API_KEY is set,
        // Gemini may supply the FINAL verdict; missing/invalid/failed responses
        // fall back to the deterministic result so the gate never blanks.
        var llmEnhanced = false;
        string? aiInsight = null;
        var geminiVerdict = await TryGetGeminiVerdictAsync(
            dispatch.Id, isValid, recommendation,
            violations.Select(v => v.Code).ToList(),
            warnings.Select(w => w.Code).ToList(),
            checks.Count);
        if (geminiVerdict is { } llm)
        {
            violations = llm.Violations;
            isValid = llm.IsValid;
            recommendation = llm.Recommendation;
            aiInsight = llm.AiInsight;
            llmEnhanced = true;
            checks.Add(new ValidationCheckDto(
                "gemini_verdict", true,
                $"Gemini {GeminiModel} final verdict: {recommendation}."));
        }
        else if (!string.IsNullOrWhiteSpace(GetGeminiKey()))
        {
            checks.Add(new ValidationCheckDto(
                "gemini_verdict", false,
                "Gemini verdict unavailable - deterministic rule result kept."));
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
            LlmEnhanced = llmEnhanced,
            AiInsight = aiInsight,
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
            if (llmEnhanced)
                summary = "[LLM ENHANCED] " + summary;
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
            audit.ValidatedBy,
            llmEnhanced,
            aiInsight
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
            a.ValidatedAt,
            a.LlmEnhanced,
            a.AiInsight
        )).ToList();
    }
}
