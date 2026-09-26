using ERCP.Api.Controllers;
using ERCP.Api.Data;
using ERCP.Api.DTOs;
using ERCP.Api.Models;
using ERCP.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ERCP.Api.Tests;

public class DispatchAllocationTests
{
    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task ProposeAllocation_PersistsPlanAndReturnsAllocationResults()
    {
        using var context = CreateContext();
        var dispatch = new Dispatch { IncidentId = 17, Priority = "High" };
        var plan = new IncidentPlan
        {
            IncidentId = 17,
            PlanTitle = "Fire response allocation",
            PlanDescription = "Deploy medical and transport support.",
            DispatchPlanJson = "[{\"Action\":\"Deploy ambulance\",\"Resource\":\"Ambulance 2\",\"Location\":\"Sector 4\",\"Reason\":\"Medical response\"}]",
            SuggestedAssignmentsJson = "[{\"Role\":\"Medic\",\"EntityName\":\"Ava Responder\",\"Reason\":\"Medical skills\"}]",
        };
        context.Dispatches.Add(dispatch);
        context.IncidentPlans.Add(plan);
        await context.SaveChangesAsync();

        var controller = new DispatchesController(context);
        var proposalResult = await controller.ProposeAllocation(
            dispatch.Id,
            new ProposeDispatchAllocationDto(plan.Id));

        Assert.IsType<OkObjectResult>(proposalResult);
        Assert.Equal(plan.Id, dispatch.AllocationPlanId);
        Assert.Equal("PendingApproval", dispatch.Status);

        var getResult = await controller.GetById(dispatch.Id);
        var response = Assert.IsType<DispatchResponseDto>(
            Assert.IsType<OkObjectResult>(getResult.Result).Value);
        Assert.NotNull(response.AllocationProposal);
        Assert.Equal("Fire response allocation", response.AllocationProposal.PlanTitle);
        Assert.Equal("Deploy ambulance", Assert.Single(response.AllocationProposal.DispatchPlan).Action);
        Assert.Equal("Ava Responder", Assert.Single(response.AllocationProposal.SuggestedAssignments).EntityName);
    }

    [Fact]
    public async Task ValidateDispatch_UnavailableVolunteerRejectsAllocation()
    {
        using var context = CreateContext();
        var volunteer = new Volunteer
        {
            Name = "Off-duty responder",
            Email = "off-duty@test.local",
            IsAvailable = false,
        };
        var dispatch = new Dispatch { IncidentId = 17, Priority = "High" };
        context.Volunteers.Add(volunteer);
        context.Dispatches.Add(dispatch);
        await context.SaveChangesAsync();
        context.DispatchTasks.Add(new DispatchTask
        {
            DispatchId = dispatch.Id,
            VolunteerId = volunteer.Id,
            TaskType = "Medical response",
        });
        await context.SaveChangesAsync();

        var result = await new DispatchValidationService(context)
            .ValidateDispatchAsync(dispatch.Id);

        Assert.False(result.IsValid);
        Assert.Equal("REJECT", result.Recommendation);
        Assert.Contains(result.Violations, violation => violation.Code == "V1_VOLUNTEER_UNAVAILABLE");
    }

    [Fact]
    public async Task ValidateDispatch_UnavailableResourceRejectsAllocation()
    {
        using var context = CreateContext();
        var volunteer = new Volunteer { Name = "Responder", Email = "responder@test.local" };
        var resource = new Resource
        {
            Name = "Ambulance 2",
            ResourceType = "Vehicle",
            Status = "Maintenance",
        };
        var dispatch = new Dispatch { IncidentId = 17, Priority = "High" };
        context.Volunteers.Add(volunteer);
        context.Resources.Add(resource);
        context.Dispatches.Add(dispatch);
        await context.SaveChangesAsync();
        context.DispatchTasks.Add(new DispatchTask
        {
            DispatchId = dispatch.Id,
            VolunteerId = volunteer.Id,
            ResourceId = resource.Id,
            TaskType = "Medical response",
        });
        await context.SaveChangesAsync();

        var result = await new DispatchValidationService(context)
            .ValidateDispatchAsync(dispatch.Id);

        Assert.False(result.IsValid);
        Assert.Equal("REJECT", result.Recommendation);
        Assert.Contains(result.Violations, violation => violation.Code == "R1_RESOURCE_UNAVAILABLE");
    }

    [Fact]
    public async Task ProposeAllocation_UnknownDispatchReturnsNotFound()
    {
        using var context = CreateContext();
        var controller = new DispatchesController(context);

        var result = await controller.ProposeAllocation(
            404,
            new ProposeDispatchAllocationDto(12));

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task UpdateStatus_CannotApproveWithoutPassingValidationAudit()
    {
        using var context = CreateContext();
        var dispatch = new Dispatch
        {
            IncidentId = 17,
            Priority = "High",
            Status = "PendingApproval",
        };
        context.Dispatches.Add(dispatch);
        await context.SaveChangesAsync();

        var controller = new DispatchesController(context);
        var result = await controller.UpdateStatus(
            dispatch.Id,
            new UpdateDispatchStatusDto("Approved"));

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("PendingApproval", dispatch.Status);
    }

    [Fact]
    public void DispatchTask_ResourceRelationshipIsOptionalIntegerAndSetNullOnDelete()
    {
        using var context = CreateContext();
        var taskEntity = context.Model.FindEntityType(typeof(DispatchTask))!;
        var resourceForeignKey = taskEntity.GetForeignKeys()
            .Single(foreignKey => foreignKey.PrincipalEntityType.ClrType == typeof(Resource));

        Assert.Equal(typeof(int?), taskEntity.FindProperty(nameof(DispatchTask.ResourceId))!.ClrType);
        Assert.False(resourceForeignKey.IsRequired);
        Assert.Equal(DeleteBehavior.SetNull, resourceForeignKey.DeleteBehavior);
    }

    [Fact]
    public async Task DeletingResourceClearsDispatchTaskResourceId()
    {
        using var context = CreateContext();
        var volunteer = new Volunteer { Name = "Responder", Email = "resource-link@test.local" };
        var resource = new Resource { Name = "Rescue Vehicle", ResourceType = "Vehicle" };
        var dispatch = new Dispatch { IncidentId = 17, Priority = "High" };
        context.Volunteers.Add(volunteer);
        context.Resources.Add(resource);
        context.Dispatches.Add(dispatch);
        await context.SaveChangesAsync();
        var task = new DispatchTask
        {
            DispatchId = dispatch.Id,
            VolunteerId = volunteer.Id,
            ResourceId = resource.Id,
            TaskType = "Transport",
        };
        context.DispatchTasks.Add(task);
        await context.SaveChangesAsync();

        context.Resources.Remove(resource);
        await context.SaveChangesAsync();

        Assert.Null(task.ResourceId);
    }
}
