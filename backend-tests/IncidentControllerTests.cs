using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using ERCP.Api.Controllers;
using ERCP.Api.Data;
using ERCP.Api.DTOs;
using ERCP.Api.Models;
using ERCP.Api.Services;
using Xunit;

namespace ERCP.Api.Tests;

public class IncidentControllerTests
{
    private AppDbContext GetInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()) // fresh DB per test instance
            .Options;

        return new AppDbContext(options);
    }

    private class DummyEmailService : IEmailService
    {
        public Task SendEmailAsync(string to, string subject, string htmlBody) => Task.CompletedTask;
        public Task SendAlertAsync(string alertType, string subject, string body, string priority = "High") => Task.CompletedTask;
    }

    private IncidentController CreateController(AppDbContext context)
    {
        var plannerLogger = NullLogger<IncidentPlannerService>.Instance;
        var plannerService = new IncidentPlannerService(plannerLogger, context);
        var controllerLogger = NullLogger<IncidentController>.Instance;

        return new IncidentController(context, plannerService, new DummyEmailService(), controllerLogger);
    }

    [Fact]
    public async Task CreateIncident_Successfully_ReturnsCreatedAndLogsTimelineEvent()
    {
        // Arrange
        var context = GetInMemoryContext();
        var controller = CreateController(context);

        var dto = new CreateIncidentDto
        {
            Title = "Industrial Chemical Spill",
            Description = "Tanker leak near riverbank",
            Location = "Sector 4 Industrial Zone",
            Category = "Chemical",
            Priority = "High",
            AffectedCount = 25,
            ReporterContact = "Plant Supervisor",
            AutoGeneratePlan = false
        };

        // Act
        var result = await controller.CreateIncident(dto);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var incidentDetail = Assert.IsType<IncidentDetailDto>(createdResult.Value);

        Assert.True(incidentDetail.Id > 0);
        Assert.Equal("Industrial Chemical Spill", incidentDetail.Title);
        Assert.Equal("Reported", incidentDetail.Status);

        // Verify timeline event created
        var timelineEvents = await context.IncidentTimelineEvents
            .Where(e => e.IncidentId == incidentDetail.Id)
            .ToListAsync();

        Assert.NotEmpty(timelineEvents);
        Assert.Contains(timelineEvents, e => e.EventType == "Created");
    }

    [Fact]
    public async Task UpdateStatus_ValidTransition_ReportedToVerified_Succeeds()
    {
        // Arrange
        var context = GetInMemoryContext();
        var incident = new Incident
        {
            Title = "Pipeline Leak",
            Status = "Reported",
            Priority = "Medium",
            Location = "North Station"
        };
        context.Incidents.Add(incident);
        await context.SaveChangesAsync();

        var controller = CreateController(context);
        var updateDto = new UpdateIncidentDto
        {
            Status = "Verified",
            Note = "Verified on site by field officer"
        };

        // Act
        var result = await controller.UpdateIncident(incident.Id, updateDto);

        // Assert
        Assert.IsType<NoContentResult>(result);

        var updatedIncident = await context.Incidents.FindAsync(incident.Id);
        Assert.NotNull(updatedIncident);
        Assert.Equal("Verified", updatedIncident.Status);

        // Verify timeline logging
        var timeline = await context.IncidentTimelineEvents
            .Where(e => e.IncidentId == incident.Id)
            .ToListAsync();

        var statusEvent = timeline.FirstOrDefault(e => e.Title == "Incident Verified");
        Assert.NotNull(statusEvent);
        Assert.Equal("StatusUpdate", statusEvent.EventType);
    }

    [Fact]
    public async Task UpdateStatus_InvalidTransition_ReportedToResolved_ReturnsBadRequest()
    {
        // Arrange
        var context = GetInMemoryContext();
        var incident = new Incident
        {
            Title = "Power Substation Failure",
            Status = "Reported",
            Priority = "High",
            Location = "Substation 9"
        };
        context.Incidents.Add(incident);
        await context.SaveChangesAsync();

        var controller = CreateController(context);
        var updateDto = new UpdateIncidentDto
        {
            Status = "Resolved" // Illegal jump: Reported -> Resolved
        };

        // Act
        var result = await controller.UpdateIncident(incident.Id, updateDto);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequestResult.Value);

        // Ensure status in database was NOT changed
        var unchangedIncident = await context.Incidents.FindAsync(incident.Id);
        Assert.NotNull(unchangedIncident);
        Assert.Equal("Reported", unchangedIncident.Status);
    }

    [Fact]
    public async Task GetTimeline_ReturnsEventsInChronologicalOrder()
    {
        // Arrange
        var context = GetInMemoryContext();
        var incident = new Incident { Title = "Building Collapse", Status = "Reported" };
        context.Incidents.Add(incident);
        await context.SaveChangesAsync();

        var time1 = DateTime.UtcNow.AddMinutes(-30);
        var time2 = DateTime.UtcNow.AddMinutes(-10);

        context.IncidentTimelineEvents.Add(new IncidentTimelineEvent
        {
            IncidentId = incident.Id,
            EventType = "Created",
            Title = "Incident Reported",
            Timestamp = time1
        });

        context.IncidentTimelineEvents.Add(new IncidentTimelineEvent
        {
            IncidentId = incident.Id,
            EventType = "StatusUpdate",
            Title = "Incident Verified",
            Timestamp = time2
        });

        await context.SaveChangesAsync();

        var controller = CreateController(context);

        // Act
        var result = await controller.GetTimeline(incident.Id);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var events = Assert.IsAssignableFrom<IEnumerable<IncidentTimelineEventDto>>(okResult.Value).ToList();

        Assert.Equal(2, events.Count);
        Assert.True(events[0].Timestamp <= events[1].Timestamp);
        Assert.Equal("Incident Reported", events[0].Title);
        Assert.Equal("Incident Verified", events[1].Title);
    }

    [Fact]
    public async Task GeneratePlan_CreatesAndReturnsIncidentPlan_AndLogsTimelineEvent()
    {
        // Arrange
        var context = GetInMemoryContext();
        var incident = new Incident
        {
            Title = "Wildfire Threat",
            Category = "Fire",
            Priority = "Critical",
            Location = "Pine Ridge Hill",
            AffectedCount = 50,
            Status = "Reported"
        };
        context.Incidents.Add(incident);
        await context.SaveChangesAsync();

        var controller = CreateController(context);
        var requestDto = new GeneratePlanRequestDto
        {
            CustomDirectives = "Focus on residential evacuation",
            FocusPhase = "Mass Evacuation"
        };

        // Act
        var result = await controller.GeneratePlan(incident.Id, requestDto);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var planDto = Assert.IsType<IncidentPlanDto>(okResult.Value);

        Assert.NotNull(planDto);
        Assert.Equal(incident.Id, planDto.IncidentId);
        Assert.NotEmpty(planDto.ActionSteps);

        // Verify plan saved in DB
        var savedPlan = await context.IncidentPlans.FirstOrDefaultAsync(p => p.IncidentId == incident.Id);
        Assert.NotNull(savedPlan);

        // Verify PlanGenerated timeline event
        var timelineEvent = await context.IncidentTimelineEvents
            .FirstOrDefaultAsync(e => e.IncidentId == incident.Id && e.EventType == "PlanGenerated");
        Assert.NotNull(timelineEvent);
    }

    [Fact]
    public async Task GetIncident_NonExistingId_ReturnsNotFound()
    {
        // Arrange
        var context = GetInMemoryContext();
        var controller = CreateController(context);

        // Act
        var result = await controller.GetIncident(99999);

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task UpdatePriority_CreatesPriorityChangedTimelineEvent()
    {
        // Arrange
        var context = GetInMemoryContext();
        var incident = new Incident
        {
            Title = "Substation Overload",
            Status = "Reported",
            Priority = "Medium",
            Location = "Grid Station 4"
        };
        context.Incidents.Add(incident);
        await context.SaveChangesAsync();

        var controller = CreateController(context);
        var updateDto = new UpdateIncidentDto { Priority = "Critical" };

        // Act
        var result = await controller.UpdateIncident(incident.Id, updateDto);

        // Assert
        Assert.IsType<NoContentResult>(result);

        var timelineEvents = await context.IncidentTimelineEvents
            .Where(e => e.IncidentId == incident.Id && e.EventType == "PriorityChanged")
            .ToListAsync();

        Assert.Single(timelineEvents);
        Assert.Contains("Critical", timelineEvents[0].Title);
    }
}
