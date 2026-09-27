using Microsoft.EntityFrameworkCore;
using ERCP.Api.Data;
using ERCP.Api.Models;
using ERCP.Api.DTOs;
using ERCP.Api.Controllers;
using Xunit;

namespace ERCP.Api.Tests;

/// <summary>
/// Student 4 — shift management (POST /api/volunteers/{id}/shifts) tests.
/// Covers: creation, unknown volunteer, invalid window, invalid status.
/// </summary>
public class VolunteerShiftTests
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
            Name = "Shift Worker",
            Email = $"shift-{Guid.NewGuid()}@test.local",
            Phone = "0770000000",
            Skills = "rescue",
        };
        ctx.Volunteers.Add(volunteer);
        await ctx.SaveChangesAsync();
        return (ctx, volunteer);
    }

    [Fact]
    public async Task CreateShift_ValidWindow_PersistsAndReturnsCreated()
    {
        var (ctx, volunteer) = await SeedVolunteerAsync();
        var controller = new VolunteersController(ctx);
        var start = new DateTime(2026, 10, 1, 8, 0, 0, DateTimeKind.Utc);
        var end = new DateTime(2026, 10, 1, 16, 0, 0, DateTimeKind.Utc);

        var result = await controller.CreateShift(
            volunteer.Id, new CreateShiftDto { StartTime = start, EndTime = end, Status = "Scheduled" });

        var created = Assert.IsType<Microsoft.AspNetCore.Mvc.CreatedAtActionResult>(result.Result);
        var shift = Assert.IsType<ShiftResponseDto>(created.Value);
        Assert.Equal(volunteer.Id, shift.VolunteerId);
        Assert.Equal(ShiftStatus.Scheduled.ToString(), shift.Status);
        Assert.Equal(1, await ctx.Shifts.CountAsync());
    }

    [Fact]
    public async Task CreateShift_UnknownVolunteer_ReturnsNotFound()
    {
        var ctx = GetInMemoryContext();
        var controller = new VolunteersController(ctx);

        var result = await controller.CreateShift(
            Guid.NewGuid(),
            new CreateShiftDto
            {
                StartTime = new DateTime(2026, 10, 1, 8, 0, 0, DateTimeKind.Utc),
                EndTime = new DateTime(2026, 10, 1, 16, 0, 0, DateTimeKind.Utc),
            });

        Assert.IsType<Microsoft.AspNetCore.Mvc.NotFoundResult>(result.Result);
        Assert.Equal(0, await ctx.Shifts.CountAsync());
    }

    [Fact]
    public async Task CreateShift_EndBeforeStart_ReturnsBadRequest()
    {
        var (ctx, volunteer) = await SeedVolunteerAsync();
        var controller = new VolunteersController(ctx);

        var result = await controller.CreateShift(
            volunteer.Id,
            new CreateShiftDto
            {
                StartTime = new DateTime(2026, 10, 1, 16, 0, 0, DateTimeKind.Utc),
                EndTime = new DateTime(2026, 10, 1, 8, 0, 0, DateTimeKind.Utc),
            });

        Assert.IsType<Microsoft.AspNetCore.Mvc.BadRequestObjectResult>(result.Result);
        Assert.Equal(0, await ctx.Shifts.CountAsync());
    }

    [Fact]
    public async Task CreateShift_InvalidStatus_ReturnsBadRequest()
    {
        var (ctx, volunteer) = await SeedVolunteerAsync();
        var controller = new VolunteersController(ctx);

        var result = await controller.CreateShift(
            volunteer.Id,
            new CreateShiftDto
            {
                StartTime = new DateTime(2026, 10, 1, 8, 0, 0, DateTimeKind.Utc),
                EndTime = new DateTime(2026, 10, 1, 16, 0, 0, DateTimeKind.Utc),
                Status = "PartyTime",
            });

        Assert.IsType<Microsoft.AspNetCore.Mvc.BadRequestObjectResult>(result.Result);
        Assert.Equal(0, await ctx.Shifts.CountAsync());
    }
}
