using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERCP.Api.Data;
using ERCP.Api.Models;
using ERCP.Api.DTOs;

namespace ERCP.Api.Controllers;

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

        dispatch.Status = "Assigned";
        dispatch.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Task assigned successfully.",
            taskId = task.Id
        });
    }

    // POST: api/Dispatches/5/propose-allocation
    [HttpPost("{id}/propose-allocation")]
    public async Task<ActionResult> ProposeAllocation(int id)
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

        /*
         * This is the business-specific operation for
         * Component 3.
         *
         * Later this endpoint will call the
         * Resource Allocation Agent.
         */

        dispatch.Status = "PendingApproval";
        dispatch.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Resource allocation proposal created.",
            dispatchId = dispatch.Id,
            status = dispatch.Status
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
            ).ToList()
        );
    }
}