using Microsoft.EntityFrameworkCore;
using ERCP.Api.Data;
using ERCP.Api.Models;
using ERCP.Api.DTOs;
using ERCP.Api.Controllers;
using Xunit;

namespace ERCP.Api.Tests;

/// <summary>
/// Student 4 — per-volunteer assigned tasks (GET /api/volunteers/{id}/tasks).
/// Covers: task list with dispatch/incident context, unknown volunteer, empty list.
/// </summary>
public class VolunteerTasksTests
{
    private AppDbContext GetInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private async Task<(AppDbContext ctx, Volunteer volunteer)> SeedVolunteerAsync()
    {
        var ctx = GetInMemoryContext();
        var volunteer = new Volunteer
        {
            Name = "Task Worker",
            Email = $"tasks-{Guid.NewGuid()}@test.local",
            Phone = "0770000000",
            Skills = "rescue",
        };
        ctx.Volunteers.Add(volunteer);
        await ctx.SaveChangesAsync();
        return (ctx, volunteer);
    }

    [Fact]
    public async Task GetTasks_ReturnsTasksWithDispatchAndIncidentContext()
    {
        var (ctx, volunteer) = await SeedVolunteerAsync();
        var incident = new Incident
        {
            Title = "Warehouse fire",
            Description = "desc",
            Location = "Sector 4",
            Category = "Fire",
            Priority = "High",
            Status = "Reported",
        };
        ctx.Incidents.Add(incident);
        await ctx.SaveChangesAsync();

        var dispatch = new Dispatch { IncidentId = incident.Id, Priority = "High", Status = "PendingApproval" };
        ctx.Dispatches.Add(dispatch);
        await ctx.SaveChangesAsync();

        var resource = new Resource
        {
            Name = "Ambulance 1",
            ResourceType = "Vehicle",
            Status = "Available",
            Capacity = 4,
            Location = "Depot",
        };
        ctx.Resources.Add(resource);
        await ctx.SaveChangesAsync();

        ctx.DispatchTasks.Add(new DispatchTask
        {
            DispatchId = dispatch.Id,
            VolunteerId = volunteer.Id,
            ResourceId = resource.Id,
            TaskType = "Medical response",
            Status = "Assigned",
            AssignedAt = DateTime.UtcNow,
        });
        await ctx.SaveChangesAsync();

        var controller = new VolunteersController(ctx);
        var result = await controller.GetTasks(volunteer.Id);

        var ok = Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(result.Result);
        var tasks = Assert.IsAssignableFrom<IEnumerable<VolunteerTaskDto>>(ok.Value);
        var task = Assert.Single(tasks);
        Assert.Equal(dispatch.Id, task.DispatchId);
        Assert.Equal(incident.Id, task.IncidentId);
        Assert.Equal("Warehouse fire", task.IncidentTitle);
        Assert.Equal("PendingApproval", task.DispatchStatus);
        Assert.Equal("Medical response", task.TaskType);
        Assert.Equal("Ambulance 1", task.ResourceName);
    }

    [Fact]
    public async Task GetTasks_TaskWithoutResource_ReturnsNullResourceName()
    {
        var (ctx, volunteer) = await SeedVolunteerAsync();
        var incident = new Incident
        {
            Title = "Flood",
            Description = "desc",
            Location = "Sector 7",
            Category = "Flood",
            Priority = "High",
            Status = "Reported",
        };
        ctx.Incidents.Add(incident);
        await ctx.SaveChangesAsync();

        var dispatch = new Dispatch { IncidentId = incident.Id, Priority = "Medium", Status = "Proposed" };
        ctx.Dispatches.Add(dispatch);
        await ctx.SaveChangesAsync();

        ctx.DispatchTasks.Add(new DispatchTask
        {
            DispatchId = dispatch.Id,
            VolunteerId = volunteer.Id,
            TaskType = "Searching",
            Status = "Assigned",
            AssignedAt = DateTime.UtcNow,
        });
        await ctx.SaveChangesAsync();

        var controller = new VolunteersController(ctx);
        var result = await controller.GetTasks(volunteer.Id);

        var ok = Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(result.Result);
        var tasks = Assert.IsAssignableFrom<IEnumerable<VolunteerTaskDto>>(ok.Value);
        var task = Assert.Single(tasks);
        Assert.Null(task.ResourceId);
        Assert.Null(task.ResourceName);
    }

    [Fact]
    public async Task GetTasks_UnknownVolunteer_ReturnsNotFound()
    {
        var ctx = GetInMemoryContext();
        var controller = new VolunteersController(ctx);

        var result = await controller.GetTasks(Guid.NewGuid());

        Assert.IsType<Microsoft.AspNetCore.Mvc.NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetTasks_NoTasks_ReturnsEmptyList()
    {
        var (ctx, volunteer) = await SeedVolunteerAsync();
        var controller = new VolunteersController(ctx);

        var result = await controller.GetTasks(volunteer.Id);

        var ok = Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(result.Result);
        var tasks = Assert.IsAssignableFrom<IEnumerable<VolunteerTaskDto>>(ok.Value);
        Assert.Empty(tasks);
    }
}
