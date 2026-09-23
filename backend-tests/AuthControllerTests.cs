using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using ERCP.Api.Controllers;
using ERCP.Api.Data;
using ERCP.Api.DTOs;
using ERCP.Api.Models;
using ERCP.Api.Services;
using Xunit;

namespace ERCP.Api.Tests;

public class AuthControllerTests
{
    private AppDbContext GetInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private (AuthController Controller, AuthService AuthService, AppDbContext Context) CreateController(AppDbContext context)
    {
        var inMemorySettings = new Dictionary<string, string?>
        {
            {"Jwt:Issuer", "ERCP.Api"},
            {"Jwt:Audience", "ERCP.Clients"},
            {"Jwt:SecretKey", "DEVELOPMENT_ONLY_SecretKey_MustBeChangedInProduction!!"}
        };

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        var authLogger = NullLogger<AuthService>.Instance;
        var controllerLogger = NullLogger<AuthController>.Instance;

        var authService = new AuthService(context, configuration, authLogger);
        var controller = new AuthController(authService, context, controllerLogger);

        return (controller, authService, context);
    }

    [Fact]
    public async Task Register_NewCitizen_ReturnsCreatedWithToken()
    {
        // Arrange
        var context = GetInMemoryContext();
        var (controller, _, _) = CreateController(context);

        var dto = new RegisterRequestDto
        {
            FullName = "John Doe",
            Email = "john@example.com",
            Password = "Password123!",
            Role = "Citizen",
            PhoneNumber = "+123456789"
        };

        // Act
        var result = await controller.Register(dto);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var authResponse = Assert.IsType<AuthResponseDto>(createdResult.Value);

        Assert.NotEmpty(authResponse.Token);
        Assert.Equal("john@example.com", authResponse.User.Email);
        Assert.Equal("Citizen", authResponse.User.Role);
        Assert.Equal("John Doe", authResponse.User.FullName);
    }

    [Fact]
    public async Task Register_DuplicateEmail_ReturnsConflict()
    {
        // Arrange
        var context = GetInMemoryContext();
        var (controller, _, _) = CreateController(context);

        var dto = new RegisterRequestDto
        {
            FullName = "First User",
            Email = "duplicate@example.com",
            Password = "Password123!",
            Role = "Citizen"
        };

        await controller.Register(dto);

        // Act - Register again with same email
        var duplicateDto = new RegisterRequestDto
        {
            FullName = "Second User",
            Email = "duplicate@example.com",
            Password = "Password456!",
            Role = "Volunteer"
        };
        var result = await controller.Register(duplicateDto);

        // Assert
        Assert.IsType<ConflictObjectResult>(result.Result);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsOkWithJwt()
    {
        // Arrange
        var context = GetInMemoryContext();
        var (controller, _, _) = CreateController(context);

        await controller.Register(new RegisterRequestDto
        {
            FullName = "Jane Coordinator",
            Email = "coordinator@test.com",
            Password = "CoordSecret123!",
            Role = "Coordinator"
        });

        // Act
        var loginResult = await controller.Login(new LoginRequestDto
        {
            Email = "coordinator@test.com",
            Password = "CoordSecret123!"
        });

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(loginResult.Result);
        var response = Assert.IsType<AuthResponseDto>(okResult.Value);

        Assert.NotEmpty(response.Token);
        Assert.Equal("Coordinator", response.User.Role);
        Assert.Equal("coordinator@test.com", response.User.Email);
    }

    [Fact]
    public async Task Login_WithIncorrectPassword_ReturnsUnauthorized()
    {
        // Arrange
        var context = GetInMemoryContext();
        var (controller, _, _) = CreateController(context);

        await controller.Register(new RegisterRequestDto
        {
            FullName = "Valid User",
            Email = "valid@test.com",
            Password = "CorrectPassword1!",
            Role = "Volunteer"
        });

        // Act
        var loginResult = await controller.Login(new LoginRequestDto
        {
            Email = "valid@test.com",
            Password = "WrongPassword!"
        });

        // Assert
        Assert.IsType<UnauthorizedObjectResult>(loginResult.Result);
    }

    [Fact]
    public void GetDemoUsers_ReturnsFourStandardRoleAccounts()
    {
        // Arrange
        var context = GetInMemoryContext();
        var (controller, _, _) = CreateController(context);

        // Act
        var result = controller.GetDemoUsers();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var demoUsers = Assert.IsAssignableFrom<IEnumerable<object>>(okResult.Value);
        Assert.Equal(4, demoUsers.Count());
    }

    [Fact]
    public async Task GetProfile_WithAuthenticatedClaim_ReturnsUserProfile()
    {
        // Arrange
        var context = GetInMemoryContext();
        var (controller, authService, _) = CreateController(context);

        var regResult = await authService.RegisterAsync(new RegisterRequestDto
        {
            FullName = "Alice Walker",
            Email = "alice@example.com",
            Password = "SecretPassword1!",
            Role = "Coordinator"
        });

        var userId = regResult.Response!.User.Id;

        // Mock HttpContext User claims
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Email, "alice@example.com"),
            new(ClaimTypes.Role, "Coordinator")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };

        // Act
        var profileResult = await controller.GetProfile();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(profileResult.Result);
        var profile = Assert.IsType<UserProfileDto>(okResult.Value);

        Assert.Equal(userId, profile.Id);
        Assert.Equal("alice@example.com", profile.Email);
        Assert.Equal("Coordinator", profile.Role);
        Assert.Equal("Alice Walker", profile.FullName);
    }

    [Theory]
    [InlineData("Admin")]
    [InlineData("Citizen")]
    [InlineData("Coordinator")]
    [InlineData("Volunteer")]
    public async Task GenerateJwtToken_AllRoles_ValidatesAndContainsSingleRoleClaim(string roleName)
    {
        // Arrange
        var context = GetInMemoryContext();
        var (_, authService, _) = CreateController(context);

        var regResult = await authService.RegisterAsync(new RegisterRequestDto
        {
            FullName = $"Test User {roleName}",
            Email = $"{roleName.ToLower()}@test.local",
            Password = "Password123!",
            Role = roleName
        });

        Assert.True(regResult.Success);
        var tokenString = regResult.Response!.Token;
        Assert.NotEmpty(tokenString);

        // Act - Read token claims using JwtSecurityTokenHandler
        var tokenHandler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var jwtToken = tokenHandler.ReadJwtToken(tokenString);

        // Assert role claim presence and uniqueness
        var roleClaims = jwtToken.Claims.Where(c => c.Type == "role" || c.Type == ClaimTypes.Role).ToList();
        Assert.Single(roleClaims);
        Assert.Equal(roleName, roleClaims[0].Value);

        // Act & Assert - Validate token with TokenValidationParameters
        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = "ERCP.Api",
            ValidateAudience = true,
            ValidAudience = "ERCP.Clients",
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("DEVELOPMENT_ONLY_SecretKey_MustBeChangedInProduction!!")),
            RoleClaimType = ClaimTypes.Role,
            NameClaimType = ClaimTypes.NameIdentifier
        };

        var principal = tokenHandler.ValidateToken(tokenString, validationParameters, out var validatedToken);
        Assert.NotNull(principal);
        Assert.NotNull(validatedToken);
        Assert.True(principal.IsInRole(roleName));
    }
}
