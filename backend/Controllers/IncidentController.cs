using ERCP.Api.Data;
using ERCP.Api.DTOs;
using ERCP.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ERCP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IncidentController : ControllerBase
{
    private readonly AppDbContext _context;

    public IncidentController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/incident
    [HttpGet]
    public async Task<ActionResult<IEnumerable<IncidentResponseDto>>> GetIncidents()
    {
        var incidents = await _context.Incidents
            .Select(i => new IncidentResponseDto
            {
                Id = i.Id,
                Title = i.Title,
                Description = i.Description,
                Location = i.Location,
                Status = i.Status,
                Priority = i.Priority,
                CreatedAt = i.CreatedAt
            })
            .ToListAsync();

        return Ok(incidents);
    }

    // GET: api/incident/1
    [HttpGet("{id}")]
    public async Task<ActionResult<IncidentResponseDto>> GetIncident(int id)
    {
        var incident = await _context.Incidents.FindAsync(id);

        if (incident == null)
            return NotFound();

        return Ok(new IncidentResponseDto
        {
            Id = incident.Id,
            Title = incident.Title,
            Description = incident.Description,
            Location = incident.Location,
            Status = incident.Status,
            Priority = incident.Priority,
            CreatedAt = incident.CreatedAt
        });
    }

    // POST: api/incident
    [HttpPost]
    public async Task<ActionResult<IncidentResponseDto>> CreateIncident(
        CreateIncidentDto dto)
    {
        var incident = new Incident
        {
            Title = dto.Title,
            Description = dto.Description,
            Location = dto.Location,
            Priority = dto.Priority
        };

        _context.Incidents.Add(incident);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetIncident),
            new { id = incident.Id },
            new IncidentResponseDto
            {
                Id = incident.Id,
                Title = incident.Title,
                Description = incident.Description,
                Location = incident.Location,
                Status = incident.Status,
                Priority = incident.Priority,
                CreatedAt = incident.CreatedAt
            });
    }

    // PUT: api/incident/1
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateIncident(
        int id,
        UpdateIncidentDto dto)
    {
        var incident = await _context.Incidents.FindAsync(id);

        if (incident == null)
            return NotFound();

        if (!string.IsNullOrEmpty(dto.Status))
            incident.Status = dto.Status;

        if (!string.IsNullOrEmpty(dto.Priority))
            incident.Priority = dto.Priority;

        incident.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/incident/1
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteIncident(int id)
    {
        var incident = await _context.Incidents.FindAsync(id);

        if (incident == null)
            return NotFound();

        _context.Incidents.Remove(incident);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}