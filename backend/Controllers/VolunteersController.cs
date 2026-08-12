using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERCP.Api.Data;
using ERCP.Api.Models;
using ERCP.Api.DTOs;

namespace ERCP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VolunteersController : ControllerBase
{
    private readonly AppDbContext _context;

    public VolunteersController(AppDbContext context)
    {
        _context = context;
    }

    // POST /api/volunteers
    [HttpPost]
    public async Task<ActionResult<VolunteerResponseDto>> Create(CreateVolunteerDto dto)
    {
        var volunteer = new Volunteer
        {
            Name = dto.Name,
            Email = dto.Email,
            Phone = dto.Phone,
            Skills = dto.Skills
        };

        _context.Volunteers.Add(volunteer);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = volunteer.Id }, ToResponseDto(volunteer));
    }

    // GET /api/volunteers
    [HttpGet]
    public async Task<ActionResult<IEnumerable<VolunteerResponseDto>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] bool? isAvailable,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = _context.Volunteers.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(v => v.Name.Contains(search) || v.Skills.Contains(search));

        if (isAvailable.HasValue)
            query = query.Where(v => v.IsAvailable == isAvailable.Value);

        var volunteers = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(v => ToResponseDto(v))
            .ToListAsync();

        return Ok(volunteers);
    }

    // GET /api/volunteers/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<VolunteerResponseDto>> GetById(Guid id)
    {
        var volunteer = await _context.Volunteers.FindAsync(id);
        if (volunteer == null) return NotFound();

        return Ok(ToResponseDto(volunteer));
    }

    // PUT /api/volunteers/{id}/availability
    [HttpPut("{id}/availability")]
    public async Task<IActionResult> UpdateAvailability(Guid id, UpdateAvailabilityDto dto)
    {
        var volunteer = await _context.Volunteers.FindAsync(id);
        if (volunteer == null) return NotFound();

        volunteer.IsAvailable = dto.IsAvailable;
        volunteer.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // GET /api/volunteers/{id}/shifts
    [HttpGet("{id}/shifts")]
    public async Task<ActionResult<IEnumerable<Shift>>> GetShifts(Guid id)
    {
        var exists = await _context.Volunteers.AnyAsync(v => v.Id == id);
        if (!exists) return NotFound();

        var shifts = await _context.Shifts
            .Where(s => s.VolunteerId == id)
            .OrderByDescending(s => s.StartTime)
            .ToListAsync();

        return Ok(shifts);
    }

    // GET /api/volunteers/available?skill=medical
    [HttpGet("available")]
    public async Task<ActionResult<IEnumerable<VolunteerResponseDto>>> GetAvailableBySkill([FromQuery] string skill)
    {
        var volunteers = await _context.Volunteers
            .Where(v => v.IsAvailable && v.Skills.Contains(skill))
            .Select(v => ToResponseDto(v))
            .ToListAsync();

        return Ok(volunteers);
    }

    private static VolunteerResponseDto ToResponseDto(Volunteer v) => new()
    {
        Id = v.Id,
        Name = v.Name,
        Email = v.Email,
        Phone = v.Phone,
        Skills = v.Skills,
        IsAvailable = v.IsAvailable,
        Rating = v.Rating,
        CreatedAt = v.CreatedAt
    };
}