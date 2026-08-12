using Microsoft.EntityFrameworkCore;
using ERCP.Api.Data;
using ERCP.Api.Models;
using ERCP.Api.DTOs;
using ERCP.Api.Controllers;
using Xunit;

namespace ERCP.Api.Tests;

public class VolunteersControllerTests
{
    private AppDbContext GetInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()) // fresh DB per test
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task Create_AddsVolunteer_ReturnsCreated()
    {
        // Arrange
        var context = GetInMemoryContext();
        var controller = new VolunteersController(context);
        var dto = new CreateVolunteerDto
        {
            Name = "Test Volunteer",
            Email = "test@example.com",
            Phone = "0770000000",
            Skills = "medical"
        };

        // Act
        var result = await controller.Create(dto);

        // Assert
        var createdResult = Assert.IsType<Microsoft.AspNetCore.Mvc.CreatedAtActionResult>(result.Result);
        var volunteer = Assert.IsType<VolunteerResponseDto>(createdResult.Value);
        Assert.Equal("Test Volunteer", volunteer.Name);
        Assert.True(volunteer.IsAvailable); // default should be true
    }

    [Fact]
    public async Task GetAvailableBySkill_ReturnsOnlyMatchingAndAvailable()
    {
        // Arrange
        var context = GetInMemoryContext();
        context.Volunteers.Add(new Volunteer { Name = "A", Email = "a@x.com", Phone = "1", Skills = "medical", IsAvailable = true });
        context.Volunteers.Add(new Volunteer { Name = "B", Email = "b@x.com", Phone = "2", Skills = "medical", IsAvailable = false });
        context.Volunteers.Add(new Volunteer { Name = "C", Email = "c@x.com", Phone = "3", Skills = "driving", IsAvailable = true });
        await context.SaveChangesAsync();

        var controller = new VolunteersController(context);

        // Act
        var result = await controller.GetAvailableBySkill("medical");

        // Assert
        var okResult = Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(result.Result);
        var volunteers = Assert.IsAssignableFrom<IEnumerable<VolunteerResponseDto>>(okResult.Value);
        Assert.Single(volunteers); // only "A" should match: medical + available
    }

    [Fact]
    public async Task UpdateAvailability_SetsIsAvailableFalse()
    {
        // Arrange
        var context = GetInMemoryContext();
        var volunteer = new Volunteer { Name = "A", Email = "a@x.com", Phone = "1", Skills = "medical", IsAvailable = true };
        context.Volunteers.Add(volunteer);
        await context.SaveChangesAsync();

        var controller = new VolunteersController(context);
        var dto = new UpdateAvailabilityDto { IsAvailable = false };

        // Act
        await controller.UpdateAvailability(volunteer.Id, dto);

        // Assert
        var updated = await context.Volunteers.FindAsync(volunteer.Id);
        Assert.False(updated!.IsAvailable);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenVolunteerDoesNotExist()
    {
        // Arrange
        var context = GetInMemoryContext();
        var controller = new VolunteersController(context);

        // Act
        var result = await controller.GetById(Guid.NewGuid());

        // Assert
        Assert.IsType<Microsoft.AspNetCore.Mvc.NotFoundResult>(result.Result);
    }
}