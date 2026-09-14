using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERCP.Api.Data;
using ERCP.Api.DTOs;
using ERCP.Api.Models;

namespace ERCP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SheltersController : ControllerBase
{
    private readonly AppDbContext _context;

    public SheltersController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/Shelters
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ShelterResponseDto>>> GetAll([FromQuery] string? status)
    {
        var query = _context.Shelters.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(s => s.Status == status);
        }

        var shelters = await query.ToListAsync();
        return Ok(shelters.Select(ToResponseDto));
    }

    // GET: api/Shelters/available
    [HttpGet("available")]
    public async Task<ActionResult<IEnumerable<ShelterResponseDto>>> GetAvailable()
    {
        var shelters = await _context.Shelters
            .Where(s => s.Status == "Active" && s.CurrentOccupancy < s.TotalCapacity)
            .AsNoTracking()
            .ToListAsync();

        return Ok(shelters.Select(ToResponseDto));
    }

    // GET: api/Shelters/5
    [HttpGet("{id}")]
    public async Task<ActionResult<ShelterResponseDto>> GetById(int id)
    {
        var shelter = await _context.Shelters.FindAsync(id);
        if (shelter == null)
            return NotFound(new { message = "Shelter not found." });

        return Ok(ToResponseDto(shelter));
    }

    // POST: api/Shelters
    [HttpPost]
    public async Task<ActionResult<ShelterResponseDto>> Create(CreateShelterDto dto)
    {
        var shelter = new Shelter
        {
            Name = dto.Name,
            Location = dto.Location,
            Address = dto.Address,
            TotalCapacity = dto.TotalCapacity,
            CurrentOccupancy = 0,
            Status = "Active",
            ContactNumber = dto.ContactNumber,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Shelters.Add(shelter);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = shelter.Id }, ToResponseDto(shelter));
    }

    // PUT: api/Shelters/5
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateShelterDto dto)
    {
        var shelter = await _context.Shelters.FindAsync(id);
        if (shelter == null)
            return NotFound(new { message = "Shelter not found." });

        shelter.Name = dto.Name;
        shelter.Location = dto.Location;
        shelter.Address = dto.Address;
        shelter.TotalCapacity = dto.TotalCapacity;
        shelter.CurrentOccupancy = dto.CurrentOccupancy;
        shelter.Status = dto.Status;
        shelter.ContactNumber = dto.ContactNumber;
        shelter.Latitude = dto.Latitude;
        shelter.Longitude = dto.Longitude;
        shelter.UpdatedAt = DateTime.UtcNow;

        if (shelter.CurrentOccupancy >= shelter.TotalCapacity)
            shelter.Status = "Full";

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // PUT: api/Shelters/5/occupancy (Business Specific Operation)
    [HttpPut("{id}/occupancy")]
    public async Task<IActionResult> UpdateOccupancy(int id, UpdateShelterOccupancyDto dto)
    {
        var shelter = await _context.Shelters.FindAsync(id);
        if (shelter == null)
            return NotFound(new { message = "Shelter not found." });

        if (dto.CurrentOccupancy < 0 || dto.CurrentOccupancy > shelter.TotalCapacity)
        {
            return BadRequest(new { message = $"Occupancy must be between 0 and total capacity ({shelter.TotalCapacity})." });
        }

        shelter.CurrentOccupancy = dto.CurrentOccupancy;
        shelter.Status = shelter.CurrentOccupancy >= shelter.TotalCapacity ? "Full" : "Active";
        shelter.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Shelter occupancy updated successfully.",
            currentOccupancy = shelter.CurrentOccupancy,
            availableCapacity = shelter.TotalCapacity - shelter.CurrentOccupancy,
            status = shelter.Status
        });
    }

    // DELETE: api/Shelters/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var shelter = await _context.Shelters.FindAsync(id);
        if (shelter == null)
            return NotFound(new { message = "Shelter not found." });

        _context.Shelters.Remove(shelter);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private static ShelterResponseDto ToResponseDto(Shelter shelter)
    {
        return new ShelterResponseDto
        {
            Id = shelter.Id,
            Name = shelter.Name,
            Location = shelter.Location,
            Address = shelter.Address,
            TotalCapacity = shelter.TotalCapacity,
            CurrentOccupancy = shelter.CurrentOccupancy,
            Status = shelter.Status,
            ContactNumber = shelter.ContactNumber,
            Latitude = shelter.Latitude,
            Longitude = shelter.Longitude,
            CreatedAt = shelter.CreatedAt,
            UpdatedAt = shelter.UpdatedAt
        };
    }
}
