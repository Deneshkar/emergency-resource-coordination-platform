using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ERCP.Api.Data;
using ERCP.Api.DTOs;
using ERCP.Api.Models;

namespace ERCP.Api.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly PasswordHasher<User> _passwordHasher;
    private readonly ILogger<AuthService> _logger;

    public AuthService(AppDbContext context, IConfiguration configuration, ILogger<AuthService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _passwordHasher = new PasswordHasher<User>();
    }

    public async Task<AuthResponseDto?> AuthenticateAsync(LoginRequestDto request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
        if (user == null)
        {
            _logger.LogWarning("Authentication failed: User with email {Email} not found.", request.Email);
            return null;
        }

        var verificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verificationResult == PasswordVerificationResult.Failed)
        {
            _logger.LogWarning("Authentication failed: Invalid credentials for user {Email}.", request.Email);
            return null;
        }

        var token = GenerateJwtToken(user);
        var expiresAt = DateTime.UtcNow.AddHours(8);

        return new AuthResponseDto
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = MapToSummaryDto(user)
        };
    }

    public async Task<(bool Success, string? Error, AuthResponseDto? Response)> RegisterAsync(RegisterRequestDto request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var existingUser = await _context.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail);
        if (existingUser)
        {
            return (false, "An account with this email already exists.", null);
        }

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = normalizedEmail,
            Role = request.Role.Trim(),
            PhoneNumber = request.PhoneNumber?.Trim(),
            Skills = request.Skills?.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        if (string.Equals(user.Role, "Volunteer", StringComparison.OrdinalIgnoreCase))
        {
            var exists = await _context.Volunteers.AnyAsync(v => v.Email.ToLower() == user.Email.ToLower());
            if (!exists)
            {
                var responder = new Volunteer
                {
                    Name = user.FullName,
                    Email = user.Email,
                    Phone = user.PhoneNumber ?? "",
                    Skills = string.IsNullOrWhiteSpace(user.Skills) ? "General Field Operations" : user.Skills,
                    IsAvailable = true,
                    Rating = 5.0,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Volunteers.Add(responder);
                await _context.SaveChangesAsync();
            }
        }

        _logger.LogInformation("New user registered: {Email} with role {Role}", user.Email, user.Role);

        var token = GenerateJwtToken(user);
        var expiresAt = DateTime.UtcNow.AddHours(8);

        var response = new AuthResponseDto
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = MapToSummaryDto(user)
        };

        return (true, null, response);
    }

    public string GenerateJwtToken(User user)
    {
        var secretKey = _configuration["Jwt:SecretKey"] ?? "ERCP_EmergencyResourceCoordinationPlatform_SecretKey_2026!";
        var issuer = _configuration["Jwt:Issuer"] ?? "ERCP.Api";
        var audience = _configuration["Jwt:Audience"] ?? "ERCP.Clients";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Role, user.Role),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(8),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public string HashPassword(User user, string password)
    {
        return _passwordHasher.HashPassword(user, password);
    }

    public bool VerifyPassword(User user, string hashedPassword, string providedPassword)
    {
        var result = _passwordHasher.VerifyHashedPassword(user, hashedPassword, providedPassword);
        return result != PasswordVerificationResult.Failed;
    }

    private static UserSummaryDto MapToSummaryDto(User user) => new()
    {
        Id = user.Id,
        FullName = user.FullName,
        Email = user.Email,
        Role = user.Role,
        PhoneNumber = user.PhoneNumber,
        Skills = user.Skills
    };
}
