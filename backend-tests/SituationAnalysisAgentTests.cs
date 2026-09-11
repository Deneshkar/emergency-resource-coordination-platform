using Microsoft.EntityFrameworkCore;
using ERCP.Api.Data;
using ERCP.Api.Models;
using ERCP.Api.Services;
using ERCP.Api.Controllers;
using ERCP.Api.DTOs;
using Xunit;

namespace ERCP.Api.Tests;

public class SituationAnalysisAgentTests
{
    private AppDbContext GetInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task AssessSituation_GeneratesValidAssessment()
    {
        var context = GetInMemoryContext();
        var incident = new Incident
        {
            Title = "Major River Flood & Medical Emergency",
            Description = "Rising water level and multiple casualties reported.",
            Location = "District 4",
            Priority = "Critical"
        };
        context.Incidents.Add(incident);

        context.Shelters.Add(new Shelter
        {
            Name = "High School Evacuation Hub",
            TotalCapacity = 300,
            CurrentOccupancy = 50,
            Status = "Active"
        });

        await context.SaveChangesAsync();

        var service = new SituationAnalysisService(context);
        var controller = new SituationAnalysisController(service);

        var result = await controller.AssessSituation(new AssessSituationRequestDto { IncidentId = incident.Id });

        var okResult = Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(result.Result);
        var assessment = Assert.IsType<SituationAssessmentResponseDto>(okResult.Value);

        Assert.True(assessment.UrgencyScore >= 85);
        Assert.Equal("Critical", assessment.UrgencyLevel);
        Assert.Contains("Nearest shelter identified", assessment.AnalysisSummary);
        Assert.NotNull(assessment.NearestShelterName);
    }
}
