using ERCP.Api.Data;
using ERCP.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ERCP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Coordinator,Admin")]
public class WorkflowsController : ControllerBase
{
    private readonly EmergencyWorkflowService _workflows;
    private readonly AppDbContext _db;

    public WorkflowsController(EmergencyWorkflowService workflows, AppDbContext db)
    {
        _workflows = workflows;
        _db = db;
    }

    [HttpPost("incident/{incidentId:int}/start")]
    public async Task<IActionResult> Start(int incidentId, CancellationToken cancellationToken)
    {
        try
        {
            var run = await _workflows.StartAsync(incidentId, cancellationToken: cancellationToken);
            return CreatedAtAction(nameof(Get), new { id = run.Id }, run);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Incident not found." });
        }
    }

    [HttpPost("dispatch/{dispatchId:int}/start")]
    public async Task<IActionResult> StartForDispatch(int dispatchId, CancellationToken cancellationToken)
    {
        var dispatch = await _db.Dispatches.AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == dispatchId, cancellationToken);
        if (dispatch == null) return NotFound();
        if (dispatch.Status is not ("Proposed" or "PendingApproval"))
            return Conflict(new { message = "Only a proposed dispatch can be reallocated." });
        var run = await _workflows.StartAsync(dispatch.IncidentId, dispatchId, cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = run.Id }, run);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var run = await _db.WorkflowExecutions.AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == id, cancellationToken);
        return run == null ? NotFound() : Ok(run);
    }

    [HttpGet("incident/{incidentId:int}")]
    public async Task<IActionResult> GetForIncident(int incidentId, CancellationToken cancellationToken)
    {
        var runs = await _db.WorkflowExecutions.AsNoTracking()
            .Where(w => w.IncidentId == incidentId)
            .OrderByDescending(w => w.StartedAt)
            .ToListAsync(cancellationToken);
        return Ok(runs);
    }
}
