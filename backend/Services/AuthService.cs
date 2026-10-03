using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Collections.Concurrent;
using System.Net.Http.Headers;
using System.Text.Json;
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
    private readonly IHttpClientFactory? _httpClientFactory;

    // Secure in-memory OTP cache for demo purposes (avoids DB migrations)
    private static readonly ConcurrentDictionary<string, (string Otp, DateTime Expiry)> _otpStore = new(StringComparer.OrdinalIgnoreCase);

    public AuthService(
        AppDbContext context,
        IConfiguration configuration,
        ILogger<AuthService> logger,
        IEmailService emailService,
        IHttpClientFactory? httpClientFactory = null)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _emailService = emailService;
        _httpClientFactory = httpClientFactory;
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

    public async Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginRequestDto request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
        if (user == null)
        {
            user = new User
            {
                FullName = string.IsNullOrWhiteSpace(request.Name) ? normalizedEmail.Split('@')[0] : request.Name.Trim(),
                Email = normalizedEmail,
                Role = "Citizen",
                PhoneNumber = "",
                Skills = "Google Authenticated",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            user.PasswordHash = _passwordHasher.HashPassword(user, Guid.NewGuid().ToString("N"));
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            _logger.LogInformation("New user created via Google Sign-In: {Email}", user.Email);
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

    public async Task<AuthResponseDto> GithubLoginAsync(GithubLoginRequestDto request)
    {
        var clientId = _configuration["GitHub:ClientId"]
            ?? Environment.GetEnvironmentVariable("GITHUB_CLIENT_ID")
            ?? "Ov23liWTjFyFPOxBL4Xe";
        var clientSecret = _configuration["GitHub:ClientSecret"]
            ?? Environment.GetEnvironmentVariable("GITHUB_CLIENT_SECRET")
            ?? "e718a026e1e24ac8b7fe83c441dec20fe25531a7";

        var client = _httpClientFactory != null ? _httpClientFactory.CreateClient() : new HttpClient();
        client.DefaultRequestHeaders.UserAgent.ParseAdd("ERCP-EmergencyPlatform");
        client.DefaultRequestHeaders.Accept.Clear();
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        // Step 1: Exchange code for access_token with GitHub OAuth
        var tokenParams = new Dictionary<string, string>
        {
            { "client_id", clientId },
            { "client_secret", clientSecret },
            { "code", request.Code }
        };

        if (!string.IsNullOrWhiteSpace(request.RedirectUri))
        {
            tokenParams["redirect_uri"] = request.RedirectUri;
        }

        var tokenRequest = new HttpRequestMessage(HttpMethod.Post, "https://github.com/login/oauth/access_token")
        {
            Content = new FormUrlEncodedContent(tokenParams)
        };

        var tokenResponse = await client.SendAsync(tokenRequest);
        if (!tokenResponse.IsSuccessStatusCode)
        {
            var err = await tokenResponse.Content.ReadAsStringAsync();
            _logger.LogError("Failed to get GitHub access token: {Error}", err);
            throw new InvalidOperationException("Failed to exchange GitHub authorization code.");
        }

        var tokenJson = await tokenResponse.Content.ReadAsStringAsync();
        using var tokenDoc = JsonDocument.Parse(tokenJson);
        if (tokenDoc.RootElement.TryGetProperty("error", out var errorProp))
        {
            var desc = tokenDoc.RootElement.TryGetProperty("error_description", out var d) ? d.GetString() : errorProp.GetString();
            _logger.LogError("GitHub OAuth error: {Description}", desc);
            throw new InvalidOperationException($"GitHub authentication failed: {desc}");
        }

        var accessToken = tokenDoc.RootElement.GetProperty("access_token").GetString();
        if (string.IsNullOrEmpty(accessToken))
        {
            throw new InvalidOperationException("Did not receive a valid access token from GitHub.");
        }

        // Step 2: Fetch user profile
        var userRequest = new HttpRequestMessage(HttpMethod.Get, "https://api.github.com/user");
        userRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        var userResponse = await client.SendAsync(userRequest);
        if (!userResponse.IsSuccessStatusCode)
        {
            throw new InvalidOperationException("Failed to fetch GitHub profile.");
        }

        var userJson = await userResponse.Content.ReadAsStringAsync();
        using var userDoc = JsonDocument.Parse(userJson);
        var githubLogin = userDoc.RootElement.GetProperty("login").GetString() ?? "github_user";
        var name = userDoc.RootElement.TryGetProperty("name", out var nameProp) && nameProp.ValueKind == JsonValueKind.String
            ? nameProp.GetString()
            : null;
        var email = userDoc.RootElement.TryGetProperty("email", out var emailProp) && emailProp.ValueKind == JsonValueKind.String
            ? emailProp.GetString()
            : null;

        // Step 3: If email is private/null, fetch user emails
        if (string.IsNullOrWhiteSpace(email))
        {
            try
            {
                var emailsRequest = new HttpRequestMessage(HttpMethod.Get, "https://api.github.com/user/emails");
                emailsRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                var emailsResponse = await client.SendAsync(emailsRequest);
                if (emailsResponse.IsSuccessStatusCode)
                {
                    var emailsJson = await emailsResponse.Content.ReadAsStringAsync();
                    using var emailsDoc = JsonDocument.Parse(emailsJson);
                    foreach (var elem in emailsDoc.RootElement.EnumerateArray())
                    {
                        var e = elem.GetProperty("email").GetString();
                        var isPrimary = elem.TryGetProperty("primary", out var p) && p.GetBoolean();
                        var isVerified = elem.TryGetProperty("verified", out var v) && v.GetBoolean();
                        if (isPrimary && isVerified && !string.IsNullOrEmpty(e))
                        {
                            email = e;
                            break;
                        }
                        if (isVerified && string.IsNullOrEmpty(email) && !string.IsNullOrEmpty(e))
                        {
                            email = e;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to retrieve GitHub user emails.");
            }
        }

        // Fallback email if still missing
        if (string.IsNullOrWhiteSpace(email))
        {
            email = $"{githubLogin.ToLowerInvariant()}@users.noreply.github.com";
        }

        var normalizedEmail = email.Trim().ToLowerInvariant();
        var displayName = !string.IsNullOrWhiteSpace(name) ? name.Trim() : githubLogin;

        // Step 4: Find or create user
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
        if (user == null)
        {
            user = new User
            {
                FullName = displayName,
                Email = normalizedEmail,
                Role = "Citizen",
                PhoneNumber = "",
                Skills = $"GitHub Authenticated (@{githubLogin})",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            user.PasswordHash = _passwordHasher.HashPassword(user, Guid.NewGuid().ToString("N"));
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            _logger.LogInformation("New user created via GitHub Sign-In: {Email} (@{Login})", user.Email, githubLogin);
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
