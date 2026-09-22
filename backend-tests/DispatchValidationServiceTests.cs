using Microsoft.EntityFrameworkCore;
using ERCP.Api.Data;
using ERCP.Api.Models;
using ERCP.Api.DTOs;
using ERCP.Api.Services;
using Xunit;

namespace ERCP.Api.Tests;

/// <summary>
/// Student 4 — Validation/Safety Agent deterministic gate tests.
/// Covers: approve path, unavailable volunteer, double-booking,
/// shelter over-allocation, inventory insufficiency.
/// </summary>
public class DispatchValidationServiceTests
{
    private AppDbContext GetInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private async Task<(AppDbContext ctx, Dispatch dispatch, Volunteer volunteer)> SeedDispatchAsync(
        bool volunteerAvailable = true)
    {
        var ctx = GetInMemoryContext();
        var volunteer = new Volunteer
        {
            Name = "Test Responder",
            Email = "responder@test.local",
            Phone = "0770000000",
            Skills = "medical, rescue",
            IsAvailable = volunteerAvailable,
        };
        ctx.Volunteers.Add(volunteer);
        await ctx.SaveChangesAsync();

        var dispatch = new Dispatch { IncidentId = 1, Priority = "High", Status = "Proposed" };
        ctx.Dispatches.Add(dispatch);
        await ctx.SaveChangesAsync();

        ctx.DispatchTasks.Add(new DispatchTask
        {
            DispatchId = dispatch.Id,
            VolunteerId = volunteer.Id,
            TaskType = "MedicalEvac",
            Status = "Assigned",
            AssignedAt = DateTime.UtcNow,
        });
        await ctx.SaveChangesAsync();

        return (ctx, dispatch, volunteer);
    }

    [Fact]
    public async Task ValidateDispatch_AvailableVolunteer_ReturnsApprove()
    {
        var (ctx, dispatch, _) = await SeedDispatchAsync(volunteerAvailable: true);
        var service = new DispatchValidationService(ctx);

        var result = await service.ValidateDispatchAsync(dispatch.Id, new ValidateDispatchRequestDto());

        Assert.True(result.IsValid);
        Assert.Equal("APPROVE", result.Recommendation);
        Assert.Empty(result.Violations);
    }

    [Fact]
    public async Task ValidateDispatch_UnavailableVolunteer_ReturnsReject_WithV1()
    {
        var (ctx, dispatch, _) = await SeedDispatchAsync(volunteerAvailable: false);
        var service = new DispatchValidationService(ctx);

        var result = await service.ValidateDispatchAsync(dispatch.Id, new ValidateDispatchRequestDto());

        Assert.False(result.IsValid);
        Assert.Equal("REJECT", result.Recommendation);
        Assert.Contains(result.Violations, v => v.Code == "V1_VOLUNTEER_UNAVAILABLE");
    }

    [Fact]
    public async Task ValidateDispatch_OverlappingShift_ReturnsRevise_WithV2()
    {
        var (ctx, dispatch, volunteer) = await SeedDispatchAsync(volunteerAvailable: true);

        var start = new DateTime(2026, 9, 20, 8, 0, 0, DateTimeKind.Utc);
        var end = new DateTime(2026, 9, 20, 16, 0, 0, DateTimeKind.Utc);
        ctx.Shifts.Add(new Shift
        {
            VolunteerId = volunteer.Id,
            StartTime = start,
            EndTime = end,
            Status = ShiftStatus.Scheduled,
        });
        await ctx.SaveChangesAsync();

        var service = new DispatchValidationService(ctx);
        var result = await service.ValidateDispatchAsync(dispatch.Id, new ValidateDispatchRequestDto(
            ProposedShiftStart: new DateTime(2026, 9, 20, 10, 0, 0, DateTimeKind.Utc),
            ProposedShiftEnd: new DateTime(2026, 9, 20, 18, 0, 0, DateTimeKind.Utc)));

        Assert.False(result.IsValid);
        Assert.Contains(result.Violations, v => v.Code == "V2_DOUBLE_BOOKING");
        // Double-booking alone is revisable (pick another volunteer/time)
        Assert.Equal("REVISE", result.Recommendation);
    }

    [Fact]
    public async Task ValidateDispatch_ShelterOverAllocation_ReturnsRevise_WithS2()
    {
        var (ctx, dispatch, _) = await SeedDispatchAsync(volunteerAvailable: true);
        var shelter = new Shelter
        {
            Name = "Test Shelter",
            Location = "Sector 7",
            TotalCapacity = 10,
            CurrentOccupancy = 9,
            Status = "Active",
        };
        ctx.Shelters.Add(shelter);
        await ctx.SaveChangesAsync();

        var service = new DispatchValidationService(ctx);
        var result = await service.ValidateDispatchAsync(dispatch.Id, new ValidateDispatchRequestDto(
            ShelterAllocations: [new ShelterAllocationDto(shelter.Id, 5)]));

        Assert.False(result.IsValid);
        Assert.Contains(result.Violations, v => v.Code == "S2_SHELTER_OVER_ALLOCATION");
        Assert.Equal("REVISE", result.Recommendation);
    }

    [Fact]
    public async Task ValidateDispatch_InsufficientInventory_ReturnsRevise_WithI1()
    {
        var (ctx, dispatch, _) = await SeedDispatchAsync(volunteerAvailable: true);
        var item = new InventoryItem
        {
            ItemName = "Field Medical Kit",
            Category = "Medical",
            Quantity = 2,
            MinimumThreshold = 10,
            Status = "InStock",
        };
        ctx.InventoryItems.Add(item);
        await ctx.SaveChangesAsync();

        var service = new DispatchValidationService(ctx);
        var result = await service.ValidateDispatchAsync(dispatch.Id, new ValidateDispatchRequestDto(
            InventoryRequests: [new InventoryRequestDto(item.Id, 10)]));

        Assert.False(result.IsValid);
        Assert.Contains(result.Violations, v => v.Code == "I1_INVENTORY_INSUFFICIENT");
    }

    [Fact]
    public async Task ValidateDispatch_NoTasks_ReturnsRevise_WithW0()
    {
        var ctx = GetInMemoryContext();
        var dispatch = new Dispatch { IncidentId = 1, Priority = "High", Status = "Proposed" };
        ctx.Dispatches.Add(dispatch);
        await ctx.SaveChangesAsync();

        var service = new DispatchValidationService(ctx);
        var result = await service.ValidateDispatchAsync(dispatch.Id, new ValidateDispatchRequestDto());

        Assert.True(result.IsValid);
        Assert.Equal("REVISE", result.Recommendation);
        Assert.Contains(result.Warnings, w => w.Code == "W0_EMPTY_DISPATCH");
        Assert.Empty(result.Checks);
    }

    [Fact]
    public async Task ValidateDispatch_UnknownDispatch_ThrowsNotFound()
    {
        var ctx = GetInMemoryContext();
        var service = new DispatchValidationService(ctx);

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => service.ValidateDispatchAsync(9999, new ValidateDispatchRequestDto()));
    }

    [Fact]
    public async Task ValidateDispatch_PersistsAudit_WithDurationAndHistory()
    {
        var (ctx, dispatch, _) = await SeedDispatchAsync(volunteerAvailable: true);
        var service = new DispatchValidationService(ctx);

        var result = await service.ValidateDispatchAsync(dispatch.Id, new ValidateDispatchRequestDto(), "coordinator@ercp.org");

        Assert.NotNull(result.AuditId);
        Assert.Equal("coordinator@ercp.org", result.ValidatedBy);
        Assert.True(result.DurationMs >= 0);
        Assert.Single(ctx.ValidationAudits);
        Assert.Equal(result.AuditId, ctx.ValidationAudits.Single().Id);

        var history = await service.GetHistoryAsync(dispatch.Id);
        Assert.Single(history);
        Assert.Equal("APPROVE", history[0].Recommendation);
        Assert.Equal(1, history[0].CheckCount);
    }

    [Fact]
    public async Task ValidateDispatch_EmitsTimelineEvent_WhenIncidentExists()
    {
        var ctx = GetInMemoryContext();
        var incident = new Incident
        {
            Title = "Timeline Incident",
            Description = "desc",
            Location = "Sector 1",
            Category = "Fire",
            Priority = "High",
            Status = "Reported",
        };
        ctx.Incidents.Add(incident);
        await ctx.SaveChangesAsync();

        var volunteer = new Volunteer
        {
            Name = "Timeline Responder",
            Email = "timeline@test.local",
            Phone = "0770000001",
            Skills = "medical",
            IsAvailable = true,
        };
        ctx.Volunteers.Add(volunteer);
        await ctx.SaveChangesAsync();

        var dispatch = new Dispatch { IncidentId = incident.Id, Priority = "High", Status = "Proposed" };
        ctx.Dispatches.Add(dispatch);
        await ctx.SaveChangesAsync();
        ctx.DispatchTasks.Add(new DispatchTask
        {
            DispatchId = dispatch.Id,
            VolunteerId = volunteer.Id,
            TaskType = "MedicalEvac",
            Status = "Assigned",
            AssignedAt = DateTime.UtcNow,
        });
        await ctx.SaveChangesAsync();

        var service = new DispatchValidationService(ctx);
        await service.ValidateDispatchAsync(dispatch.Id, new ValidateDispatchRequestDto(), "Coordinator");

        Assert.Single(ctx.IncidentTimelineEvents.Where(e => e.EventType == "ValidationPerformed"));
    }
}
