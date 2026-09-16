using Microsoft.AspNetCore.Mvc;
using ERCP.Api.DTOs;
using ERCP.Api.Services;

namespace ERCP.Api.Controllers;

/// <summary>
/// Student 4 — Validation/Safety Agent endpoints.
/// Deterministic pre-approval gate: POST /api/validations/dispatch/{id}
/// must be called before coordinator approves a dispatch.
/// </summary>
[ApiController]
[Route("api/[controller]")]
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
    /// </summary>
    [HttpPost("dispatch/{id:int}")]
    public async Task<ActionResult<ValidationResultDto>> ValidateDispatch(
        int id,
        [FromBody] ValidateDispatchRequestDto? request = null)
    {
        try
        {
            var result = await _validation.ValidateDispatchAsync(id, request ?? new ValidateDispatchRequestDto());
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
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
