using ERCP.Api.Data;
using ERCP.Api.Models;
using ERCP.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using ERCP.Api.Controllers;
using ERCP.Api.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace ERCP.Api.Tests;

public class EmergencyWorkflowServiceTests
{
    [Fact]
    public async Task MissingAgent_RecordsSafeFailureWithoutAuthorizingDispatch()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        await using var db = new AppDbContext(options);
        var incident = new Incident
        {
            Title = "Flood response", Description = "Homes flooded and residents need evacuation",
            Location = "Colombo", Category = "Flood", Priority = "High"
        };
        db.Incidents.Add(incident);
        await db.SaveChangesAsync();

        var configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?> { ["Agents:Directory"] = "missing-agent-directory" }).Build();
        var service = new EmergencyWorkflowService(db,
            new IncidentPlannerService(NullLogger<IncidentPlannerService>.Instance, db),
            new DispatchValidationService(db), configuration,
            NullLogger<EmergencyWorkflowService>.Instance);

        var run = await service.StartAsync(incident.Id);

        Assert.Equal("Failed", run.Status);
        Assert.Equal("NotRequested", run.ApprovalStatus);
        Assert.NotEmpty(run.ErrorsJson);
        Assert.NotNull(await db.WorkflowExecutions.FindAsync(run.Id));
        Assert.False(await db.Dispatches.AnyAsync());
    }

    [Fact]
    public async Task CompleteFourAgentRun_WaitsForHumanApproval()
    {
        // Python is installed on the Linux CI runner. Windows local runs can
        // opt in with RUN_PYTHON_INTEGRATION=1 outside the app alias sandbox.
        if (OperatingSystem.IsWindows() &&
            Environment.GetEnvironmentVariable("RUN_PYTHON_INTEGRATION") != "1") return;

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        await using var db = new AppDbContext(options);
        var incident = new Incident { Title = "Urban flood", Description = "Flooded homes require evacuation",
            Location = "Colombo", Category = "Flood", Priority = "High", AffectedCount = 5 };
        db.Incidents.Add(incident);
        db.Shelters.Add(new Shelter { Name = "Nearby school", Status = "Active",
            TotalCapacity = 20, CurrentOccupancy = 5 });
        for (var i = 0; i < 12; i++)
        {
            db.Resources.AddRange(
                new Resource { Name = $"Vehicle {i}", ResourceType = "Vehicle", Status = "Available" },
                new Resource { Name = $"Medical {i}", ResourceType = "Medical", Status = "Available" },
                new Resource { Name = $"Personnel {i}", ResourceType = "Personnel", Status = "Available" });
            db.Volunteers.AddRange(
                new Volunteer { Name = $"Driver {i}", Email = $"driver{i}@test.local", Skills = "Driver", IsAvailable = true },
                new Volunteer { Name = $"EMT {i}", Email = $"emt{i}@test.local", Skills = "Medical EMT", IsAvailable = true },
                new Volunteer { Name = $"Responder {i}", Email = $"responder{i}@test.local", Skills = "General response", IsAvailable = true });
        }
        await db.SaveChangesAsync();
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Agents:Directory"] = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory,
                "..", "..", "..", "..", "ai-agents")),
            ["Agents:PythonExecutable"] = Environment.GetEnvironmentVariable("ERCP_TEST_PYTHON")
                ?? (OperatingSystem.IsWindows() ? "py" : "python3")
        }).Build();
        var workflowService = new EmergencyWorkflowService(db,
            new IncidentPlannerService(NullLogger<IncidentPlannerService>.Instance, db, config),
            new DispatchValidationService(db), config,
            NullLogger<EmergencyWorkflowService>.Instance);

        var run = await workflowService.StartAsync(incident.Id);

        Assert.True(run.Status == "AwaitingApproval",
            $"Workflow status={run.Status}; validation={run.ValidationJson}; errors={run.ErrorsJson}; tools={run.ToolResultsJson}");
        Assert.Equal("PendingApproval", run.ApprovalStatus);
        Assert.Equal(4, System.Text.Json.JsonDocument.Parse(run.CompletedStepsJson)
            .RootElement.GetArrayLength());
        using (var validation = System.Text.Json.JsonDocument.Parse(run.ValidationJson))
        {
            Assert.Equal("APPROVE", validation.RootElement.GetProperty("pythonRecommendation").GetString());
            Assert.Single(validation.RootElement.GetProperty("shelterAllocations").EnumerateArray());
        }
        var dispatch = await db.Dispatches.SingleAsync();
        Assert.Equal("PendingApproval", dispatch.Status);
        Assert.Null(dispatch.ApprovedAt);

        // The React approval screen requests a fresh safety check first. That
        // recheck must retain the workflow's proposed shelter allocation.
        var recheck = await new ValidationsController(new DispatchValidationService(db))
            .ValidateDispatch(dispatch.Id);
        var result = Assert.IsType<OkObjectResult>(recheck.Result);
        var safety = Assert.IsType<ValidationResultDto>(result.Value);
        Assert.Equal("APPROVE", safety.Recommendation);
        Assert.Contains(safety.Checks, c => c.Tool == "check_shelter_capacity");

        var approval = await new DispatchesController(db)
            .UpdateStatus(dispatch.Id, new UpdateDispatchStatusDto("Approved"));
        Assert.IsType<OkObjectResult>(approval);
        Assert.Equal("Approved", run.ApprovalStatus);
        Assert.Equal("Approved", dispatch.Status);
    }

    [Fact]
    public async Task AllocationGaps_RemainBlockedAfterManualSafetyRecheck()
    {
        if (OperatingSystem.IsWindows() &&
            Environment.GetEnvironmentVariable("RUN_PYTHON_INTEGRATION") != "1") return;
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        await using var db = new AppDbContext(options);
        var incident = new Incident { Title = "Flood", Description = "Evacuation",
            Location = "Colombo", Category = "Flood", Priority = "High", AffectedCount = 5 };
        db.Incidents.Add(incident);
        db.Resources.Add(new Resource { Name = "Rescue van", ResourceType = "Vehicle", Status = "Available" });
        db.Volunteers.Add(new Volunteer { Name = "Driver", Email = "driver@test.local",
            Skills = "Driver", IsAvailable = true });
        await db.SaveChangesAsync();
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Agents:Directory"] = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory,
                "..", "..", "..", "..", "ai-agents")),
            ["Agents:PythonExecutable"] = Environment.GetEnvironmentVariable("ERCP_TEST_PYTHON")
                ?? (OperatingSystem.IsWindows() ? "py" : "python3")
        }).Build();
        var gate = new DispatchValidationService(db);
        var service = new EmergencyWorkflowService(db,
            new IncidentPlannerService(NullLogger<IncidentPlannerService>.Instance, db, config),
            gate, config, NullLogger<EmergencyWorkflowService>.Instance);

        var run = await service.StartAsync(incident.Id);
        Assert.True(run.Status == "NeedsRevision",
            $"Workflow status={run.Status}; errors={run.ErrorsJson}; tools={run.ToolResultsJson}");
        Assert.NotNull(run.DispatchId);
        var recheck = await new ValidationsController(gate)
            .ValidateDispatch(run.DispatchId.Value);
        Assert.IsType<OkObjectResult>(recheck.Result);
        Assert.Equal("NeedsRevision", run.Status);
        var approval = await new DispatchesController(db)
            .UpdateStatus(run.DispatchId.Value, new UpdateDispatchStatusDto("Approved"));
        Assert.IsType<BadRequestObjectResult>(approval);
    }
}
