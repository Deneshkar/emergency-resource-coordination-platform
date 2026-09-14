using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERCP.Api.Data;
using ERCP.Api.DTOs;
using ERCP.Api.Models;

namespace ERCP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ResourcesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ResourcesController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/Resources
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ResourceResponseDto>>> GetAll(
        [FromQuery] string? resourceType,
        [FromQuery] string? status)
    {
        var query = _context.Resources
            .Include(r => r.Shelter)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(resourceType))
        {
            query = query.Where(r => r.ResourceType == resourceType);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(r => r.Status == status);
        }

        var resources = await query.ToListAsync();

        return Ok(resources.Select(ToResponseDto));
    }

    // GET: api/Resources/available
    [HttpGet("available")]
    public async Task<ActionResult<IEnumerable<ResourceResponseDto>>> GetAvailable()
    {
        var resources = await _context.Resources
            .Include(r => r.Shelter)
            .Where(r => r.Status == "Available")
            .AsNoTracking()
            .ToListAsync();

        return Ok(resources.Select(ToResponseDto));
    }

    // GET: api/Resources/5
    [HttpGet("{id}")]
    public async Task<ActionResult<ResourceResponseDto>> GetById(int id)
    {
        var resource = await _context.Resources
            .Include(r => r.Shelter)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (resource == null)
            return NotFound(new { message = "Resource not found." });

        return Ok(ToResponseDto(resource));
    }

    // POST: api/Resources
    [HttpPost]
    public async Task<ActionResult<ResourceResponseDto>> Create(CreateResourceDto dto)
    {
        if (dto.ShelterId.HasValue)
        {
            var shelterExists = await _context.Shelters.AnyAsync(s => s.Id == dto.ShelterId);
            if (!shelterExists)
                return BadRequest(new { message = "Associated Shelter does not exist." });
        }

        var resource = new Resource
        {
            Name = dto.Name,
            ResourceType = dto.ResourceType,
            Capacity = dto.Capacity,
            Location = dto.Location,
            ShelterId = dto.ShelterId,
            Status = "Available",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Resources.Add(resource);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = resource.Id }, ToResponseDto(resource));
    }

    // PUT: api/Resources/5
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateResourceDto dto)
    {
        var resource = await _context.Resources.FindAsync(id);
        if (resource == null)
            return NotFound(new { message = "Resource not found." });

        if (dto.ShelterId.HasValue)
        {
            var shelterExists = await _context.Shelters.AnyAsync(s => s.Id == dto.ShelterId);
            if (!shelterExists)
                return BadRequest(new { message = "Associated Shelter does not exist." });
        }

        resource.Name = dto.Name;
        resource.ResourceType = dto.ResourceType;
        resource.Status = dto.Status;
        resource.Capacity = dto.Capacity;
        resource.Location = dto.Location;
        resource.ShelterId = dto.ShelterId;
        resource.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // PUT: api/Resources/5/status (Business Specific Operation)
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, UpdateResourceStatusDto dto)
    {
        var resource = await _context.Resources.FindAsync(id);
        if (resource == null)
            return NotFound(new { message = "Resource not found." });

        var allowedStatuses = new[] { "Available", "Dispatched", "Maintenance", "Reserved" };
        if (!allowedStatuses.Contains(dto.Status))
            return BadRequest(new { message = "Invalid resource status." });

        resource.Status = dto.Status;
        resource.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Resource status updated successfully.", status = resource.Status });
    }

    // DELETE: api/Resources/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var resource = await _context.Resources.FindAsync(id);
        if (resource == null)
            return NotFound(new { message = "Resource not found." });

        _context.Resources.Remove(resource);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private static ResourceResponseDto ToResponseDto(Resource resource)
    {
        return new ResourceResponseDto
        {
            Id = resource.Id,
            Name = resource.Name,
            ResourceType = resource.ResourceType,
            Status = resource.Status,
            Capacity = resource.Capacity,
            Location = resource.Location,
            ShelterId = resource.ShelterId,
            ShelterName = resource.Shelter?.Name,
            CreatedAt = resource.CreatedAt,
            UpdatedAt = resource.UpdatedAt
        };
    }
}
