using Microsoft.EntityFrameworkCore;
using ERCP.Api.Data;
using ERCP.Api.Models;
using ERCP.Api.DTOs;
using ERCP.Api.Controllers;
using Xunit;

namespace ERCP.Api.Tests;

public class ResourcesControllerTests
{
    private AppDbContext GetInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task Create_AddsResource_ReturnsCreated()
    {
        var context = GetInMemoryContext();
        var controller = new ResourcesController(context);
        var dto = new CreateResourceDto
        {
            Name = "Ambulance Unit 1",
            ResourceType = "Vehicle",
            Capacity = 4,
            Location = "Central Depot"
        };

        var result = await controller.Create(dto);

        var createdResult = Assert.IsType<Microsoft.AspNetCore.Mvc.CreatedAtActionResult>(result.Result);
        var resource = Assert.IsType<ResourceResponseDto>(createdResult.Value);
        Assert.Equal("Ambulance Unit 1", resource.Name);
        Assert.Equal("Available", resource.Status);
    }

    [Fact]
    public async Task UpdateStatus_ChangesResourceStatus()
    {
        var context = GetInMemoryContext();
        var resource = new Resource { Name = "Truck 1", ResourceType = "Vehicle", Status = "Available", Capacity = 2, Location = "North Station" };
        context.Resources.Add(resource);
        await context.SaveChangesAsync();

        var controller = new ResourcesController(context);
        var statusDto = new UpdateResourceStatusDto { Status = "Dispatched" };

        var actionResult = await controller.UpdateStatus(resource.Id, statusDto);

        Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(actionResult);
        var updated = await context.Resources.FindAsync(resource.Id);
        Assert.Equal("Dispatched", updated!.Status);
    }

    [Fact]
    public async Task GetAvailable_ReturnsOnlyAvailableResources()
    {
        var context = GetInMemoryContext();
        context.Resources.Add(new Resource { Name = "R1", Status = "Available" });
        context.Resources.Add(new Resource { Name = "R2", Status = "Dispatched" });
        context.Resources.Add(new Resource { Name = "R3", Status = "Maintenance" });
        await context.SaveChangesAsync();

        var controller = new ResourcesController(context);

        var result = await controller.GetAvailable();
        var okResult = Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(result.Result);
        var resources = Assert.IsAssignableFrom<IEnumerable<ResourceResponseDto>>(okResult.Value);

        Assert.Single(resources);
    }
}
