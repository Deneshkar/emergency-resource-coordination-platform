using Microsoft.AspNetCore.Mvc;
using ERCP.Api.DTOs;
using ERCP.Api.Services;

namespace ERCP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SituationAnalysisController : ControllerBase
{
    private readonly SituationAnalysisService _analysisService;

    public SituationAnalysisController(SituationAnalysisService analysisService)
    {
        _analysisService = analysisService;
    }

    // POST: api/SituationAnalysis/assess (Business Specific AI Operation for Student 2)
    [HttpPost("assess")]
    public async Task<ActionResult<SituationAssessmentResponseDto>> AssessSituation(AssessSituationRequestDto dto)
    {
        try
        {
            var result = await _analysisService.AssessSituationAsync(dto.IncidentId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "An error occurred during situation analysis assessment." });
        }
    }
}
