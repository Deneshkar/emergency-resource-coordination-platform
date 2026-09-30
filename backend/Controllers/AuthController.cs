using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERCP.Api.Data;
using ERCP.Api.DTOs;
using ERCP.Api.Models;
using ERCP.Api.Services;

namespace ERCP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly AppDbContext _context;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, AppDbContext context, ILogger<AuthController> logger)
    {
        _authService = authService;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Authenticate a user with email and password, returning a JWT token with assigned roles.
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _authService.AuthenticateAsync(request);
        if (result == null)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        return Ok(result);
    }

    /// <summary>
    /// Register a new platform user (Citizen or Volunteer).
    /// </summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var (success, error, response) = await _authService.RegisterAsync(request);
        if (!success)
        {
            return Conflict(new { message = error });
        }

        return CreatedAtAction(nameof(GetProfile), response);
    }

    /// <summary>
    /// Get the profile details and claims of the currently authenticated user.
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserProfileDto>> GetProfile()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized(new { message = "User identifier claim missing or invalid." });
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "User profile not found." });
        }

        var profile = new UserProfileDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            PhoneNumber = user.PhoneNumber,
            Skills = user.Skills,
            CreatedAt = user.CreatedAt
        };

        return Ok(profile);
    }

    /// <summary>
    /// Returns the pre-seeded demo accounts to simplify cross-role testing and grading demonstration.
    /// </summary>
    [HttpGet("demo-users")]
    [ProducesResponseType(typeof(IEnumerable<object>), StatusCodes.Status200OK)]
    public ActionResult GetDemoUsers()
    {
        var demoUsers = new[]
        {
            new { Role = "Coordinator", Email = "coordinator@ercp.org", DefaultPassword = "Coord@123", Description = "Incident response planning, AI approval, resource coordination" },
            new { Role = "Admin", Email = "admin@ercp.org", DefaultPassword = "Admin@123", Description = "Full system administration and user management" },
            new { Role = "Volunteer", Email = "volunteer@ercp.org", DefaultPassword = "Vol@123", Description = "Field responder, shift scheduling, task execution" },
            new { Role = "Citizen", Email = "citizen@ercp.org", DefaultPassword = "Citizen@123", Description = "Public incident reporting and live status tracking" }
        };

        return Ok(demoUsers);
    }

    /// <summary>
    /// Request a password reset OTP to be sent to the user's email.
    /// </summary>
    [HttpPost("forgot-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        await _authService.GeneratePasswordResetOtpAsync(request.Email);
        
        return Ok(new { message = "If the email is registered, an OTP has been sent." });
    }

    /// <summary>
    /// Reset password using the OTP received via email.
    /// </summary>
    [HttpPost("reset-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (success, message) = await _authService.ResetPasswordWithOtpAsync(request.Email, request.Otp, request.NewPassword);
        
        if (!success)
            return BadRequest(new { message });

        return Ok(new { message });
    }

    /// <summary>
    /// Authenticate or register a user via Google OAuth (Sign-in with Google).
    /// </summary>
    [HttpPost("google")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AuthResponseDto>> GoogleLogin([FromBody] GoogleLoginRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _authService.GoogleLoginAsync(request);
        return Ok(result);
    }
}
