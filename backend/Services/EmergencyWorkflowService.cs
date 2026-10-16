using System.Diagnostics;
using System.Text.Json;
using ERCP.Api.Data;
using ERCP.Api.DTOs;
using ERCP.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ERCP.Api.Services;

public class EmergencyWorkflowService
{
    private readonly AppDbContext _db;
    private readonly IncidentPlannerService _planner;
    private readonly DispatchValidationService _validation;
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmergencyWorkflowService> _logger;
    private IReadOnlyList<string> _situationTools = Array.Empty<string>();

    private static readonly string[] Steps =
    [
        "SituationAnalysisAgent", "CoordinatorPlannerAgent",
        "ResourceAllocationAgent", "ValidationSafetyAgent"
    ];

    public EmergencyWorkflowService(AppDbContext db, IncidentPlannerService planner,
        DispatchValidationService validation,
        IConfiguration configuration, ILogger<EmergencyWorkflowService> logger)
    {
        _db = db;
        _planner = planner;
        _validation = validation;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<WorkflowExecution> StartAsync(int incidentId, int? existingDispatchId = null,
        CancellationToken cancellationToken = default)
    {
        var incident = await _db.Incidents.FindAsync([incidentId], cancellationToken)
            ?? throw new KeyNotFoundException($"Incident {incidentId} was not found.");
        Dispatch? existingDispatch = null;
        if (existingDispatchId.HasValue)
        {
            existingDispatch = await _db.Dispatches.Include(d => d.Tasks)
                .FirstOrDefaultAsync(d => d.Id == existingDispatchId.Value, cancellationToken);
            if (existingDispatch == null || existingDispatch.IncidentId != incidentId)
                throw new KeyNotFoundException("Dispatch was not found for this incident.");
            if (existingDispatch.Status is not ("Proposed" or "PendingApproval"))
                throw new InvalidOperationException("Only a proposed dispatch can be reallocated.");
        }

        var run = new WorkflowExecution
        {
            IncidentId = incidentId,
            Objective = $"Respond to {incident.Category} incident #{incidentId}: {incident.Title}. " +
                "Assess urgency, plan resources, validate the proposal, and request coordinator approval.",
            PlanJson = JsonSerializer.Serialize(new object[]
            {
                new { step = 1, agent = Steps[0], input = "Incident and live resource, inventory, shelter snapshot",
                    output = "Persisted situation assessment", tools = new[] { "calculate_urgency_score",
                        "evaluate_inventory_deficiencies", "find_nearest_available_shelter" } },
                new { step = 2, agent = Steps[1], input = "Incident, situation assessment, live operational snapshot",
                    output = "Structured tactical plan and resource requirements",
                    tools = new[] { "get_incident", "get_available_resources", "get_available_volunteers",
                        "get_nearby_shelters", "create_response_plan" } },
                new { step = 3, agent = Steps[2], input = "Assessment, plan requirements and available resources",
                    output = "Pending resource, volunteer and evacuation shelter proposal",
                    tools = new[] { "check_resource_coverage", "propose_task_assignment" } },
                new { step = 4, agent = Steps[3], input = "Proposed dispatch and live safety snapshot",
                    output = "Deterministic safety verdict", requiresApproval = true,
                    tools = new[] { "check_volunteer_availability", "check_shift_overlap",
                        "check_shelter_capacity", "check_resource_stock" } }
            })
        };
        _db.WorkflowExecutions.Add(run);
        await _db.SaveChangesAsync(cancellationToken);

        var completed = new List<string>();
        var toolResults = new List<object>();
        try
        {
            var situationStarted = Stopwatch.StartNew();
            var assessment = await AssessWithPythonAsync(incident, cancellationToken);
            situationStarted.Stop();
            completed.Add(Steps[0]);
            toolResults.Add(new { agent = Steps[0], assessmentId = assessment.Id,
                urgencyScore = assessment.UrgencyScore, assessment.NearestShelterId,
                tools = _situationTools,
                durationMs = situationStarted.ElapsedMilliseconds, attempts = 1 });
            await CheckpointAsync(run, completed, toolResults, cancellationToken);

            var planningStarted = Stopwatch.StartNew();
            var plan = _planner.GeneratePlan(incident, assessment: assessment, requirePython: true);
            using (var actions = JsonDocument.Parse(plan.ActionStepsJson))
            {
                if (actions.RootElement.ValueKind != JsonValueKind.Array ||
                    actions.RootElement.GetArrayLength() == 0 || !plan.RequiresHumanApproval ||
                    string.IsNullOrWhiteSpace(plan.PlanTitle))
                    throw new InvalidOperationException("Planner output failed the required structured plan checks.");
            }
            _db.IncidentPlans.Add(plan);
            await _db.SaveChangesAsync(cancellationToken);
            run.IncidentPlanId = plan.Id;
            planningStarted.Stop();
            completed.Add(Steps[1]);
            toolResults.Add(new { agent = Steps[1], inputAssessmentId = assessment.Id,
                planId = plan.Id, planTitle = plan.PlanTitle,
                tools = _planner.LastAgentTools,
                durationMs = planningStarted.ElapsedMilliseconds, attempts = 1 });
            await CheckpointAsync(run, completed, toolResults, cancellationToken);

            var allocationStarted = Stopwatch.StartNew();
            var allocation = await AllocateAsync(incident, plan, assessment, cancellationToken);
            using var allocationDoc = JsonDocument.Parse(allocation);
            var root = allocationDoc.RootElement;
            if (!root.TryGetProperty("incident_id", out var outputIncident) ||
                outputIncident.GetInt32() != incidentId ||
                !root.TryGetProperty("plan_id", out var outputPlan) ||
                outputPlan.GetInt32() != plan.Id ||
                !root.TryGetProperty("situation_assessment_id", out var outputAssessment) ||
                outputAssessment.GetInt32() != assessment.Id ||
                !root.TryGetProperty("status", out var outputStatus) ||
                outputStatus.GetString() != "COMPLETED" ||
                !root.TryGetProperty("allocation_plan", out var proposal) ||
                !proposal.TryGetProperty("requires_human_approval", out var approval) ||
                !approval.GetBoolean())
                throw new InvalidOperationException("Allocation output failed schema or incident validation.");

            var resourceIds = proposal.GetProperty("assigned_resources").EnumerateArray()
                .Select(item => item.GetProperty("id").GetInt32())
                .ToList();
            var volunteerIds = proposal.GetProperty("assigned_volunteers").EnumerateArray()
                .Select(item => Guid.TryParse(item.GetProperty("id").ToString(), out var id) ? id : Guid.Empty)
                .ToList();
            if (resourceIds.Any(id => id <= 0) || resourceIds.Distinct().Count() != resourceIds.Count ||
                volunteerIds.Any(id => id == Guid.Empty) ||
                volunteerIds.Distinct().Count() != volunteerIds.Count)
                throw new InvalidOperationException("Allocation contains invalid or duplicate assignments.");
            var gapCount = proposal.GetProperty("resource_gaps").GetArrayLength();
            var allocationTools = root.GetProperty("tool_calls").EnumerateArray()
                .Select(t => t.GetString() ?? string.Empty).ToList();
            var allowedAllocationTools = new HashSet<string>(StringComparer.Ordinal)
            {
                "get_available_resources", "get_available_volunteers",
                "check_resource_coverage", "propose_task_assignment"
            };
            if (allocationTools.Count == 0 || allocationTools.Any(t => !allowedAllocationTools.Contains(t)))
                throw new InvalidOperationException("Allocation agent reported an unauthorized tool.");
            var gapSummary = proposal.GetProperty("resource_gaps").EnumerateArray()
                .Select(g => new { kind = g.TryGetProperty("kind", out var kind) ? kind.GetString() : "Resource",
                    resourceType = g.GetProperty("resource_type").GetString(),
                    missing = g.TryGetProperty("missing", out var missing) ? missing.GetInt32() :
                        g.TryGetProperty("missing_qty", out var missingQty) ? missingQty.GetInt32() : 0 }).ToList();
            var shelterAllocations = proposal.GetProperty("shelter_allocations").EnumerateArray()
                .Select(s => new ShelterAllocationDto(s.GetProperty("shelter_id").GetInt32(),
                    s.GetProperty("incoming_count").GetInt32())).ToList();
            if (shelterAllocations.Count > 1 || shelterAllocations.Any(s =>
                    s.ShelterId != assessment.NearestShelterId || s.IncomingCount <= 0 ||
                    s.IncomingCount > incident.AffectedCount))
                throw new InvalidOperationException("Allocation contains an invalid shelter proposal.");
            var validResources = await _db.Resources
                .Where(r => resourceIds.Contains(r.Id) && r.Status == "Available")
                .ToDictionaryAsync(r => r.Id, cancellationToken);
            var validVolunteers = await _db.Volunteers
                .Where(v => volunteerIds.Contains(v.Id) && v.IsAvailable)
                .ToDictionaryAsync(v => v.Id, cancellationToken);
            if (validResources.Count != resourceIds.Count || validVolunteers.Count != volunteerIds.Count)
                throw new InvalidOperationException("Allocation references unavailable resources or volunteers.");
            allocationStarted.Stop();

            // The agent can only propose. ASP.NET Core creates the pending dispatch
            // from validated IDs; the Python process has no database credentials.
            var dispatch = existingDispatch ?? new Dispatch { IncidentId = incidentId };
            if (existingDispatch == null) _db.Dispatches.Add(dispatch);
            else _db.DispatchTasks.RemoveRange(existingDispatch.Tasks);
            dispatch.AllocationPlanId = plan.Id;
            dispatch.Priority = incident.Priority;
            dispatch.Status = "PendingApproval";
            dispatch.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            run.DispatchId = dispatch.Id;

            var unpairedResources = resourceIds.Select(id => validResources[id]).ToList();
            foreach (var volunteerId in volunteerIds)
            {
                var volunteer = validVolunteers[volunteerId];
                var matched = unpairedResources
                    .Where(r => !r.ResourceType.Equals("Personnel", StringComparison.OrdinalIgnoreCase))
                    .FirstOrDefault(r => CanUseResource(volunteer, r))
                    ?? unpairedResources.FirstOrDefault(r => CanUseResource(volunteer, r));
                if (matched != null) unpairedResources.Remove(matched);
                _db.DispatchTasks.Add(new DispatchTask
                {
                    DispatchId = dispatch.Id,
                    VolunteerId = volunteerId,
                    ResourceId = matched?.Id,
                    TaskType = matched == null ? "Emergency response" : $"{matched.ResourceType} response",
                    Status = "Proposed"
                });
            }
            gapCount += unpairedResources.Count;
            await _db.SaveChangesAsync(cancellationToken);
            completed.Add(Steps[2]);
            toolResults.Add(new { agent = Steps[2], dispatchId = dispatch.Id,
                inputPlanId = plan.Id, resourceIds, volunteerIds, gapCount, gapSummary,
                shelterAllocations,
                tools = allocationTools,
                durationMs = allocationStarted.ElapsedMilliseconds, attempts = 1 });
            await CheckpointAsync(run, completed, toolResults, cancellationToken);

            var safetyStarted = Stopwatch.StartNew();
            var pythonVerdict = await ValidateWithPythonAsync(dispatch, shelterAllocations, cancellationToken);
            var verdict = await _validation.ValidateDispatchAsync(dispatch.Id,
                new ValidateDispatchRequestDto(ShelterAllocations: shelterAllocations),
                validatedBy: "Workflow Safety Gate");
            safetyStarted.Stop();
            run.ValidationJson = JsonSerializer.Serialize(new { verdict.AuditId,
                verdict.IsValid, verdict.Recommendation, verdict.DurationMs,
                pythonRecommendation = pythonVerdict.Recommendation,
                pythonIsValid = pythonVerdict.IsValid,
                pythonCheckCount = pythonVerdict.CheckCount,
                shelterAllocations,
                allocationGapCount = gapCount,
                violationCodes = verdict.Violations.Select(v => v.Code),
                warningCodes = verdict.Warnings.Select(w => w.Code) });
            completed.Add(Steps[3]);
            toolResults.Add(new { agent = Steps[3], verdict.AuditId, verdict.Recommendation,
                pythonRecommendation = pythonVerdict.Recommendation, pythonVerdict.CheckCount,
                inputDispatchId = dispatch.Id, durationMs = safetyStarted.ElapsedMilliseconds, attempts = 1 });
            run.Status = verdict.Recommendation == "APPROVE" && pythonVerdict.Recommendation == "APPROVE" && gapCount == 0
                ? "AwaitingApproval" : "NeedsRevision";
            run.ApprovalStatus = "PendingApproval";
            await CheckpointAsync(run, completed, toolResults, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Workflow {WorkflowId} failed safely", run.Id);
            run.Status = "Failed";
            run.FinalOutcome = "No dispatch was authorized.";
            run.ErrorsJson = JsonSerializer.Serialize(new[] { new { code = "WORKFLOW_FAILURE", message = ex.Message } });
            run.CompletedAt = DateTime.UtcNow;
            await CheckpointAsync(run, completed, toolResults, cancellationToken);
        }
        return run;
    }

    private async Task CheckpointAsync(WorkflowExecution run, List<string> completed,
        List<object> toolResults, CancellationToken cancellationToken)
    {
        run.CompletedStepsJson = JsonSerializer.Serialize(completed);
        run.ToolResultsJson = JsonSerializer.Serialize(toolResults);
        run.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
    }

    private async Task<SituationAssessmentResponseDto> AssessWithPythonAsync(Incident incident,
        CancellationToken cancellationToken)
    {
        var inventory = await _db.InventoryItems.AsNoTracking().ToListAsync(cancellationToken);
        var resources = await _db.Resources.AsNoTracking().ToListAsync(cancellationToken);
        var shelters = await _db.Shelters.AsNoTracking().ToListAsync(cancellationToken);
        var payload = JsonSerializer.Serialize(new
        {
            incident = new { id = incident.Id, title = incident.Title, description = incident.Description,
                priority = incident.Priority, latitude = incident.Latitude, longitude = incident.Longitude },
            inventory = inventory.Select(i => new { category = i.Category, quantity = i.Quantity }),
            resources = resources.Select(r => new { resourceType = r.ResourceType, status = r.Status }),
            shelters = shelters.Select(s => new { id = s.Id, name = s.Name, status = s.Status,
                totalCapacity = s.TotalCapacity, currentOccupancy = s.CurrentOccupancy,
                latitude = s.Latitude, longitude = s.Longitude })
        });
        using var doc = JsonDocument.Parse(await RunAgentAsync("situation_analysis_agent.py", payload,
            cancellationToken));
        var root = doc.RootElement;
        if (root.GetProperty("agent_id").GetString() != "agent-situation-analysis-02" ||
            root.GetProperty("incident_id").GetInt32() != incident.Id ||
            root.GetProperty("status").GetString() != "COMPLETED")
            throw new InvalidOperationException("Situation agent output failed identity validation.");
        var situationTools = root.GetProperty("tool_calls").EnumerateArray()
            .Select(t => t.GetString() ?? string.Empty).ToList();
        var allowedSituationTools = new HashSet<string>(StringComparer.Ordinal)
        {
            "calculate_urgency_score", "evaluate_inventory_deficiencies", "find_nearest_available_shelter"
        };
        if (situationTools.Count != 3 || situationTools.Any(t => !allowedSituationTools.Contains(t)))
            throw new InvalidOperationException("Situation agent reported an unauthorized tool.");
        _situationTools = situationTools;
        var score = root.GetProperty("urgency_score").GetInt32();
        var level = root.GetProperty("urgency_level").GetString();
        var expectedLevel = score switch { >= 85 => "Critical", >= 65 => "High", >= 40 => "Medium", _ => "Low" };
        if (score is < 0 or > 100 || level != expectedLevel)
            throw new InvalidOperationException("Situation agent output failed urgency validation.");
        var summary = root.GetProperty("analysis_summary").GetString();
        if (string.IsNullOrWhiteSpace(summary) || summary.Length > 2000)
            throw new InvalidOperationException("Situation agent output failed summary validation.");
        var deficiencies = root.GetProperty("resource_deficiencies").EnumerateArray()
            .Select(d => new ResourceDeficiencyDto
            {
                Category = d.GetProperty("category").GetString() ?? string.Empty,
                Available = d.GetProperty("available").GetInt32(),
                Recommended = d.GetProperty("recommended").GetInt32(),
                IsDeficit = d.GetProperty("isDeficit").GetBoolean()
            }).ToList();
        if (deficiencies.Count > 20 || deficiencies.Any(d => d.Available < 0 || d.Recommended < 0))
            throw new InvalidOperationException("Situation agent output failed deficiency validation.");
        int? shelterId = null;
        if (root.TryGetProperty("nearest_shelter", out var shelterResult) &&
            shelterResult.ValueKind == JsonValueKind.Object)
        {
            shelterId = shelterResult.GetProperty("id").GetInt32();
            if (!shelters.Any(s => s.Id == shelterId && s.Status == "Active" &&
                s.TotalCapacity > s.CurrentOccupancy))
                throw new InvalidOperationException("Situation agent selected an unavailable shelter.");
        }
        var assessment = new SituationAssessment
        {
            IncidentId = incident.Id,
            UrgencyScore = score,
            UrgencyLevel = level!,
            AnalysisSummary = summary,
            RecommendedResourceTypes = string.Join(", ", deficiencies.Where(d => d.IsDeficit)
                .Select(d => d.Category)),
            NearestShelterId = shelterId,
            ResourceDeficiencyJson = JsonSerializer.Serialize(deficiencies)
        };
        _db.SituationAssessments.Add(assessment);
        await _db.SaveChangesAsync(cancellationToken);
        var selected = shelters.FirstOrDefault(s => s.Id == shelterId);
        return new SituationAssessmentResponseDto
        {
            Id = assessment.Id, IncidentId = incident.Id, IncidentTitle = incident.Title,
            IncidentLocation = incident.Location, UrgencyScore = score, UrgencyLevel = level!,
            AnalysisSummary = summary, RecommendedResourceTypes = assessment.RecommendedResourceTypes,
            NearestShelterId = shelterId, NearestShelterName = selected?.Name,
            AvailableShelterCapacity = selected == null ? 0 : selected.TotalCapacity - selected.CurrentOccupancy,
            ResourceDeficiencies = deficiencies, CreatedAt = assessment.CreatedAt
        };
    }

    private async Task<(bool IsValid, string Recommendation, int CheckCount)> ValidateWithPythonAsync(
        Dispatch dispatch, List<ShelterAllocationDto> shelterAllocations, CancellationToken cancellationToken)
    {
        var tasks = await _db.DispatchTasks.AsNoTracking()
            .Where(t => t.DispatchId == dispatch.Id).ToListAsync(cancellationToken);
        var volunteerIds = tasks.Select(t => t.VolunteerId).Distinct().ToList();
        var resourceIds = tasks.Where(t => t.ResourceId.HasValue)
            .Select(t => t.ResourceId!.Value).Distinct().ToList();
        var volunteers = await _db.Volunteers.AsNoTracking()
            .Where(v => volunteerIds.Contains(v.Id))
            .ToDictionaryAsync(v => v.Id, cancellationToken);
        var resources = await _db.Resources.AsNoTracking()
            .Where(r => resourceIds.Contains(r.Id))
            .ToDictionaryAsync(r => r.Id, cancellationToken);
        var shelterIds = shelterAllocations.Select(s => s.ShelterId).ToList();
        var shelters = await _db.Shelters.AsNoTracking()
            .Where(s => shelterIds.Contains(s.Id))
            .ToDictionaryAsync(s => s.Id, cancellationToken);
        var payload = JsonSerializer.Serialize(new
        {
            dispatch_id = dispatch.Id, incident_id = dispatch.IncidentId,
            assignments = tasks.Select(t => new
            {
                volunteer_id = t.VolunteerId.ToString(),
                volunteer_name = volunteers.TryGetValue(t.VolunteerId, out var v) ? v.Name : "Missing volunteer",
                is_available = volunteers.TryGetValue(t.VolunteerId, out v) && v.IsAvailable,
                skills = volunteers.TryGetValue(t.VolunteerId, out v) ? v.Skills : string.Empty,
                required_skill_any = t.ResourceId.HasValue && resources.TryGetValue(t.ResourceId.Value, out var assignedResource)
                    ? AcceptedSkills(assignedResource) : Array.Empty<string>()
            }),
            resource_requests = tasks.Where(t => t.ResourceId.HasValue).Select(t =>
            {
                var found = resources.TryGetValue(t.ResourceId!.Value, out var resource);
                return new { resource_id = t.ResourceId.Value, name = found ? resource!.Name : "Missing resource",
                    status = found ? resource!.Status : "Missing", requested_qty = 1,
                    available_qty = found ? 1 : 0 };
            }),
            shelter_allocations = shelterAllocations.Select(a =>
            {
                var found = shelters.TryGetValue(a.ShelterId, out var shelter);
                return new { shelter_id = a.ShelterId, name = found ? shelter!.Name : "Missing shelter",
                    status = found ? shelter!.Status : "Missing",
                    total_capacity = found ? shelter!.TotalCapacity : 0,
                    current_occupancy = found ? shelter!.CurrentOccupancy : 0,
                    incoming_count = a.IncomingCount };
            })
        });
        using var doc = JsonDocument.Parse(await RunAgentAsync("validation_safety_agent.py", payload,
            cancellationToken));
        var root = doc.RootElement;
        if (root.GetProperty("agent_id").GetString() != "agent-validation-safety-04" ||
            root.GetProperty("dispatch_id").GetInt32() != dispatch.Id ||
            root.GetProperty("incident_id").GetInt32() != dispatch.IncidentId ||
            root.GetProperty("status").GetString() != "COMPLETED")
            throw new InvalidOperationException("Safety agent output failed identity validation.");
        var valid = root.GetProperty("is_valid").GetBoolean();
        var recommendation = root.GetProperty("recommendation").GetString() ?? string.Empty;
        var violations = root.GetProperty("violations").GetArrayLength();
        var warnings = root.GetProperty("warnings").GetArrayLength();
        var checks = root.GetProperty("checks").GetArrayLength();
        var errors = root.GetProperty("errors").GetArrayLength();
        var allowedSafetyTools = new HashSet<string>(StringComparer.Ordinal)
        {
            "check_volunteer_availability", "check_shift_overlap",
            "check_shelter_capacity", "check_resource_stock"
        };
        if (root.GetProperty("checks").EnumerateArray().Any(c =>
                !allowedSafetyTools.Contains(c.GetProperty("tool").GetString() ?? string.Empty)))
            throw new InvalidOperationException("Safety agent reported an unauthorized tool.");
        if (recommendation is not ("APPROVE" or "REVISE" or "REJECT") ||
            valid != (violations == 0) || errors > 0 ||
            (recommendation == "APPROVE" && (!valid || warnings > 0 || checks == 0)))
            throw new InvalidOperationException("Safety agent output failed decision validation.");
        return (valid, recommendation, checks);
    }

    private static bool CanUseResource(Volunteer volunteer, Resource resource)
    {
        var skills = volunteer.Skills.ToLowerInvariant();
        return resource.ResourceType.ToLowerInvariant() switch
        {
            "medical" => new[] { "medical", "emt", "nurse", "paramedic", "first aid" }
                .Any(skills.Contains),
            "vehicle" => new[] { "driver", "driving", "transport", "logistics" }
                .Any(skills.Contains),
            _ => true
        };
    }

    private static string[] AcceptedSkills(Resource resource) => resource.ResourceType.ToLowerInvariant() switch
    {
        "medical" => ["medical", "emt", "nurse", "paramedic", "first aid"],
        "vehicle" => ["driver", "driving", "transport", "logistics"],
        _ => []
    };

    private async Task<string> AllocateAsync(Incident incident, IncidentPlan plan,
        SituationAssessmentResponseDto assessment, CancellationToken cancellationToken)
    {
        var resources = await _db.Resources.Where(r => r.Status == "Available")
            .OrderBy(r => r.Id).Take(100).ToListAsync(cancellationToken);
        var volunteers = await _db.Volunteers.Where(v => v.IsAvailable)
            .OrderBy(v => v.Id).Take(100).ToListAsync(cancellationToken);
        var required = new List<object>();
        using (var resourceDoc = JsonDocument.Parse(plan.EstimatedResourcesJson))
        {
            if (resourceDoc.RootElement.ValueKind == JsonValueKind.Array)
                foreach (var item in resourceDoc.RootElement.EnumerateArray())
                {
                    var type = item.TryGetProperty("ResourceType", out var pascal)
                        ? pascal.GetString() : item.TryGetProperty("resource_type", out var snake) ? snake.GetString() : null;
                    var quantity = item.TryGetProperty("Quantity", out var count)
                        ? count.GetInt32() : item.TryGetProperty("quantity", out var lower) ? lower.GetInt32() : 0;
                    if (!string.IsNullOrWhiteSpace(type) && quantity is > 0 and <= 100)
                        required.Add(new { resource_type = type, quantity, purpose = "Incident response" });
                }
        }
        if (required.Count == 0)
            throw new InvalidOperationException("Planner did not provide valid resource requirements.");
        var payload = JsonSerializer.Serialize(new
        {
            incident_id = incident.Id, title = incident.Title, description = incident.Description,
            category = incident.Category,
            plan_id = plan.Id, situation_assessment_id = assessment.Id,
            priority = assessment.UrgencyLevel, location = incident.Location, affected_count = incident.AffectedCount,
            nearest_shelter = assessment.NearestShelterId.HasValue
                ? new { id = assessment.NearestShelterId.Value, available_capacity = assessment.AvailableShelterCapacity }
                : null,
            required_resources = required,
            available_resources = resources.Select(r => new { id = r.Id, name = r.Name,
                resourceType = r.ResourceType, status = r.Status }),
            available_volunteers = volunteers.Select(v => new { id = v.Id.ToString(), name = v.Name,
                skill = v.Skills, isAvailable = v.IsAvailable })
        });
        return await RunAgentAsync("resource_allocation_agent.py", payload, cancellationToken, "allocate");
    }

    private async Task<string> RunAgentAsync(string scriptName, string payload,
        CancellationToken cancellationToken, string? task = null)
    {
        var script = _configuration["Agents:Directory"] is { Length: > 0 } configured
            ? Path.Combine(configured, scriptName)
            : FindAgentScript(scriptName);
        if (script == null || !File.Exists(script))
            throw new InvalidOperationException($"Agent {scriptName} is unavailable.");
        var start = new ProcessStartInfo
        {
            FileName = _configuration["Agents:PythonExecutable"] ?? (OperatingSystem.IsWindows() ? "py" : "python3"),
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            RedirectStandardInput = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        start.ArgumentList.Add(script);
        if (task != null)
        {
            start.ArgumentList.Add("--task");
            start.ArgumentList.Add(task);
        }
        start.ArgumentList.Add("--stdin");
        using var process = Process.Start(start)
            ?? throw new InvalidOperationException($"Agent {scriptName} could not start.");
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(TimeSpan.FromSeconds(15));
        var stdout = process.StandardOutput.ReadToEndAsync(timeout.Token);
        var stderr = process.StandardError.ReadToEndAsync(timeout.Token);
        try
        {
            await process.StandardInput.WriteAsync(payload.AsMemory(), timeout.Token);
            process.StandardInput.Close();
            await process.WaitForExitAsync(timeout.Token);
        }
        catch (OperationCanceledException)
        {
            if (!process.HasExited) process.Kill(entireProcessTree: true);
            throw new TimeoutException($"Agent {scriptName} timed out.");
        }
        var output = await stdout;
        if (process.ExitCode != 0 || string.IsNullOrWhiteSpace(output))
            throw new InvalidOperationException($"Agent {scriptName} failed: {(await stderr).Trim()}");
        return output;
    }

    private static string? FindAgentScript(string scriptName)
    {
        var directory = new DirectoryInfo(Directory.GetCurrentDirectory());
        for (var i = 0; directory != null && i < 6; i++, directory = directory.Parent)
        {
            var path = Path.Combine(directory.FullName, "ai-agents", scriptName);
            if (File.Exists(path)) return path;
        }
        return null;
    }
}
