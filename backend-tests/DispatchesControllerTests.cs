using ERCP.Api.Controllers;
using ERCP.Api.Data;
using ERCP.Api.DTOs;
using ERCP.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ERCP.Api.Tests;

public class DispatchesControllerTests
{
    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task UpdateStatus_ApprovalWithoutSafetyAudit_IsRejected()
    {
        using var context = CreateContext();
        var dispatch = new Dispatch { IncidentId = 1, Priority = "High", Status = "PendingApproval" };
        context.Dispatches.Add(dispatch);
        await context.SaveChangesAsync();

        var controller = new DispatchesController(context);
        var result = await controller.UpdateStatus(dispatch.Id, new UpdateDispatchStatusDto("Approved"));

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("PendingApproval", dispatch.Status);
    }

    [Fact]
    public async Task UpdateStatus_ApprovalWithLatestPassingSafetyAudit_Succeeds()
    {
        using var context = CreateContext();
        var dispatch = new Dispatch { IncidentId = 1, Priority = "High", Status = "PendingApproval" };
        context.Dispatches.Add(dispatch);
        await context.SaveChangesAsync();
        context.ValidationAudits.Add(new ValidationAudit
        {
            DispatchId = dispatch.Id,
            IsValid = true,
            Recommendation = "APPROVE",
            ValidatedAt = DateTime.UtcNow,
        });
        await context.SaveChangesAsync();

        var controller = new DispatchesController(context);
        var result = await controller.UpdateStatus(dispatch.Id, new UpdateDispatchStatusDto("Approved"));

        Assert.IsType<OkObjectResult>(result);
        Assert.Equal("Approved", dispatch.Status);
    }

    [Fact]
    public async Task UpdateStatus_ApprovalWithNewerFailedSafetyAudit_IsRejected()
    {
        using var context = CreateContext();
        var dispatch = new Dispatch { IncidentId = 1, Priority = "High", Status = "PendingApproval" };
        context.Dispatches.Add(dispatch);
        await context.SaveChangesAsync();
        var validatedAt = DateTime.UtcNow;
        context.ValidationAudits.AddRange(
            new ValidationAudit
            {
                DispatchId = dispatch.Id,
                IsValid = true,
                Recommendation = "APPROVE",
                ValidatedAt = validatedAt,
            },
            new ValidationAudit
            {
                DispatchId = dispatch.Id,
                IsValid = false,
                Recommendation = "REJECT",
                ValidatedAt = validatedAt.AddTicks(1),
            });
        await context.SaveChangesAsync();

        var controller = new DispatchesController(context);
        var result = await controller.UpdateStatus(dispatch.Id, new UpdateDispatchStatusDto("Approved"));

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("PendingApproval", dispatch.Status);
    }

    [Fact]
    public async Task ProposeAllocation_AttachesIncidentPlanAndMovesToPendingApproval()
    {
        using var context = CreateContext();
        var dispatch = new Dispatch { IncidentId = 12, Priority = "High", Status = "Proposed" };
        var plan = new IncidentPlan { IncidentId = 12, PlanTitle = "Evacuation plan" };
        context.Dispatches.Add(dispatch);
        context.IncidentPlans.Add(plan);
        await context.SaveChangesAsync();

        var controller = new DispatchesController(context);
        var result = await controller.ProposeAllocation(
            dispatch.Id,
            new ProposeDispatchAllocationDto(plan.Id));

        Assert.IsType<OkObjectResult>(result);
        Assert.Equal(plan.Id, dispatch.AllocationPlanId);
        Assert.Equal("PendingApproval", dispatch.Status);
    }

    [Fact]
    public async Task UpdateTask_ChangesAssignmentAndRefreshesDispatchTimestamp()
    {
        using var context = CreateContext();
        var firstVolunteer = new Volunteer { Name = "First", Email = "first@test.local" };
        var nextVolunteer = new Volunteer { Name = "Next", Email = "next@test.local" };
        var dispatch = new Dispatch
        {
            IncidentId = 12,
            Priority = "High",
            Status = "PendingApproval",
            UpdatedAt = DateTime.UtcNow.AddMinutes(-1),
        };
        context.Volunteers.AddRange(firstVolunteer, nextVolunteer);
        context.Dispatches.Add(dispatch);
        await context.SaveChangesAsync();
        var task = new DispatchTask
        {
            DispatchId = dispatch.Id,
            VolunteerId = firstVolunteer.Id,
            TaskType = "Medical",
        };
        var resource = new Resource { Name = "Rescue Vehicle", ResourceType = "Vehicle" };
        context.DispatchTasks.Add(task);
        context.Resources.Add(resource);
        await context.SaveChangesAsync();
        var previousUpdatedAt = dispatch.UpdatedAt;

        var controller = new DispatchesController(context);
        var result = await controller.UpdateTask(
            dispatch.Id,
            task.Id,
            new UpdateDispatchTaskDto(nextVolunteer.Id, resource.Id, "Transport"));

        Assert.IsType<NoContentResult>(result);
        Assert.Equal(nextVolunteer.Id, task.VolunteerId);
        Assert.Equal(resource.Id, task.ResourceId);
        Assert.Equal("Transport", task.TaskType);
        Assert.True(dispatch.UpdatedAt > previousUpdatedAt);
    }

    [Fact]
    public async Task UpdateTask_RejectsChangesAfterApproval()
    {
        using var context = CreateContext();
        var volunteer = new Volunteer { Name = "Responder", Email = "responder@test.local" };
        var dispatch = new Dispatch { IncidentId = 12, Priority = "High", Status = "Approved" };
        context.Volunteers.Add(volunteer);
        context.Dispatches.Add(dispatch);
        await context.SaveChangesAsync();
        var task = new DispatchTask
        {
            DispatchId = dispatch.Id,
            VolunteerId = volunteer.Id,
            TaskType = "Medical",
        };
        context.DispatchTasks.Add(task);
        await context.SaveChangesAsync();

        var controller = new DispatchesController(context);
        var result = await controller.UpdateTask(
            dispatch.Id,
            task.Id,
            new UpdateDispatchTaskDto(volunteer.Id, null, "Transport"));

        Assert.IsType<ConflictObjectResult>(result);
        Assert.Equal("Medical", task.TaskType);
    }
}