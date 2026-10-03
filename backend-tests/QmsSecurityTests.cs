using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace ERCP.Api.Tests;

public class QmsSecurityTests : IClassFixture<ErcpApiFactory>
{
    private readonly ErcpApiFactory factory;
    public QmsSecurityTests(ErcpApiFactory factory) => this.factory = factory;

    [Theory]
    [InlineData("Admin")]
    [InlineData("Coordinator")]
    public async Task SEC01_PublicRegistration_RejectsPrivilegedRole(string role)
    {
        var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/register", new {
            fullName = "Security Test", email = $"security-{Guid.NewGuid()}@test.local",
            password = "Testing123!", role });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData("Citizen")]
    [InlineData("Volunteer")]
    public async Task SEC02_LowPrivilegeUser_CannotCreateDispatch(string role)
    {
        var client = factory.CreateClient();
        var register = await client.PostAsJsonAsync("/api/auth/register", new {
            fullName = "Security Test", email = $"security-{Guid.NewGuid()}@test.local",
            password = "Testing123!", role });
        register.EnsureSuccessStatusCode();
        using var data = JsonDocument.Parse(await register.Content.ReadAsStringAsync());
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", data.RootElement.GetProperty("token").GetString());
        var response = await client.PostAsJsonAsync("/api/dispatches", new { incidentId = 1, priority = "High" });
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Theory]
    [InlineData("/api/dispatches")]
    [InlineData("/api/volunteers")]
    [InlineData("/api/auth/me")]
    public async Task SEC03_MalformedToken_IsRejected(string endpoint)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "tampered.invalid.token");
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync(endpoint)).StatusCode);
    }
}
