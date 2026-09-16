using Microsoft.AspNetCore.Mvc;
using ERCP.Api.Services;

namespace ERCP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GeolocationController : ControllerBase
{
    private readonly GeolocationService _geolocationService;

    public GeolocationController(GeolocationService geolocationService)
    {
        _geolocationService = geolocationService;
    }

    /// <summary>
    /// Gets nearest shelters to the provided latitude/longitude coordinates.
    /// </summary>
    [HttpGet("nearest-shelters")]
    public async Task<ActionResult<List<NearestShelterDto>>> GetNearestShelters(
        [FromQuery] double lat = 6.9271, 
        [FromQuery] double lng = 79.8612, 
        [FromQuery] int limit = 5)
    {
        var shelters = await _geolocationService.GetNearestSheltersAsync(lat, lng, limit);
        return Ok(shelters);
    }

    /// <summary>
    /// Geocodes an address string using OpenStreetMap Nominatim 3rd-party API.
    /// </summary>
    [HttpGet("geocode")]
    public async Task<ActionResult<GeocodeResultDto>> GeocodeAddress([FromQuery] string address)
    {
        if (string.IsNullOrWhiteSpace(address))
        {
            return BadRequest(new { message = "Address parameter is required." });
        }

        var result = await _geolocationService.GeocodeAddressAsync(address);
        if (result == null)
        {
            return NotFound(new { message = $"Could not geocode address: {address}" });
        }

        return Ok(result);
    }
}
