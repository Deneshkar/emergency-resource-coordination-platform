using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERCP.Api.Data;
using ERCP.Api.Models;
using ERCP.Api.DTOs;
using ERCP.Api.Controllers;
using Xunit;

namespace ERCP.Api.Tests;

/// <summary>Member 4 — edit volunteer + edit/delete shift (Coordinator/Admin any, Volunteer own only).</summary>
public class VolunteerEditTests
{
    private AppDbContext GetCtx()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task Update_ValidDto_UpdatesAndReturnsOk()
    {
        var ctx = GetCtx();
        var v = new Volunteer { Name = "Old", Email = "e@x.com", Phone = "111", Skills = "medical" };
        ctx.Volunteers.Add(v);
        await ctx.SaveChangesAsync();

        var c = new VolunteersController(ctx);
        var res = await c.Update(v.Id, new UpdateVolunteerDto { Name = "New", Phone = "222", Skills = "driving" });

        var ok = Assert.IsType<OkObjectResult>(res.Result);
        var dto = Assert.IsType<VolunteerResponseDto>(ok.Value);
        Assert.Equal("New", dto.Name);
        Assert.Equal("driving", dto.Skills);
    }

    [Fact]
    public async Task Update_BlankName_ReturnsBadRequest()
    {
        var ctx = GetCtx();
        var v = new Volunteer { Name = "N", Email = "e@x.com", Phone = "1", Skills = "s" };
        ctx.Volunteers.Add(v);
        await ctx.SaveChangesAsync();

        var c = new VolunteersController(ctx);
        var res = await c.Update(v.Id, new UpdateVolunteerDto { Name = " ", Phone = "1", Skills = "s" });

        Assert.IsType<BadRequestObjectResult>(res.Result);
    }

    [Fact]
    public async Task UpdateShift_ValidWindow_UpdatesStatus()
    {
        var ctx = GetCtx();
        var v = new Volunteer { Name = "N", Email = "e@x.com", Phone = "1", Skills = "s" };
        ctx.Volunteers.Add(v);
        await ctx.SaveChangesAsync();
        var s = new Shift { VolunteerId = v.Id, StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow.AddHours(4), Status = ShiftStatus.Scheduled };
        ctx.Shifts.Add(s);
        await ctx.SaveChangesAsync();

        var c = new VolunteersController(ctx);
        var res = await c.UpdateShift(v.Id, s.Id, new UpdateShiftDto
        {
            StartTime = s.StartTime,
            EndTime = s.EndTime.AddHours(1),
            Status = "Active"
        });

        var ok = Assert.IsType<OkObjectResult>(res.Result);
        var updated = Assert.IsType<Shift>(ok.Value);
        Assert.Equal(ShiftStatus.Active, updated.Status);
    }

    [Fact]
    public async Task UpdateShift_BadWindow_ReturnsBadRequest()
    {
        var ctx = GetCtx();
        var v = new Volunteer { Name = "N", Email = "e@x.com", Phone = "1", Skills = "s" };
        ctx.Volunteers.Add(v);
        await ctx.SaveChangesAsync();
        var s = new Shift { VolunteerId = v.Id, StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow.AddHours(4) };
        ctx.Shifts.Add(s);
        await ctx.SaveChangesAsync();

        var c = new VolunteersController(ctx);
        var res = await c.UpdateShift(v.Id, s.Id, new UpdateShiftDto
        {
            StartTime = s.EndTime,
            EndTime = s.StartTime,
            Status = "Active"
        });

        Assert.IsType<BadRequestObjectResult>(res.Result);
    }

    [Fact]
    public async Task DeleteShift_RemovesRecord_ReturnsNoContent()
    {
        var ctx = GetCtx();
        var v = new Volunteer { Name = "N", Email = "e@x.com", Phone = "1", Skills = "s" };
        ctx.Volunteers.Add(v);
        await ctx.SaveChangesAsync();
        var s = new Shift { VolunteerId = v.Id, StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow.AddHours(2) };
        ctx.Shifts.Add(s);
        await ctx.SaveChangesAsync();

        var c = new VolunteersController(ctx);
        var res = await c.DeleteShift(v.Id, s.Id);

        Assert.IsType<NoContentResult>(res);
        Assert.Empty(ctx.Shifts);
    }

    [Fact]
    public async Task DeleteShift_WrongVolunteer_ReturnsNotFound()
    {
        var ctx = GetCtx();
        var a = new Volunteer { Name = "A", Email = "a@x.com", Phone = "1", Skills = "s" };
        var b = new Volunteer { Name = "B", Email = "b@x.com", Phone = "2", Skills = "s" };
        ctx.Volunteers.AddRange(a, b);
        await ctx.SaveChangesAsync();
        var s = new Shift { VolunteerId = a.Id, StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow.AddHours(2) };
        ctx.Shifts.Add(s);
        await ctx.SaveChangesAsync();

        var c = new VolunteersController(ctx);
        var res = await c.DeleteShift(b.Id, s.Id);

        Assert.IsType<NotFoundResult>(res);
    }
}
