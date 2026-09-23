using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Collections.Concurrent;
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
    private readonly IEmailService _emailService;

    // Secure in-memory OTP cache for demo purposes (avoids DB migrations)
    private static readonly ConcurrentDictionary<string, (string Otp, DateTime Expiry)> _otpStore = new(StringComparer.OrdinalIgnoreCase);

    public AuthService(AppDbContext context, IConfiguration configuration, ILogger<AuthService> logger, IEmailService emailService)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _emailService = emailService;
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
            new("role", user.Role), // Add custom lowercase role claim for standard client compatibility
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

    public async Task<bool> GeneratePasswordResetOtpAsync(string email)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
        
        if (user == null)
        {
            _logger.LogWarning("Password reset requested for unknown email: {Email}", email);
            // We return true anyway to prevent email enumeration attacks
            return true;
        }

        // Generate 6-digit OTP
        var random = new Random();
        var otp = random.Next(100000, 999999).ToString();
        var expiry = DateTime.UtcNow.AddMinutes(10);

        _otpStore[normalizedEmail] = (otp, expiry);

        var subject = "🔒 HEXORA: Your Password Reset OTP";
        var htmlBody = $@"
            <h2>Password Reset Request</h2>
            <p>Hi {user.FullName},</p>
            <p>We received a request to reset your password. Here is your One-Time Password (OTP):</p>
            <h1 style='color: #06b6d4; font-size: 32px; letter-spacing: 4px;'>{otp}</h1>
            <p>This code will expire in 10 minutes.</p>
            <p>If you did not request this reset, please ignore this email.</p>
        ";

        // Send email in background (Fire and forget) to not block the API
        _ = Task.Run(async () => {
            try {
                await _emailService.SendEmailAsync(user.Email, subject, htmlBody);
                _logger.LogInformation("Password reset OTP sent to {Email}", user.Email);
            } catch (Exception ex) {
                _logger.LogError(ex, "Failed to send OTP email to {Email}", user.Email);
            }
        });

        return true;
    }

    public async Task<(bool Success, string Message)> ResetPasswordWithOtpAsync(string email, string otp, string newPassword)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        
        if (!_otpStore.TryGetValue(normalizedEmail, out var otpData))
        {
            return (false, "No active password reset request found. Please request a new OTP.");
        }

        if (DateTime.UtcNow > otpData.Expiry)
        {
            _otpStore.TryRemove(normalizedEmail, out _);
            return (false, "OTP has expired. Please request a new one.");
        }

        if (otpData.Otp != otp.Trim())
        {
            return (false, "Invalid OTP code.");
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
        if (user == null)
        {
            return (false, "User not found.");
        }

        user.PasswordHash = _passwordHasher.HashPassword(user, newPassword);
        user.UpdatedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        _otpStore.TryRemove(normalizedEmail, out _); // Clean up used OTP

        _logger.LogInformation("Password successfully reset for {Email}", email);
        return (true, "Password successfully reset.");
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
