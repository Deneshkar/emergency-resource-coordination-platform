using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace ERCP.Api.Services;

public class WhatsAppService : IWhatsAppService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<WhatsAppService> _logger;

    public WhatsAppService(
        HttpClient httpClient,
        IConfiguration config,
        ILogger<WhatsAppService> logger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;
    }

    private string GetConfig(string envKey, string configKey, string fallback = "")
    {
        return _config[configKey]
            ?? _config[envKey]
            ?? Environment.GetEnvironmentVariable(envKey)
            ?? fallback;
    }

    public bool IsEnabled
    {
        get
        {
            var raw = GetConfig("WHATSAPP_ENABLED", "WhatsApp:Enabled", "");
            if (bool.TryParse(raw, out var enabled))
                return enabled;

            // If not explicitly false, auto-enable when credentials are present
            return !string.IsNullOrWhiteSpace(AccessToken) && !string.IsNullOrWhiteSpace(PhoneNumberId);
        }
    }

    private string AccessToken => GetConfig("WHATSAPP_ACCESS_TOKEN", "WhatsApp:AccessToken");
    private string PhoneNumberId => GetConfig("WHATSAPP_PHONE_NUMBER_ID", "WhatsApp:PhoneNumberId");
    public string DefaultRecipient => NormalizePhoneNumber(GetConfig("WHATSAPP_DEFAULT_RECIPIENT", "WhatsApp:DefaultRecipient", "94711759718"));

    /// <summary>
    /// Normalizes phone number into international WhatsApp E.164-compatible format without '+' or leading zeros.
    /// E.g. "+94 0711759718" -> "94711759718", "0711759718" -> "94711759718".
    /// </summary>
    public static string NormalizePhoneNumber(string? rawPhone)
    {
        if (string.IsNullOrWhiteSpace(rawPhone))
            return "94711759718";

        // Keep only digits
        var digits = Regex.Replace(rawPhone, @"\D", "");

        // Sri Lanka specific standardizations:
        // Case: +94 0711759718 -> "940711759718" (12 digits) -> "94711759718"
        if (digits.StartsWith("940") && digits.Length == 12)
        {
            return "94" + digits[3..];
        }

        // Case: 0711759718 (10 digits) -> "94711759718"
        if (digits.StartsWith("0") && digits.Length == 10)
        {
            return "94" + digits[1..];
        }

        // Case: 711759718 (9 digits) -> "94711759718"
        if (digits.Length == 9 && (digits.StartsWith("7") || digits.StartsWith("1") || digits.StartsWith("2") || digits.StartsWith("3") || digits.StartsWith("4") || digits.StartsWith("5") || digits.StartsWith("6") || digits.StartsWith("8") || digits.StartsWith("9")))
        {
            return "94" + digits;
        }

        return digits;
    }

    public async Task<WhatsAppSendResult> SendTextMessageAsync(string? toPhoneNumber, string message)
    {
        var recipient = string.IsNullOrWhiteSpace(toPhoneNumber) ? DefaultRecipient : NormalizePhoneNumber(toPhoneNumber);

        if (!IsEnabled)
        {
            _logger.LogWarning("[WhatsAppService] WhatsApp integration is disabled. Skipping message to {Recipient}.", recipient);
            return new WhatsAppSendResult(false, null, recipient, "WhatsApp service is disabled.");
        }

        var token = AccessToken;
        var phoneId = PhoneNumberId;

        if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(phoneId))
        {
            _logger.LogWarning("[WhatsAppService] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID.");
            return new WhatsAppSendResult(false, null, recipient, "WhatsApp credentials not configured.");
        }

        var endpoint = $"https://graph.facebook.com/v20.0/{phoneId}/messages";

        var payload = new
        {
            messaging_product = "whatsapp",
            recipient_type = "individual",
            to = recipient,
            type = "text",
            text = new
            {
                preview_url = false,
                body = message
            }
        };

        var json = JsonSerializer.Serialize(payload);
        using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = new StringContent(json, Encoding.UTF8, "application/json");

        try
        {
            _logger.LogInformation("[WhatsAppService] Sending WhatsApp alert to {Recipient} via PhoneId {PhoneId}...", recipient, phoneId);
            var response = await _httpClient.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("[WhatsAppService] Meta API Error ({StatusCode}): {Response}", response.StatusCode, content);
                return new WhatsAppSendResult(false, null, recipient, $"Meta API error ({response.StatusCode}): {content}");
            }

            string? messageId = null;
            try
            {
                using var doc = JsonDocument.Parse(content);
                if (doc.RootElement.TryGetProperty("messages", out var messages) && messages.GetArrayLength() > 0)
                {
                    messageId = messages[0].GetProperty("id").GetString();
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "[WhatsAppService] Could not parse message ID from Meta response.");
            }

            _logger.LogInformation("[WhatsAppService] ✅ WhatsApp message successfully sent to {Recipient}. MessageId: {MessageId}", recipient, messageId);
            return new WhatsAppSendResult(true, messageId, recipient);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[WhatsAppService] Exception sending WhatsApp message to {Recipient}", recipient);
            return new WhatsAppSendResult(false, null, recipient, ex.Message);
        }
    }

    public async Task<WhatsAppSendResult> SendLowStockAlertAsync(
        string itemName,
        int quantity,
        int minimumThreshold,
        string? unit = null,
        string? location = null,
        string? recipient = null)
    {
        var unitStr = string.IsNullOrWhiteSpace(unit) ? "units" : unit;
        var locStr = string.IsNullOrWhiteSpace(location) ? "Central Warehouse / Unassigned" : location;

        var message =
            $"⚠️ *[ERCP] LOW STOCK ALERT*\n" +
            $"━━━━━━━━━━━━━━━━━━━━━\n" +
            $"📦 *Item:* {itemName}\n" +
            $"📉 *Current Stock:* {quantity} {unitStr}\n" +
            $"⚡ *Min Threshold:* {minimumThreshold} {unitStr}\n" +
            $"📍 *Location:* {locStr}\n" +
            $"🚨 *Status:* *LOW STOCK*\n\n" +
            $"⚠️ *Action Required:* Urgent replenishment requested to maintain emergency operational readiness.\n\n" +
            $"🕒 {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC\n" +
            $"_ERCP Logistics Coordination System_";

        return await SendTextMessageAsync(recipient, message);
    }

    public async Task<WhatsAppSendResult> SendOutOfStockAlertAsync(
        string itemName,
        string? location = null,
        string? unit = null,
        string? recipient = null)
    {
        var unitStr = string.IsNullOrWhiteSpace(unit) ? "units" : unit;
        var locStr = string.IsNullOrWhiteSpace(location) ? "Central Warehouse" : location;

        var message =
            $"🚨 *[ERCP] OUT OF STOCK — CRITICAL*\n" +
            $"━━━━━━━━━━━━━━━━━━━━━\n" +
            $"📦 *Item:* {itemName}\n" +
            $"❌ *Current Stock:* 0 {unitStr}\n" +
            $"📍 *Location:* {locStr}\n" +
            $"🔴 *Priority:* *CRITICAL EMERGENCY*\n\n" +
            $"🚨 *Action Required:* Supply is completely exhausted. Immediate restocking or emergency re-allocation is mandatory!\n\n" +
            $"🕒 {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC\n" +
            $"_ERCP Emergency Resource System_";

        return await SendTextMessageAsync(recipient, message);
    }

    public async Task<WhatsAppSendResult> SendCriticalEmergencyAlertAsync(
        string title,
        string category,
        string priority,
        string location,
        string description,
        string? reporterContact = null,
        string? recipient = null)
    {
        var reporter = string.IsNullOrWhiteSpace(reporterContact) ? "Citizen / Field Reporter" : reporterContact;

        var message =
            $"🚨 *[ERCP] CRITICAL EMERGENCY REPORTED*\n" +
            $"━━━━━━━━━━━━━━━━━━━━━\n" +
            $"🔥 *Incident:* {title}\n" +
            $"🏷️ *Category:* {category}\n" +
            $"⚡ *Priority:* *{priority.ToUpper()}*\n" +
            $"📍 *Location:* {location}\n" +
            $"📝 *Details:* {description}\n" +
            $"📞 *Contact:* {reporter}\n\n" +
            $"⚠️ *Notice:* Response coordinators notified. Check Command Center to review AI response plan and dispatch units.\n\n" +
            $"🕒 {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC\n" +
            $"_ERCP Emergency Command Center_";

        return await SendTextMessageAsync(recipient, message);
    }

    public async Task<WhatsAppSendResult> SendResourceDispatchAlertAsync(
        string resourceName,
        string resourceType,
        string status,
        string? location = null,
        string? recipient = null)
    {
        var locStr = string.IsNullOrWhiteSpace(location) ? "Assigned Incident Zone" : location;

        var message =
            $"🚛 *[ERCP] RESOURCE DISPATCH ALERT*\n" +
            $"━━━━━━━━━━━━━━━━━━━━━\n" +
            $"🚒 *Resource:* {resourceName}\n" +
            $"🏷️ *Type:* {resourceType}\n" +
            $"🔄 *Status:* *{status}*\n" +
            $"📍 *Location:* {locStr}\n\n" +
            $"ℹ️ *Note:* Resource status updated. Real-time GPS and logistics tracking active.\n\n" +
            $"🕒 {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC\n" +
            $"_ERCP Logistics Coordination_";

        return await SendTextMessageAsync(recipient, message);
    }

    public async Task<WhatsAppSendResult> SendDisasterWarningAlertAsync(
        string title,
        string severity,
        string area,
        string advisory,
        string? recipient = null)
    {
        var message =
            $"🌊 *[ERCP] DISASTER EARLY WARNING*\n" +
            $"━━━━━━━━━━━━━━━━━━━━━\n" +
            $"⚠️ *Warning:* {title}\n" +
            $"🔴 *Severity:* *{severity.ToUpper()}*\n" +
            $"📍 *Target Region:* {area}\n" +
            $"📢 *Advisory:* {advisory}\n\n" +
            $"🛡️ Follow official emergency protocols and proceed to nearest relief shelters.\n\n" +
            $"🕒 {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC\n" +
            $"_ERCP Disaster Management Authority_";

        return await SendTextMessageAsync(recipient, message);
    }

    public async Task<WhatsAppSendResult> SendCustomAlertAsync(
        string alertType,
        string title,
        string message,
        string priority = "High",
        string? recipient = null)
    {
        var formatted =
            $"🚨 *[ERCP] {alertType.ToUpper()}*\n" +
            $"━━━━━━━━━━━━━━━━━━━━━\n" +
            $"📌 *{title}*\n" +
            $"⚡ *Priority:* {priority}\n\n" +
            $"{message}\n\n" +
            $"🕒 {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC\n" +
            $"_Emergency Resource Coordination Platform_";

        return await SendTextMessageAsync(recipient, formatted);
    }
}
