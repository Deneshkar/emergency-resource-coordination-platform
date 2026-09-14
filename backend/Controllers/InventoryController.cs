using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERCP.Api.Data;
using ERCP.Api.DTOs;
using ERCP.Api.Models;

namespace ERCP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InventoryController : ControllerBase
{
    private readonly AppDbContext _context;

    public InventoryController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/Inventory
    [HttpGet]
    public async Task<ActionResult<IEnumerable<InventoryItemResponseDto>>> GetAll(
        [FromQuery] string? category,
        [FromQuery] string? status)
    {
        var query = _context.InventoryItems
            .Include(i => i.Shelter)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(i => i.Category == category);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(i => i.Status == status);
        }

        var items = await query.ToListAsync();
        return Ok(items.Select(ToResponseDto));
    }

    // GET: api/Inventory/low-stock
    [HttpGet("low-stock")]
    public async Task<ActionResult<IEnumerable<InventoryItemResponseDto>>> GetLowStock()
    {
        var items = await _context.InventoryItems
            .Include(i => i.Shelter)
            .Where(i => i.Quantity <= i.MinimumThreshold)
            .AsNoTracking()
            .ToListAsync();

        return Ok(items.Select(ToResponseDto));
    }

    // GET: api/Inventory/5
    [HttpGet("{id}")]
    public async Task<ActionResult<InventoryItemResponseDto>> GetById(int id)
    {
        var item = await _context.InventoryItems
            .Include(i => i.Shelter)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (item == null)
            return NotFound(new { message = "Inventory item not found." });

        return Ok(ToResponseDto(item));
    }

    // POST: api/Inventory
    [HttpPost]
    public async Task<ActionResult<InventoryItemResponseDto>> Create(CreateInventoryItemDto dto)
    {
        if (dto.ShelterId.HasValue)
        {
            var shelterExists = await _context.Shelters.AnyAsync(s => s.Id == dto.ShelterId);
            if (!shelterExists)
                return BadRequest(new { message = "Associated Shelter does not exist." });
        }

        string status = dto.Quantity == 0 ? "OutOfStock" : dto.Quantity <= dto.MinimumThreshold ? "LowStock" : "InStock";

        var item = new InventoryItem
        {
            ItemName = dto.ItemName,
            Category = dto.Category,
            Quantity = dto.Quantity,
            UnitOfMeasure = dto.UnitOfMeasure,
            MinimumThreshold = dto.MinimumThreshold,
            ShelterId = dto.ShelterId,
            Location = dto.Location,
            Status = status,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.InventoryItems.Add(item);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = item.Id }, ToResponseDto(item));
    }

    // PUT: api/Inventory/5
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateInventoryItemDto dto)
    {
        var item = await _context.InventoryItems.FindAsync(id);
        if (item == null)
            return NotFound(new { message = "Inventory item not found." });

        if (dto.ShelterId.HasValue)
        {
            var shelterExists = await _context.Shelters.AnyAsync(s => s.Id == dto.ShelterId);
            if (!shelterExists)
                return BadRequest(new { message = "Associated Shelter does not exist." });
        }

        item.ItemName = dto.ItemName;
        item.Category = dto.Category;
        item.Quantity = dto.Quantity;
        item.UnitOfMeasure = dto.UnitOfMeasure;
        item.MinimumThreshold = dto.MinimumThreshold;
        item.ShelterId = dto.ShelterId;
        item.Location = dto.Location;
        item.Status = dto.Quantity == 0 ? "OutOfStock" : dto.Quantity <= dto.MinimumThreshold ? "LowStock" : "InStock";
        item.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // PUT: api/Inventory/5/adjust-stock (Business Specific Operation)
    [HttpPut("{id}/adjust-stock")]
    public async Task<IActionResult> AdjustStock(int id, AdjustStockDto dto)
    {
        var item = await _context.InventoryItems.FindAsync(id);
        if (item == null)
            return NotFound(new { message = "Inventory item not found." });

        int newQuantity = item.Quantity + dto.QuantityAdjustment;
        if (newQuantity < 0)
        {
            return BadRequest(new { message = "Stock adjustment results in negative quantity." });
        }

        item.Quantity = newQuantity;
        item.Status = item.Quantity == 0 ? "OutOfStock" : item.Quantity <= item.MinimumThreshold ? "LowStock" : "InStock";
        item.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Stock adjusted successfully.",
            quantity = item.Quantity,
            status = item.Status
        });
    }

    // DELETE: api/Inventory/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _context.InventoryItems.FindAsync(id);
        if (item == null)
            return NotFound(new { message = "Inventory item not found." });

        _context.InventoryItems.Remove(item);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private static InventoryItemResponseDto ToResponseDto(InventoryItem item)
    {
        return new InventoryItemResponseDto
        {
            Id = item.Id,
            ItemName = item.ItemName,
            Category = item.Category,
            Quantity = item.Quantity,
            UnitOfMeasure = item.UnitOfMeasure,
            MinimumThreshold = item.MinimumThreshold,
            ShelterId = item.ShelterId,
            ShelterName = item.Shelter?.Name,
            Location = item.Location,
            Status = item.Status,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt
        };
    }
}
