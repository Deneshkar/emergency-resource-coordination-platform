using Microsoft.EntityFrameworkCore;
using ERCP.Api.Data;
using ERCP.Api.Models;
using ERCP.Api.DTOs;
using ERCP.Api.Controllers;
using Xunit;

namespace ERCP.Api.Tests;

public class SheltersControllerTests
{
    private AppDbContext GetInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateShelter_ReturnsCreated()
    {
        var context = GetInMemoryContext();
        var controller = new SheltersController(context);
        var dto = new CreateShelterDto
        {
            Name = "City Hall Shelter",
            Location = "Downtown",
            Address = "123 Main St",
            TotalCapacity = 200,
            ContactNumber = "0771234567"
        };

        var result = await controller.Create(dto);

        var createdResult = Assert.IsType<Microsoft.AspNetCore.Mvc.CreatedAtActionResult>(result.Result);
        var shelter = Assert.IsType<ShelterResponseDto>(createdResult.Value);
        Assert.Equal("City Hall Shelter", shelter.Name);
        Assert.Equal(200, shelter.TotalCapacity);
        Assert.Equal(200, shelter.AvailableCapacity);
    }

    [Fact]
    public async Task UpdateOccupancy_UpdatesStatusToFull_WhenCapacityReached()
    {
        var context = GetInMemoryContext();
        var shelter = new Shelter
        {
            Name = "School Shelter",
            TotalCapacity = 50,
            CurrentOccupancy = 10,
            Status = "Active"
        };
        context.Shelters.Add(shelter);
        await context.SaveChangesAsync();

        var controller = new SheltersController(context);
        var dto = new UpdateShelterOccupancyDto { CurrentOccupancy = 50 };

        var result = await controller.UpdateOccupancy(shelter.Id, dto);

        Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(result);
        var updated = await context.Shelters.FindAsync(shelter.Id);
        Assert.Equal(50, updated!.CurrentOccupancy);
        Assert.Equal("Full", updated.Status);
    }

    [Fact]
    public async Task UpdateOccupancy_ReturnsBadRequest_WhenOccupancyExceedsTotalCapacity()
    {
        var context = GetInMemoryContext();
        var shelter = new Shelter
        {
            Name = "Community Center",
            TotalCapacity = 100,
            CurrentOccupancy = 50,
            Status = "Active"
        };
        context.Shelters.Add(shelter);
        await context.SaveChangesAsync();

        var controller = new SheltersController(context);
        var dto = new UpdateShelterOccupancyDto { CurrentOccupancy = 150 };

        var result = await controller.UpdateOccupancy(shelter.Id, dto);

        Assert.IsType<Microsoft.AspNetCore.Mvc.BadRequestObjectResult>(result);
    }
}

