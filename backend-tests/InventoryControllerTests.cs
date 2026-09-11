using Microsoft.EntityFrameworkCore;
using ERCP.Api.Data;
using ERCP.Api.Models;
using ERCP.Api.DTOs;
using ERCP.Api.Controllers;
using Xunit;

namespace ERCP.Api.Tests;

public class InventoryControllerTests
{
    private AppDbContext GetInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateInventoryItem_SetsLowStock_WhenBelowThreshold()
    {
        var context = GetInMemoryContext();
        var controller = new InventoryController(context);
        var dto = new CreateInventoryItemDto
        {
            ItemName = "First Aid Kit",
            Category = "Medical",
            Quantity = 5,
            MinimumThreshold = 10,
            UnitOfMeasure = "Kits"
        };

        var result = await controller.Create(dto);

        var createdResult = Assert.IsType<Microsoft.AspNetCore.Mvc.CreatedAtActionResult>(result.Result);
        var item = Assert.IsType<InventoryItemResponseDto>(createdResult.Value);
        Assert.Equal("LowStock", item.Status);
    }

    [Fact]
    public async Task AdjustStock_SubtractsQuantity_UpdatesStatus()
    {
        var context = GetInMemoryContext();
        var item = new InventoryItem
        {
            ItemName = "Bottled Water",
            Category = "Water",
            Quantity = 50,
            MinimumThreshold = 20,
            Status = "InStock"
        };
        context.InventoryItems.Add(item);
        await context.SaveChangesAsync();

        var controller = new InventoryController(context);
        var dto = new AdjustStockDto { QuantityAdjustment = -40 };

        var result = await controller.AdjustStock(item.Id, dto);

        Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(result);
        var updated = await context.InventoryItems.FindAsync(item.Id);
        Assert.Equal(10, updated!.Quantity);
        Assert.Equal("LowStock", updated.Status);
    }
}
