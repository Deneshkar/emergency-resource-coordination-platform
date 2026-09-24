using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERCP.Api.Data;
using ERCP.Api.Models;
using ERCP.Api.DTOs;

namespace ERCP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Coordinator,Admin,Volunteer")]
public class VolunteersController : ControllerBase
{
    private readonly AppDbContext _context;

    public VolunteersController(AppDbContext context)
    {
        _context = context;
    }

    // POST /api/volunteers
    [HttpPost]
    [Authorize(Roles = "Coordinator,Admin")]
    public async Task<ActionResult<VolunteerResponseDto>> Create([FromBody] CreateVolunteerDto dto)
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

    // DELETE /api/volunteers
    [HttpDelete]
    [Authorize(Roles = "Coordinator,Admin")]
    public async Task<IActionResult> DeleteAll()
    {
        var volunteerIds = await _context.Volunteers.Select(v => v.Id).ToListAsync();

        var shifts = await _context.Shifts.Where(s => volunteerIds.Contains(s.VolunteerId)).ToListAsync();
        _context.Shifts.RemoveRange(shifts);

        var volunteers = await _context.Volunteers.ToListAsync();
        _context.Volunteers.RemoveRange(volunteers);

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE /api/volunteers/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "Coordinator,Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var volunteer = await _context.Volunteers.FindAsync(id);
        if (volunteer == null) return NotFound();

        var shifts = await _context.Shifts.Where(s => s.VolunteerId == id).ToListAsync();
        _context.Shifts.RemoveRange(shifts);

        _context.Volunteers.Remove(volunteer);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // PUT /api/volunteers/{id} — Coordinator/Admin any record, Volunteer own record only
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<VolunteerResponseDto>> Update(Guid id, [FromBody] UpdateVolunteerDto dto)
    {
        var volunteer = await _context.Volunteers.FindAsync(id);
        if (volunteer == null) return NotFound();

        if (User?.Identity?.IsAuthenticated == true
            && !IsCoordinatorOrAdmin() && !IsOwnVolunteerRecord(volunteer))
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Volunteers are only permitted to update their own profile." });

        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(new { message = "Name is required." });
        if (string.IsNullOrWhiteSpace(dto.Phone))
            return BadRequest(new { message = "Phone is required." });
        if (string.IsNullOrWhiteSpace(dto.Skills))
            return BadRequest(new { message = "At least one skill is required." });

        volunteer.Name = dto.Name.Trim();
        volunteer.Phone = dto.Phone.Trim();
        volunteer.Skills = dto.Skills.Trim();
        volunteer.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(ToResponseDto(volunteer));
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
    public async Task<IActionResult> UpdateAvailability(Guid id, [FromBody] UpdateAvailabilityDto dto)
    {
        var volunteer = await _context.Volunteers.FindAsync(id);
        if (volunteer == null) return NotFound();

        // If authenticated, enforce that non-Coordinators/non-Admins can only toggle their own record
        if (User?.Identity?.IsAuthenticated == true)
        {
            var isCoordinatorOrAdmin = User.IsInRole("Coordinator") || User.IsInRole("Admin")
                || User.FindFirst(ClaimTypes.Role)?.Value == "Coordinator" || User.FindFirst(ClaimTypes.Role)?.Value == "Admin"
                || User.FindFirst("role")?.Value == "Coordinator" || User.FindFirst("role")?.Value == "Admin";

            if (!isCoordinatorOrAdmin)
            {
                var userEmail = User.FindFirst(ClaimTypes.Email)?.Value
                    ?? User.FindFirst("email")?.Value
                    ?? User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;

                if (string.IsNullOrWhiteSpace(userEmail) || !string.Equals(volunteer.Email, userEmail.Trim(), StringComparison.OrdinalIgnoreCase))
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "Volunteers are only permitted to update their own availability." });
                }
            }
        }

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

    // POST /api/volunteers/{id}/shifts
    [HttpPost("{id}/shifts")]
    [Authorize(Roles = "Coordinator,Admin")]
    public async Task<ActionResult<Shift>> CreateShift(Guid id, [FromBody] CreateShiftDto dto)
    {
        var exists = await _context.Volunteers.AnyAsync(v => v.Id == id);
        if (!exists) return NotFound();

        if (dto.EndTime <= dto.StartTime)
            return BadRequest(new { message = "Shift end time must be after start time." });

        if (!Enum.TryParse<ShiftStatus>(dto.Status, ignoreCase: true, out var status))
            return BadRequest(new { message = $"Invalid shift status '{dto.Status}'. Allowed: Scheduled, Active, Completed, Cancelled." });

        var shift = new Shift
        {
            VolunteerId = id,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            Status = status
        };

        _context.Shifts.Add(shift);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetShifts), new { id }, shift);
    }

    // PUT /api/volunteers/{id}/shifts/{shiftId} — Coordinator/Admin any, Volunteer own record only
    [HttpPut("{id:guid}/shifts/{shiftId:guid}")]
    public async Task<ActionResult<Shift>> UpdateShift(Guid id, Guid shiftId, [FromBody] UpdateShiftDto dto)
    {
        var volunteer = await _context.Volunteers.FindAsync(id);
        if (volunteer == null) return NotFound();

        if (User?.Identity?.IsAuthenticated == true
            && !IsCoordinatorOrAdmin() && !IsOwnVolunteerRecord(volunteer))
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Volunteers are only permitted to update their own shifts." });

        var shift = await _context.Shifts.FirstOrDefaultAsync(s => s.Id == shiftId && s.VolunteerId == id);
        if (shift == null) return NotFound();

        if (dto.EndTime <= dto.StartTime)
            return BadRequest(new { message = "Shift end time must be after start time." });

        if (!Enum.TryParse<ShiftStatus>(dto.Status, ignoreCase: true, out var status))
            return BadRequest(new { message = $"Invalid shift status '{dto.Status}'. Allowed: Scheduled, Active, Completed, Cancelled." });

        shift.StartTime = dto.StartTime;
        shift.EndTime = dto.EndTime;
        shift.Status = status;
        shift.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(shift);
    }

    // DELETE /api/volunteers/{id}/shifts/{shiftId} — Coordinator/Admin any, Volunteer own record only
    [HttpDelete("{id:guid}/shifts/{shiftId:guid}")]
    public async Task<IActionResult> DeleteShift(Guid id, Guid shiftId)
    {
        var volunteer = await _context.Volunteers.FindAsync(id);
        if (volunteer == null) return NotFound();

        if (User?.Identity?.IsAuthenticated == true
            && !IsCoordinatorOrAdmin() && !IsOwnVolunteerRecord(volunteer))
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Volunteers are only permitted to delete their own shifts." });

        var shift = await _context.Shifts.FirstOrDefaultAsync(s => s.Id == shiftId && s.VolunteerId == id);
        if (shift == null) return NotFound();

        _context.Shifts.Remove(shift);
        await _context.SaveChangesAsync();

        return NoContent();
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

    private bool IsCoordinatorOrAdmin()
    {
        if (User?.Identity?.IsAuthenticated != true) return false;
        return User.IsInRole("Coordinator") || User.IsInRole("Admin")
            || User.FindFirst(ClaimTypes.Role)?.Value == "Coordinator" || User.FindFirst(ClaimTypes.Role)?.Value == "Admin"
            || User.FindFirst("role")?.Value == "Coordinator" || User.FindFirst("role")?.Value == "Admin";
    }

    private bool IsOwnVolunteerRecord(Volunteer volunteer)
    {
        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value
            ?? User.FindFirst("email")?.Value
            ?? User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
        return !string.IsNullOrWhiteSpace(userEmail)
            && string.Equals(volunteer.Email, userEmail.Trim(), StringComparison.OrdinalIgnoreCase);
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