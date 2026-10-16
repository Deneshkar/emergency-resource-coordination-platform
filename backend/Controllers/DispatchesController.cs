using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using ERCP.Api.Data;
using ERCP.Api.Models;
using ERCP.Api.DTOs;

namespace ERCP.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DispatchesController : ControllerBase
{
    private readonly AppDbContext _context;

    public DispatchesController(AppDbContext context)
    {
        _context = context;
    }

    // POST: api/Dispatches
    [HttpPost]
    [Authorize(Roles = "Coordinator,Admin")]
    public async Task<ActionResult<DispatchResponseDto>> Create(
        [FromBody] CreateDispatchDto dto)
    {
        var dispatch = new Dispatch
        {
            IncidentId = dto.IncidentId,
            Priority = dto.Priority,
            Status = "Proposed",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Dispatches.Add(dispatch);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = dispatch.Id },
            ToResponseDto(dispatch)
        );
    }

    // GET: api/Dispatches
    [HttpGet]
    public async Task<ActionResult<IEnumerable<DispatchResponseDto>>> GetAll()
    {
        var dispatches = await _context.Dispatches
            .Include(d => d.Tasks)
            .Include(d => d.AllocationPlan)
            .AsNoTracking()
            .ToListAsync();

        return Ok(dispatches.Select(ToResponseDto));
    }

    // GET: api/Dispatches/5
    [HttpGet("{id}")]
    public async Task<ActionResult<DispatchResponseDto>> GetById(int id)
    {
        var dispatch = await _context.Dispatches
            .Include(d => d.Tasks)
            .Include(d => d.AllocationPlan)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (dispatch == null)
        {
            return NotFound(new
            {
                message = "Dispatch not found."
            });
        }

        return Ok(ToResponseDto(dispatch));
    }

    // PUT: api/Dispatches/5/status
    [HttpPut("{id}/status")]
    [Authorize(Roles = "Coordinator,Admin")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        [FromBody] UpdateDispatchStatusDto dto)
    {
        var dispatch = await _context.Dispatches
            .FirstOrDefaultAsync(d => d.Id == id);

        if (dispatch == null)
        {
            return NotFound(new
            {
                message = "Dispatch not found."
            });
        }

        var allowedStatuses = new[]
        {
            "Proposed",
            "PendingApproval",
            "Approved",
            "Assigned",
            "InProgress",
            "Completed",
            "Rejected"
        };

        if (!allowedStatuses.Contains(dto.Status))
        {
            return BadRequest(new
            {
                message = "Invalid dispatch status."
            });
        }

        if (dto.Status == "Approved")
        {
            var workflow = await _context.WorkflowExecutions
                .Where(w => w.DispatchId == id)
                .OrderByDescending(w => w.StartedAt)
                .FirstOrDefaultAsync();
            if (workflow != null &&
                (workflow.Status != "AwaitingApproval" || workflow.ApprovalStatus != "PendingApproval"))
                return BadRequest(new { message = "Workflow proposal requires revision before approval." });

            var latestAudit = await _context.ValidationAudits
                .Where(a => a.DispatchId == id)
                .OrderByDescending(a => a.ValidatedAt)
                .ThenByDescending(a => a.Id)
                .FirstOrDefaultAsync();

            if (latestAudit == null || !latestAudit.IsValid || latestAudit.Recommendation != "APPROVE" ||
                latestAudit.ValidatedAt < dispatch.UpdatedAt)
            {
                return BadRequest(new
                {
                    message = "Dispatch approval requires a passing safety validation."
                });
            }

            if (workflow != null)
            {
                workflow.Status = "Completed";
                workflow.ApprovalStatus = "Approved";
                workflow.ApprovedBy = User?.Identity?.Name ?? "Coordinator";
                workflow.ApprovedAt = DateTime.UtcNow;
                workflow.CompletedAt = DateTime.UtcNow;
                workflow.FinalOutcome = "Dispatch approved by coordinator.";
            }
        }

        dispatch.Status = dto.Status;
        dispatch.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Dispatch status updated successfully.",
            status = dispatch.Status
        });
    }

    // POST: api/Dispatches/5/tasks
    [HttpPost("{id}/tasks")]
    [Authorize(Roles = "Coordinator,Admin")]
    public async Task<ActionResult> CreateTask(
        int id,
        [FromBody] CreateDispatchTaskDto dto)
    {
        var dispatch = await _context.Dispatches
            .FirstOrDefaultAsync(d => d.Id == id);

        if (dispatch == null)
        {
            return NotFound(new
            {
                message = "Dispatch not found."
            });
        }

        if (dispatch.Status is "Approved" or "Assigned" or "InProgress" or "Completed" or "Rejected")
        {
            return Conflict(new { message = "Tasks cannot be changed after dispatch approval." });
        }

        // Check that the volunteer exists
        var volunteerExists = await _context.Volunteers
            .AnyAsync(v => v.Id == dto.VolunteerId);

        if (!volunteerExists)
        {
            return BadRequest(new
            {
                message = "Volunteer does not exist."
            });
        }

        if (dto.ResourceId.HasValue &&
            !await _context.Resources.AnyAsync(r => r.Id == dto.ResourceId.Value))
        {
            return BadRequest(new
            {
                message = "Resource does not exist."
            });
        }

        var task = new DispatchTask
        {
            DispatchId = id,
            VolunteerId = dto.VolunteerId,
            ResourceId = dto.ResourceId,
            TaskType = dto.TaskType,
            Status = "Assigned",
            AssignedAt = DateTime.UtcNow
        };

        _context.DispatchTasks.Add(task);

        dispatch.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Task assigned successfully.",
            taskId = task.Id
        });
    }

    [HttpPut("{id}/tasks/{taskId}")]
    [Authorize(Roles = "Coordinator,Admin")]
    public async Task<IActionResult> UpdateTask(
        int id,
        int taskId,
        [FromBody] UpdateDispatchTaskDto dto)
    {
        var dispatch = await _context.Dispatches.FirstOrDefaultAsync(d => d.Id == id);
        if (dispatch == null)
            return NotFound(new { message = "Dispatch not found." });

        if (dispatch.Status is "Approved" or "Assigned" or "InProgress" or "Completed" or "Rejected")
            return Conflict(new { message = "Tasks cannot be changed after dispatch approval." });

        var task = await _context.DispatchTasks
            .FirstOrDefaultAsync(t => t.Id == taskId && t.DispatchId == id);
        if (task == null)
            return NotFound(new { message = "Dispatch task not found." });

        if (!await _context.Volunteers.AnyAsync(v => v.Id == dto.VolunteerId))
            return BadRequest(new { message = "Volunteer does not exist." });

        if (dto.ResourceId.HasValue &&
            !await _context.Resources.AnyAsync(r => r.Id == dto.ResourceId.Value))
            return BadRequest(new { message = "Resource does not exist." });

        task.VolunteerId = dto.VolunteerId;
        task.ResourceId = dto.ResourceId;
        task.TaskType = dto.TaskType;
        dispatch.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}/tasks/{taskId}")]
    [Authorize(Roles = "Coordinator,Admin")]
    public async Task<IActionResult> DeleteTask(int id, int taskId)
    {
        var dispatch = await _context.Dispatches.FirstOrDefaultAsync(d => d.Id == id);
        if (dispatch == null)
            return NotFound(new { message = "Dispatch not found." });

        if (dispatch.Status is "Approved" or "Assigned" or "InProgress" or "Completed" or "Rejected")
            return Conflict(new { message = "Tasks cannot be changed after dispatch approval." });

        var task = await _context.DispatchTasks
            .FirstOrDefaultAsync(t => t.Id == taskId && t.DispatchId == id);
        if (task == null)
            return NotFound(new { message = "Dispatch task not found." });

        _context.DispatchTasks.Remove(task);
        dispatch.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // POST: api/Dispatches/5/propose-allocation
    [HttpPost("{id}/propose-allocation")]
    [Authorize(Roles = "Coordinator,Admin")]
    public async Task<ActionResult> ProposeAllocation(
        int id,
        [FromBody] ProposeDispatchAllocationDto dto)
    {
        var dispatch = await _context.Dispatches
            .Include(d => d.Tasks)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (dispatch == null)
        {
            return NotFound(new
            {
                message = "Dispatch not found."
            });
        }

        var plan = await _context.IncidentPlans
            .FirstOrDefaultAsync(p => p.Id == dto.AllocationPlanId && p.IncidentId == dispatch.IncidentId);
        if (plan == null)
            return BadRequest(new { message = "Allocation plan does not belong to this dispatch incident." });

        if (dispatch.Status is "Approved" or "Assigned" or "InProgress" or "Completed" or "Rejected")
            return Conflict(new { message = "Allocation cannot be changed after dispatch approval." });

        dispatch.AllocationPlanId = plan.Id;
        dispatch.AllocationPlan = plan;
        dispatch.Status = "PendingApproval";
        dispatch.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Resource allocation proposal created.",
            dispatchId = dispatch.Id,
            status = dispatch.Status,
            allocationProposal = ToPlanResponse(plan)
        });
    }

    private static DispatchResponseDto ToResponseDto(
        Dispatch dispatch)
    {
        return new DispatchResponseDto(
            dispatch.Id,
            dispatch.IncidentId,
            dispatch.Status,
            dispatch.Priority,
            dispatch.CreatedAt,
            dispatch.UpdatedAt,
            dispatch.ApprovedAt,
            dispatch.ApprovedBy,
            dispatch.Tasks.Select(t =>
                new DispatchTaskResponseDto(
                    t.Id,
                    t.VolunteerId,
                    t.ResourceId,
                    t.TaskType,
                    t.Status
                )
            ).ToList(),
            dispatch.AllocationPlan == null ? null : ToPlanResponse(dispatch.AllocationPlan)
        );
    }

    private static IncidentPlanDto ToPlanResponse(IncidentPlan plan)
    {
        return new IncidentPlanDto
        {
            Id = plan.Id,
            IncidentId = plan.IncidentId,
            PlanTitle = plan.PlanTitle,
            PlanDescription = plan.PlanDescription,
            Status = plan.Status,
            Phase = plan.Phase,
            ActionSteps = DeserializeList<PlanActionStepDto>(plan.ActionStepsJson),
            EstimatedResources = DeserializeList<EstimatedResourceDto>(plan.EstimatedResourcesJson),
            RiskAssessment = plan.RiskAssessment,
            Reasoning = plan.Reasoning,
            Risks = DeserializeList<string>(plan.RisksJson),
            Constraints = DeserializeList<string>(plan.ConstraintsJson),
            RequiresHumanApproval = plan.RequiresHumanApproval,
            SuggestedAssignments = DeserializeList<SuggestedAssignmentDto>(plan.SuggestedAssignmentsJson),
            DispatchPlan = DeserializeList<DispatchPlanStepDto>(plan.DispatchPlanJson),
            ApprovedBy = plan.ApprovedBy,
            ApprovedAt = plan.ApprovedAt,
            CreatedAt = plan.CreatedAt
        };
    }

    private static List<T> DeserializeList<T>(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new List<T>();
        try
        {
            return JsonSerializer.Deserialize<List<T>>(json) ?? new List<T>();
        }
        catch (Exception)
        {
            return new List<T>();
        }
    }
}
