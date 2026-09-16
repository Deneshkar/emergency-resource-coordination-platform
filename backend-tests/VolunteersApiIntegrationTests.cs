using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;
using ERCP.Api.Data;
using Xunit;

namespace ERCP.Api.Tests;

/// <summary>
/// Boots the real API in-memory and exercises Student 4's volunteer endpoints
/// over HTTP: auth enforcement, seeded-coordinator login, and the full
/// volunteer → shift → availability lifecycle. (Spec §9 API-integration tests.)
/// </summary>
public class ErcpApiFactory : WebApplicationFactory<Program>
{
    // One shared store per factory instance (i.e. per test class): every scope
    // and every TestServer request in this class sees the same database.
    private readonly InMemoryDatabaseRoot _store = new();

    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            var descriptor = services.Single(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            services.Remove(descriptor);
            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase("E2E", _store));
        });
    }
}

public class VolunteersApiIntegrationTests : IClassFixture<ErcpApiFactory>
{
    private readonly ErcpApiFactory _factory;

    public VolunteersApiIntegrationTests(ErcpApiFactory factory)
    {
        _factory = factory;
    }

    private static string UniqueEmail(string prefix) => $"{prefix}-{Guid.NewGuid()}@test.local";

    /// <summary>
    /// Registers a fresh Coordinator over HTTP (hermetic: no dependence on
    /// startup seed data) and returns a bearer token for it.
    /// </summary>
    private async Task<string> RegisterCoordinatorAsync(HttpClient client)
    {
        var email = UniqueEmail("e2e-coord");
        const string password = "Coord@12345";
        var register = await client.PostAsJsonAsync("/api/Auth/register", new
        {
            fullName = "E2E Coordinator",
            email,
            password,
            role = "Coordinator",
        });
        Assert.Equal(HttpStatusCode.Created, register.StatusCode);

        using var doc = JsonDocument.Parse(await register.Content.ReadAsStringAsync());
        var token = doc.RootElement.GetProperty("token").GetString();
        Assert.False(string.IsNullOrWhiteSpace(token));

        // Prove the credentials work through the login path too.
        var login = await client.PostAsJsonAsync("/api/Auth/login", new { email, password });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        using var loginDoc = JsonDocument.Parse(await login.Content.ReadAsStringAsync());
        Assert.Equal("Coordinator", loginDoc.RootElement.GetProperty("user").GetProperty("role").GetString());
        return token!;
    }

    [Fact]
    public async Task GetVolunteers_Anonymous_Returns401()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/volunteers");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task RegisterAndLogin_Coordinator_ReturnsToken()
    {
        var client = _factory.CreateClient();

        var token = await RegisterCoordinatorAsync(client);

        Assert.NotEmpty(token);

        // The new identity is recognized by the protected profile endpoint.
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var me = await client.GetAsync("/api/Auth/me");
        Assert.Equal(HttpStatusCode.OK, me.StatusCode);
    }

    [Fact]
    public async Task SeededDemoData_Exists()
    {
        // Startup seeding (incidents + demo users incl. coordinator@ercp.org)
        // must survive on a fresh database — the assessed demo logins depend on it.
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        Assert.True(await context.Incidents.AnyAsync());
        Assert.True(await context.Users.AnyAsync(u => u.Role == "Coordinator"));
    }

    [Fact]
    public async Task VolunteerShiftLifecycle_OverHttp()
    {
        var client = _factory.CreateClient();
        var token = await RegisterCoordinatorAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // 1. Register a volunteer
        var email = UniqueEmail("e2e-responder");
        var create = await client.PostAsJsonAsync("/api/volunteers", new
        {
            name = "E2E Responder",
            email,
            phone = "0770000000",
            skills = "medical, rescue",
        });
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        using var createdDoc = JsonDocument.Parse(await create.Content.ReadAsStringAsync());
        var volunteerId = createdDoc.RootElement.GetProperty("id").GetGuid();
        Assert.NotEqual(Guid.Empty, volunteerId);

        // 2. Assign a shift
        var start = new DateTime(2026, 10, 2, 8, 0, 0, DateTimeKind.Utc);
        var end = new DateTime(2026, 10, 2, 16, 0, 0, DateTimeKind.Utc);
        var shift = await client.PostAsJsonAsync($"/api/volunteers/{volunteerId}/shifts", new
        {
            startTime = start,
            endTime = end,
            status = "Scheduled",
        });
        Assert.Equal(HttpStatusCode.Created, shift.StatusCode);

        // 3. Shift history contains the new shift
        var history = await client.GetAsync($"/api/volunteers/{volunteerId}/shifts");
        Assert.Equal(HttpStatusCode.OK, history.StatusCode);
        var historyBody = await history.Content.ReadAsStringAsync();
        Assert.Contains("2026-10-02", historyBody);

        // 4. Toggle availability off-duty and verify via GET
        var toggle = await client.PutAsJsonAsync(
            $"/api/volunteers/{volunteerId}/availability", new { isAvailable = false });
        Assert.Equal(HttpStatusCode.NoContent, toggle.StatusCode);

        var fetched = await client.GetAsync($"/api/volunteers/{volunteerId}");
        Assert.Equal(HttpStatusCode.OK, fetched.StatusCode);
        using var fetchedDoc = JsonDocument.Parse(await fetched.Content.ReadAsStringAsync());
        Assert.False(fetchedDoc.RootElement.GetProperty("isAvailable").GetBoolean());
    }

    [Fact]
    public async Task CreateShift_InvalidWindow_OverHttp_Returns400()
    {
        var client = _factory.CreateClient();
        var token = await RegisterCoordinatorAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var create = await client.PostAsJsonAsync("/api/volunteers", new
        {
            name = "E2E Window",
            email = UniqueEmail("e2e-window"),
            phone = "1",
            skills = "driving",
        });
        using var createdDoc = JsonDocument.Parse(await create.Content.ReadAsStringAsync());
        var volunteerId = createdDoc.RootElement.GetProperty("id").GetGuid();

        var badShift = await client.PostAsJsonAsync($"/api/volunteers/{volunteerId}/shifts", new
        {
            startTime = new DateTime(2026, 10, 3, 16, 0, 0, DateTimeKind.Utc),
            endTime = new DateTime(2026, 10, 3, 8, 0, 0, DateTimeKind.Utc),
            status = "Scheduled",
        });

        Assert.Equal(HttpStatusCode.BadRequest, badShift.StatusCode);
    }
}
