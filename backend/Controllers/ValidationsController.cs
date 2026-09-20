using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ERCP.Api.DTOs;
using ERCP.Api.Services;

namespace ERCP.Api.Controllers;

/// <summary>
/// Student 4 — Validation/Safety Agent endpoints.
/// Deterministic pre-approval gate: POST /api/validations/dispatch/{id}
/// must be called before coordinator approves a dispatch.
/// Restricted to Coordinator/Admin per spec (authorized human approval).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Coordinator,Admin")]
public class ValidationsController : ControllerBase
{
    private readonly DispatchValidationService _validation;

    public ValidationsController(DispatchValidationService validation)
    {
        _validation = validation;
    }

    /// <summary>
    /// Validate a dispatch proposal against live DB state.
    /// Returns APPROVE / REVISE / REJECT with violations, warnings and per-tool checks.
    /// The result is persisted as a ValidationAudit + incident timeline event.
    /// </summary>
    [HttpPost("dispatch/{id:int}")]
    public async Task<ActionResult<ValidationResultDto>> ValidateDispatch(
        int id,
        [FromBody] ValidateDispatchRequestDto? request = null)
    {
        try
        {
            // Prefer the email claim: Identity.Name maps to NameIdentifier (numeric
            // user id) per the JWT NameClaimType mapping in Program.cs, so reading
            // it first would persist "2" instead of "coordinator@ercp.org".
            var validatedBy = User?.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                ?? User?.FindFirst("email")?.Value
                ?? User?.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value
                ?? User?.Identity?.Name
                ?? "Coordinator";
            var result = await _validation.ValidateDispatchAsync(id, request ?? new ValidateDispatchRequestDto(), validatedBy);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Persisted validation history for a dispatch (latest first) so the
    /// coordinator decision survives refresh and is auditable.
    /// </summary>
    [HttpGet("dispatch/{id:int}/history")]
    public async Task<ActionResult<List<ValidationHistoryDto>>> GetHistory(int id)
    {
        var history = await _validation.GetHistoryAsync(id);
        return Ok(history);
    }

    /// <summary>
    /// Expose the deterministic tool allow-list for orchestration conformance (Student 3 integration).
    /// </summary>
    [HttpGet("tools")]
    public ActionResult<object> GetTools()
    {
        return Ok(new
        {
            agent = "agent-validation-safety-04",
            role = "Validation / Safety Agent",
            allowedTools = DispatchValidationService.AllowedTools,
            recommendationValues = new[] { "APPROVE", "REVISE", "REJECT" },
        });
    }
}
