using System.Net;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using ERCP.Api.Services;
using Xunit;

namespace ERCP.Api.Tests;

public class WhatsAppServiceTests
{
    private class MockHttpMessageHandler : HttpMessageHandler
    {
        public HttpRequestMessage? LastRequest { get; private set; }
        public string? LastRequestBody { get; private set; }
        public HttpResponseMessage ResponseToReturn { get; set; } = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("{\"messaging_product\":\"whatsapp\",\"messages\":[{\"id\":\"wamid.TEST12345\"}]}")
        };

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            LastRequest = request;
            if (request.Content != null)
            {
                LastRequestBody = await request.Content.ReadAsStringAsync(cancellationToken);
            }
            return ResponseToReturn;
        }
    }

    private (WhatsAppService Service, MockHttpMessageHandler Handler) CreateService(
        bool enabled = true,
        string token = "test_token",
        string phoneId = "1401566236365638",
        string defaultRecipient = "94711759718")
    {
        var inMemorySettings = new Dictionary<string, string?>
        {
            { "WhatsApp:Enabled", enabled.ToString() },
            { "WhatsApp:AccessToken", token },
            { "WhatsApp:PhoneNumberId", phoneId },
            { "WhatsApp:DefaultRecipient", defaultRecipient }
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        var handler = new MockHttpMessageHandler();
        var httpClient = new HttpClient(handler);
        var logger = NullLogger<WhatsAppService>.Instance;

        var service = new WhatsAppService(httpClient, configuration, logger);
        return (service, handler);
    }

    [Theory]
    [InlineData("+94 0711759718", "94711759718")]
    [InlineData("0711759718", "94711759718")]
    [InlineData("+94711759718", "94711759718")]
    [InlineData("711759718", "94711759718")]
    [InlineData("94711759718", "94711759718")]
    [InlineData("+94 71 175 9718", "94711759718")]
    public void NormalizePhoneNumber_SanitizesSriLankaNumbersAccurately(string input, string expected)
    {
        var result = WhatsAppService.NormalizePhoneNumber(input);
        Assert.Equal(expected, result);
    }

    [Fact]
    public async Task SendLowStockAlertAsync_SendsExpectedPayload()
    {
        var (service, handler) = CreateService();

        var result = await service.SendLowStockAlertAsync(
            itemName: "Medical First Aid Kit",
            quantity: 4,
            minimumThreshold: 20,
            unit: "Kits",
            location: "Jaffna Relief Center",
            recipient: "+94 0711759718"
        );

        Assert.True(result.Success);
        Assert.Equal("wamid.TEST12345", result.MessageId);
        Assert.Equal("94711759718", result.Recipient);
        Assert.NotNull(handler.LastRequestBody);
        Assert.Contains("LOW STOCK ALERT", handler.LastRequestBody);
        Assert.Contains("Medical First Aid Kit", handler.LastRequestBody);
        Assert.Contains("4 Kits", handler.LastRequestBody);
    }

    [Fact]
    public async Task SendOutOfStockAlertAsync_SendsCriticalAlert()
    {
        var (service, handler) = CreateService();

        var result = await service.SendOutOfStockAlertAsync(
            itemName: "Emergency Oxygen Cylinders",
            location: "Colombo General Hub",
            unit: "Cylinders"
        );

        Assert.True(result.Success);
        Assert.NotNull(handler.LastRequestBody);
        Assert.Contains("OUT OF STOCK", handler.LastRequestBody);
        Assert.Contains("Emergency Oxygen Cylinders", handler.LastRequestBody);
        Assert.Contains("CRITICAL EMERGENCY", handler.LastRequestBody);
    }

    [Fact]
    public async Task SendCriticalEmergencyAlertAsync_SendsEmergencyDetails()
    {
        var (service, handler) = CreateService();

        var result = await service.SendCriticalEmergencyAlertAsync(
            title: "Severe Urban Flash Flood",
            category: "Flood",
            priority: "Critical",
            location: "Kelani River Basin",
            description: "Water levels rising rapidly, 50 families trapped.",
            reporterContact: "Grama Niladhari"
        );

        Assert.True(result.Success);
        Assert.NotNull(handler.LastRequestBody);
        Assert.Contains("CRITICAL EMERGENCY REPORTED", handler.LastRequestBody);
        Assert.Contains("Severe Urban Flash Flood", handler.LastRequestBody);
        Assert.Contains("Kelani River Basin", handler.LastRequestBody);
        Assert.Contains("CRITICAL", handler.LastRequestBody);
    }

    [Fact]
    public async Task SendResourceDispatchAlertAsync_SendsDispatchInformation()
    {
        var (service, handler) = CreateService();

        var result = await service.SendResourceDispatchAlertAsync(
            resourceName: "Ambulance Unit 04",
            resourceType: "Medical Vehicle",
            status: "Dispatched",
            location: "Sector 7 Disaster Site"
        );

        Assert.True(result.Success);
        Assert.NotNull(handler.LastRequestBody);
        Assert.Contains("RESOURCE DISPATCH ALERT", handler.LastRequestBody);
        Assert.Contains("Ambulance Unit 04", handler.LastRequestBody);
        Assert.Contains("Dispatched", handler.LastRequestBody);
    }

    [Fact]
    public async Task SendDisasterWarningAlertAsync_SendsEarlyWarning()
    {
        var (service, handler) = CreateService();

        var result = await service.SendDisasterWarningAlertAsync(
            title: "Category 2 Cyclone Warning",
            severity: "Critical",
            area: "Eastern Coastal Belt",
            advisory: "Move to designated storm shelters immediately."
        );

        Assert.True(result.Success);
        Assert.NotNull(handler.LastRequestBody);
        Assert.Contains("DISASTER EARLY WARNING", handler.LastRequestBody);
        Assert.Contains("Category 2 Cyclone Warning", handler.LastRequestBody);
    }

    [Fact]
    public async Task SendTextMessageAsync_ReturnsFailure_WhenDisabled()
    {
        var (service, _) = CreateService(enabled: false);

        var result = await service.SendTextMessageAsync("94711759718", "Test message");

        Assert.False(result.Success);
        Assert.Contains("disabled", result.Error, StringComparison.OrdinalIgnoreCase);
    }
}
