using System.Security.Claims;
using System.Text.Json;
using ERCP.Api.Data;
using ERCP.Api.DTOs;
using ERCP.Api.Models;
using ERCP.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ERCP.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class IncidentController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IncidentPlannerService _plannerService;
    private readonly IEmailService _emailService;
    private readonly ILogger<IncidentController> _logger;

    public IncidentController(
        AppDbContext context,
        IncidentPlannerService plannerService,
        IEmailService emailService,
        ILogger<IncidentController> logger)
    {
        _context = context;
        _plannerService = plannerService;
        _emailService = emailService;
        _logger = logger;
    }

    // GET: api/incident
    [HttpGet]
    [Authorize(Roles = "Citizen,Coordinator,Admin,Volunteer")]
    public async Task<ActionResult<IEnumerable<IncidentResponseDto>>> GetIncidents(
        [FromQuery] string? status,
        [FromQuery] string? priority,
        [FromQuery] string? category,
        [FromQuery] string? search,
        [FromQuery] bool? myOnly)
    {
        var query = _context.Incidents
            .Include(i => i.Plans)
            .AsQueryable();

        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value
            ?? User.FindFirst("email")?.Value
            ?? User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
        var isCitizen = User.IsInRole("Citizen")
            || User.FindFirst(ClaimTypes.Role)?.Value == "Citizen"
            || User.FindFirst("role")?.Value == "Citizen";

        // Citizens see their own reported incidents by default; others can request myOnly=true
        if ((isCitizen && myOnly != false) || myOnly == true)
        {
            if (!string.IsNullOrWhiteSpace(userEmail))
            {
                var emailLower = userEmail.Trim().ToLower();
                query = query.Where(i => i.ReporterContact.ToLower().Contains(emailLower));
            }
            else
            {
                // Fallback: If citizen account has no email claim, return empty (never leak other users' incidents)
                query = query.Where(i => false);
            }
        }

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(i => i.Status.ToLower() == status.ToLower());

        if (!string.IsNullOrWhiteSpace(priority))
            query = query.Where(i => i.Priority.ToLower() == priority.ToLower());

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(i => i.Category.ToLower() == category.ToLower());

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(i =>
                i.Title.ToLower().Contains(term) ||
                i.Description.ToLower().Contains(term) ||
                i.Location.ToLower().Contains(term) ||
                i.Category.ToLower().Contains(term));
        }

        var incidents = await query
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => MapToResponseDto(i))
            .ToListAsync();

        return Ok(incidents);
    }

    // GET: api/incident/stats/summary
    [HttpGet("stats/summary")]
    [Authorize(Roles = "Citizen,Coordinator,Admin,Volunteer")]
    public async Task<ActionResult<IncidentSummaryStatsDto>> GetSummaryStats([FromQuery] bool? myOnly)
    {
        var query = _context.Incidents.Include(i => i.Plans).AsQueryable();

        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value
            ?? User.FindFirst("email")?.Value
            ?? User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
        var isCitizen = User.IsInRole("Citizen")
            || User.FindFirst(ClaimTypes.Role)?.Value == "Citizen"
            || User.FindFirst("role")?.Value == "Citizen";

        if ((isCitizen && myOnly != false) || myOnly == true)
        {
            if (!string.IsNullOrWhiteSpace(userEmail))
            {
                var emailLower = userEmail.Trim().ToLower();
                query = query.Where(i => i.ReporterContact.ToLower().Contains(emailLower));
            }
            else
            {
                query = query.Where(i => false);
            }
        }

        var all = await query.ToListAsync();

        var stats = new IncidentSummaryStatsDto
        {
            TotalIncidents = all.Count,
            ActiveIncidents = all.Count(i => i.Status != "Resolved" && i.Status != "Closed"),
            CriticalIncidents = all.Count(i => i.Priority == "Critical"),
            ResolvedIncidents = all.Count(i => i.Status == "Resolved" || i.Status == "Closed"),
            GeneratedPlansCount = await _context.IncidentPlans.CountAsync(),
            IncidentsByCategory = all.GroupBy(i => string.IsNullOrWhiteSpace(i.Category) ? "General" : i.Category)
                .ToDictionary(g => g.Key, g => g.Count()),
            IncidentsByPriority = all.GroupBy(i => string.IsNullOrWhiteSpace(i.Priority) ? "Medium" : i.Priority)
                .ToDictionary(g => g.Key, g => g.Count())
        };

        return Ok(stats);
    }

    // GET: api/incident/1
    [HttpGet("{id}")]
    [Authorize(Roles = "Citizen,Coordinator,Admin,Volunteer")]
    public async Task<ActionResult<IncidentDetailDto>> GetIncident(int id)
    {
        var incident = await _context.Incidents
            .Include(i => i.Plans)
            .Include(i => i.TimelineEvents)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (incident == null)
            return NotFound();

        var detail = new IncidentDetailDto
        {
            Id = incident.Id,
            Title = incident.Title,
            Description = incident.Description,
            Location = incident.Location,
            Category = incident.Category,
            Status = incident.Status,
            Priority = incident.Priority,
            AffectedCount = incident.AffectedCount,
            ReporterContact = incident.ReporterContact,
            Latitude = incident.Latitude,
            Longitude = incident.Longitude,
            AssignedCoordinator = incident.AssignedCoordinator,
            CreatedAt = incident.CreatedAt,
            UpdatedAt = incident.UpdatedAt,
            PlanCount = incident.Plans.Count,
            Plans = incident.Plans.OrderByDescending(p => p.CreatedAt).Select(MapToPlanDto).ToList(),
            TimelineEvents = incident.TimelineEvents.OrderByDescending(e => e.Timestamp).Select(MapToTimelineDto).ToList()
        };

        return Ok(detail);
    }

    // POST: api/incident
    [HttpPost]
    [Authorize(Roles = "Citizen,Coordinator,Admin,Volunteer")]
    public async Task<ActionResult<IncidentDetailDto>> CreateIncident([FromBody] CreateIncidentDto dto)
    {
        var userEmail = User?.FindFirst(ClaimTypes.Email)?.Value
            ?? User?.FindFirst("email")?.Value
            ?? User?.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
        var reporter = string.IsNullOrWhiteSpace(dto.ReporterContact)
            ? (userEmail ?? "Community Reporter")
            : dto.ReporterContact;

        var incident = new Incident
        {
            Title = dto.Title,
            Description = dto.Description,
            Location = dto.Location,
            Category = string.IsNullOrWhiteSpace(dto.Category) ? "General Emergency" : dto.Category,
            Priority = string.IsNullOrWhiteSpace(dto.Priority) ? "Medium" : dto.Priority,
            AffectedCount = dto.AffectedCount,
            ReporterContact = reporter,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            Status = "Reported",
            AssignedCoordinator = "AI Coordinator",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Incidents.Add(incident);
        await _context.SaveChangesAsync();

        // Log initial creation timeline event
        var creationEvent = new IncidentTimelineEvent
        {
            IncidentId = incident.Id,
            EventType = "Created",
            Title = "Incident Reported",
            Description = $"Incident '{incident.Title}' registered with {incident.Priority} priority in category {incident.Category}.",
            CreatedBy = string.IsNullOrWhiteSpace(dto.ReporterContact) ? "Citizen Report" : dto.ReporterContact,
            Timestamp = DateTime.UtcNow
        };
        _context.IncidentTimelineEvents.Add(creationEvent);

        // Auto-generate AI Response Plan if requested
        if (dto.AutoGeneratePlan)
        {
            var plan = _plannerService.GeneratePlan(incident);
            _context.IncidentPlans.Add(plan);

            var planEvent = new IncidentTimelineEvent
            {
                IncidentId = incident.Id,
                EventType = "PlanGenerated",
                Title = "AI Response Plan Generated",
                Description = $"Coordinator Agent generated response plan: '{plan.PlanTitle}'.",
                CreatedBy = "AI Coordinator Agent",
                Timestamp = DateTime.UtcNow
            };
            _context.IncidentTimelineEvents.Add(planEvent);
        }

        await _context.SaveChangesAsync();

        // Send Email Notification (Fire and Forget)
        _ = Task.Run(async () =>
        {
            try
            {
                var subject = $"🚨 CRITICAL EMERGENCY REPORTED: {incident.Title}";
                var htmlBody = $@"
                    <h2>New Emergency Reported</h2>
                    <p><strong>Title:</strong> {incident.Title}</p>
                    <p><strong>Category:</strong> {incident.Category}</p>
                    <p><strong>Priority:</strong> {incident.Priority}</p>
                    <p><strong>Location:</strong> {incident.Location}</p>
                    <p><strong>Description:</strong> {incident.Description}</p>
                    <p><strong>Reporter Contact:</strong> {incident.ReporterContact}</p>
                    <hr/>
                    <p>Log in to the Command Center to dispatch resources.</p>
                ";

                // Send to Admin
                await _emailService.SendEmailAsync("admin@ercp.org", subject, htmlBody);

                // Send to Reporter if they provided a valid email format
                if (incident.ReporterContact.Contains("@"))
                {
                    var reporterSubject = "✅ Emergency Report Received";
                    var reporterHtml = $@"
                        <h2>Your report has been received</h2>
                        <p>Thank you for reporting the incident: <strong>{incident.Title}</strong>.</p>
                        <p>Authorities have been notified and resources will be dispatched if necessary.</p>
                        <p>Stay safe!</p>
                    ";
                    await _emailService.SendEmailAsync(incident.ReporterContact, reporterSubject, reporterHtml);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background email sending failed in CreateIncident.");
            }
        });

        return CreatedAtAction(nameof(GetIncident), new { id = incident.Id }, await GetIncidentDetailObj(incident.Id));
    }

    // PUT: api/incident/1
    [HttpPut("{id}")]
    [Authorize(Roles = "Coordinator,Admin")]
    public async Task<IActionResult> UpdateIncident(int id, [FromBody] UpdateIncidentDto dto)
    {
        var incident = await _context.Incidents.FindAsync(id);
        if (incident == null)
            return NotFound();

        var changes = new List<string>();

        if (!string.IsNullOrWhiteSpace(dto.Status) && !string.Equals(dto.Status, incident.Status, StringComparison.OrdinalIgnoreCase))
        {
            if (!IsValidStatusTransition(incident.Status, dto.Status, out var errorMessage))
            {
                return BadRequest(new { message = errorMessage });
            }

            changes.Add($"Status changed from '{incident.Status}' to '{dto.Status}'");
            incident.Status = dto.Status;
        }

        if (!string.IsNullOrWhiteSpace(dto.Priority) && dto.Priority != incident.Priority)
        {
            changes.Add($"Priority changed from '{incident.Priority}' to '{dto.Priority}'");
            incident.Priority = dto.Priority;
        }

        if (!string.IsNullOrWhiteSpace(dto.Category) && dto.Category != incident.Category)
        {
            changes.Add($"Category changed to '{dto.Category}'");
            incident.Category = dto.Category;
        }

        if (dto.AffectedCount.HasValue && dto.AffectedCount.Value != incident.AffectedCount)
        {
            changes.Add($"Affected individuals count updated to {dto.AffectedCount.Value}");
            incident.AffectedCount = dto.AffectedCount.Value;
        }

        if (!string.IsNullOrWhiteSpace(dto.AssignedCoordinator) && dto.AssignedCoordinator != incident.AssignedCoordinator)
        {
            changes.Add($"Assigned Coordinator updated to '{dto.AssignedCoordinator}'");
            incident.AssignedCoordinator = dto.AssignedCoordinator;
        }

        incident.UpdatedAt = DateTime.UtcNow;

        if (changes.Count > 0 || !string.IsNullOrWhiteSpace(dto.Note))
        {
            var desc = changes.Count > 0 ? string.Join("; ", changes) : "";
            if (!string.IsNullOrWhiteSpace(dto.Note))
            {
                desc += string.IsNullOrEmpty(desc) ? dto.Note : $" | Note: {dto.Note}";
            }

            var eventType = "StatusUpdate";
            var eventTitle = "Incident Details Updated";

            if (!string.IsNullOrWhiteSpace(dto.Status))
            {
                eventTitle = dto.Status switch
                {
                    "Verified" => "Incident Verified",
                    "Assigned" or "Dispatched" => "Incident Assigned",
                    "Resolved" => "Incident Resolved",
                    "Closed" => "Incident Closed",
                    _ => $"Incident Status Updated ({dto.Status})"
                };
            }
            else if (!string.IsNullOrWhiteSpace(dto.Priority))
            {
                eventType = "PriorityChanged";
                eventTitle = $"Priority Changed to {dto.Priority}";
            }

            var timelineEvent = new IncidentTimelineEvent
            {
                IncidentId = incident.Id,
                EventType = eventType,
                Title = eventTitle,
                Description = desc,
                CreatedBy = dto.AssignedCoordinator ?? "Dispatcher",
                Timestamp = DateTime.UtcNow
            };
            _context.IncidentTimelineEvents.Add(timelineEvent);
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE: api/incident/1
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> DeleteIncident(int id)
    {
        var incident = await _context.Incidents.FindAsync(id);
        if (incident == null)
            return NotFound();

        _context.Incidents.Remove(incident);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // POST: api/incident/1/plan or api/incident/1/generate-plan
    [HttpPost("{id}/plan")]
    [HttpPost("{id}/generate-plan")]
    [Authorize(Roles = "Coordinator,Admin")]
    public async Task<ActionResult<IncidentPlanDto>> GeneratePlan(int id, [FromBody] GeneratePlanRequestDto? request)
    {
        var incident = await _context.Incidents.FindAsync(id);
        if (incident == null)
            return NotFound();

        var plan = _plannerService.GeneratePlan(
            incident,
            request?.CustomDirectives,
            request?.FocusPhase);

        _context.IncidentPlans.Add(plan);

        var timelineEvent = new IncidentTimelineEvent
        {
            IncidentId = incident.Id,
            EventType = "PlanGenerated",
            Title = "AI Coordinator Plan Generated",
            Description = $"New tactical plan generated: '{plan.PlanTitle}' ({plan.Phase}).",
            CreatedBy = "AI Coordinator Agent",
            Timestamp = DateTime.UtcNow
        };
        _context.IncidentTimelineEvents.Add(timelineEvent);

        if (incident.Status == "Reported")
        {
            incident.Status = "Active Planning";
            incident.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Ok(MapToPlanDto(plan));
    }

    // GET: api/incident/1/plan or api/incident/1/plans
    [HttpGet("{id}/plan")]
    [HttpGet("{id}/plans")]
    [Authorize(Roles = "Citizen,Coordinator,Admin,Volunteer")]
    public async Task<ActionResult<IEnumerable<IncidentPlanDto>>> GetPlans(int id)
    {
        var incidentExists = await _context.Incidents.AnyAsync(i => i.Id == id);
        if (!incidentExists)
            return NotFound();

        var plans = await _context.IncidentPlans
            .Where(p => p.IncidentId == id)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(plans.Select(MapToPlanDto));
    }

    // PUT: api/incident/plans/5/status
    [HttpPut("plans/{planId}/status")]
    [Authorize(Roles = "Coordinator,Admin")]
    public async Task<IActionResult> UpdatePlanStatus(int planId, [FromBody] UpdatePlanStatusDto dto)
    {
        var plan = await _context.IncidentPlans.FindAsync(planId);
        if (plan == null)
            return NotFound();

        plan.Status = dto.Status;
        if (dto.Status == "Approved" || dto.Status == "InExecution")
        {
            plan.ApprovedBy = string.IsNullOrWhiteSpace(dto.ApprovedBy) ? "Command Center Admin" : dto.ApprovedBy;
            plan.ApprovedAt = DateTime.UtcNow;

            // Also update parent incident status if applicable
            var parent = await _context.Incidents.FindAsync(plan.IncidentId);
            if (parent != null)
            {
                parent.Status = dto.Status == "InExecution" ? "Dispatched" : "Active Planning";
                parent.UpdatedAt = DateTime.UtcNow;
            }
        }

        var timelineEvent = new IncidentTimelineEvent
        {
            IncidentId = plan.IncidentId,
            EventType = "PlanStatusUpdate",
            Title = $"Plan Status: {dto.Status}",
            Description = $"Response Plan '{plan.PlanTitle}' status set to {dto.Status}.",
            CreatedBy = string.IsNullOrWhiteSpace(dto.ApprovedBy) ? "Coordinator" : dto.ApprovedBy,
            Timestamp = DateTime.UtcNow
        };
        _context.IncidentTimelineEvents.Add(timelineEvent);

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // GET: api/incident/1/timeline
    [HttpGet("{id}/timeline")]
    [Authorize(Roles = "Citizen,Coordinator,Admin,Volunteer")]
    public async Task<ActionResult<IEnumerable<IncidentTimelineEventDto>>> GetTimeline(int id)
    {
        var incidentExists = await _context.Incidents.AnyAsync(i => i.Id == id);
        if (!incidentExists)
            return NotFound(new { message = $"Incident with ID {id} was not found." });

        var events = await _context.IncidentTimelineEvents
            .Where(e => e.IncidentId == id)
            .OrderBy(e => e.Timestamp) // Chronological order
            .ToListAsync();

        return Ok(events.Select(MapToTimelineDto));
    }

    // POST: api/incident/1/timeline
    [HttpPost("{id}/timeline")]
    [Authorize(Roles = "Coordinator,Admin")]
    public async Task<ActionResult<IncidentTimelineEventDto>> AddTimelineEvent(int id, [FromBody] AddTimelineEventDto dto)
    {
        var incident = await _context.Incidents.FindAsync(id);
        if (incident == null)
            return NotFound(new { message = $"Incident with ID {id} was not found." });

        // Safety constraint: Prevent manual note posts from forging system lifecycle event types
        var reservedTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "Created", "StatusUpdate", "PlanGenerated" };
        var eventType = (string.IsNullOrWhiteSpace(dto.EventType) || reservedTypes.Contains(dto.EventType.Trim()))
            ? "NoteAdded"
            : dto.EventType.Trim();

        var evt = new IncidentTimelineEvent
        {
            IncidentId = id,
            EventType = eventType,
            Title = string.IsNullOrWhiteSpace(dto.Title) ? "Dispatcher Note Added" : dto.Title,
            Description = dto.Description,
            CreatedBy = string.IsNullOrWhiteSpace(dto.CreatedBy) ? "Dispatcher" : dto.CreatedBy,
            Timestamp = DateTime.UtcNow
        };

        _context.IncidentTimelineEvents.Add(evt);
        await _context.SaveChangesAsync();

        return Ok(MapToTimelineDto(evt));
    }

    // Helper methods
    private async Task<IncidentDetailDto> GetIncidentDetailObj(int id)
    {
        var incident = await _context.Incidents
            .Include(i => i.Plans)
            .Include(i => i.TimelineEvents)
            .FirstAsync(i => i.Id == id);

        return new IncidentDetailDto
        {
            Id = incident.Id,
            Title = incident.Title,
            Description = incident.Description,
            Location = incident.Location,
            Category = incident.Category,
            Status = incident.Status,
            Priority = incident.Priority,
            AffectedCount = incident.AffectedCount,
            ReporterContact = incident.ReporterContact,
            Latitude = incident.Latitude,
            Longitude = incident.Longitude,
            AssignedCoordinator = incident.AssignedCoordinator,
            CreatedAt = incident.CreatedAt,
            UpdatedAt = incident.UpdatedAt,
            PlanCount = incident.Plans.Count,
            Plans = incident.Plans.OrderByDescending(p => p.CreatedAt).Select(MapToPlanDto).ToList(),
            TimelineEvents = incident.TimelineEvents.OrderByDescending(e => e.Timestamp).Select(MapToTimelineDto).ToList()
        };
    }

    private static IncidentResponseDto MapToResponseDto(Incident i)
    {
        return new IncidentResponseDto
        {
            Id = i.Id,
            Title = i.Title,
            Description = i.Description,
            Location = i.Location,
            Category = i.Category,
            Status = i.Status,
            Priority = i.Priority,
            AffectedCount = i.AffectedCount,
            ReporterContact = i.ReporterContact,
            Latitude = i.Latitude,
            Longitude = i.Longitude,
            AssignedCoordinator = i.AssignedCoordinator,
            CreatedAt = i.CreatedAt,
            UpdatedAt = i.UpdatedAt,
            PlanCount = i.Plans.Count
        };
    }

    private static IncidentPlanDto MapToPlanDto(IncidentPlan p)
    {
        List<PlanActionStepDto> steps;
        try
        {
            steps = JsonSerializer.Deserialize<List<PlanActionStepDto>>(p.ActionStepsJson ?? "[]") ?? new();
        }
        catch
        {
            steps = new List<PlanActionStepDto>();
        }

        List<EstimatedResourceDto> resources;
        try
        {
            resources = JsonSerializer.Deserialize<List<EstimatedResourceDto>>(p.EstimatedResourcesJson ?? "[]") ?? new();
        }
        catch
        {
            resources = new List<EstimatedResourceDto>();
        }

        return new IncidentPlanDto
        {
            Id = p.Id,
            IncidentId = p.IncidentId,
            PlanTitle = p.PlanTitle,
            PlanDescription = p.PlanDescription,
            Status = p.Status,
            Phase = p.Phase,
            ActionSteps = steps,
            EstimatedResources = resources,
            RiskAssessment = p.RiskAssessment,
            ApprovedBy = p.ApprovedBy,
            ApprovedAt = p.ApprovedAt,
            CreatedAt = p.CreatedAt
        };
    }

    private static IncidentTimelineEventDto MapToTimelineDto(IncidentTimelineEvent e)
    {
        return new IncidentTimelineEventDto
        {
            Id = e.Id,
            IncidentId = e.IncidentId,
            EventType = e.EventType,
            Title = e.Title,
            Description = e.Description,
            CreatedBy = e.CreatedBy,
            Timestamp = e.Timestamp
        };
    }

    private static bool IsValidStatusTransition(string currentStatus, string newStatus, out string errorMessage)
    {
        errorMessage = string.Empty;
        var current = currentStatus?.Trim() ?? "";
        var target = newStatus?.Trim() ?? "";

        if (string.Equals(current, target, StringComparison.OrdinalIgnoreCase))
            return true;

        var validStatuses = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Reported", "Verified", "Active Planning", "Assigned", "Dispatched", "Resolved", "Closed"
        };

        if (!validStatuses.Contains(target))
        {
            errorMessage = $"Invalid status '{newStatus}'. Allowed status values are: Reported, Verified, Assigned, Resolved, Closed.";
            return false;
        }

        bool isValid = current.ToLowerInvariant() switch
        {
            "reported" => target.Equals("Verified", StringComparison.OrdinalIgnoreCase) ||
                          target.Equals("Active Planning", StringComparison.OrdinalIgnoreCase),
            "verified" or "active planning" => target.Equals("Assigned", StringComparison.OrdinalIgnoreCase) ||
                                               target.Equals("Dispatched", StringComparison.OrdinalIgnoreCase) ||
                                               target.Equals("Verified", StringComparison.OrdinalIgnoreCase),
            "assigned" or "dispatched" => target.Equals("Resolved", StringComparison.OrdinalIgnoreCase),
            "resolved" => target.Equals("Closed", StringComparison.OrdinalIgnoreCase),
            _ => false
        };

        if (!isValid)
        {
            errorMessage = $"Invalid status transition from '{currentStatus}' to '{newStatus}'. Allowed workflow sequence: Reported -> Verified -> Assigned -> Resolved.";
        }

        return isValid;
    }
}