using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ERCP.Api.Services;

namespace ERCP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly IEmailService _emailService;
    private readonly IWhatsAppService _whatsAppService;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(
        IEmailService emailService,
        IWhatsAppService whatsAppService,
        ILogger<NotificationsController> logger)
    {
        _emailService = emailService;
        _whatsAppService = whatsAppService;
        _logger = logger;
    }

    /// <summary>Check status of WhatsApp notification service</summary>
    [HttpGet("whatsapp/status")]
    public IActionResult GetWhatsAppStatus()
    {
        return Ok(new
        {
            enabled = _whatsAppService.IsEnabled,
            defaultRecipient = _whatsAppService.DefaultRecipient
        });
    }

    /// <summary>Send an alert email notification</summary>
    [HttpPost("email")]
    [Authorize]
    public IActionResult SendEmailAlert([FromBody] EmailAlertRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.AlertType) || string.IsNullOrWhiteSpace(request.Subject))
            return BadRequest(new { message = "alertType and subject are required." });

        _ = Task.Run(async () =>
        {
            try
            {
                await _emailService.SendAlertAsync(
                    request.AlertType,
                    request.Subject,
                    request.Body ?? "",
                    request.Priority ?? "High"
                );
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Notifications] Background email alert failed");
            }
        });

        return Ok(new { success = true, queued = true, message = "Email notification queued." });
    }

    /// <summary>Send custom WhatsApp message</summary>
    [HttpPost("whatsapp")]
    [Authorize]
    public async Task<IActionResult> SendWhatsAppAlert([FromBody] WhatsAppAlertRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
            return BadRequest(new { message = "Message content is required." });

        var title = request.Title ?? "Emergency Alert";
        var alertType = request.AlertType ?? "Alert";
        var priority = request.Priority ?? "High";

        var result = await _whatsAppService.SendCustomAlertAsync(
            alertType,
            title,
            request.Message,
            priority,
            request.Recipient
        );

        return Ok(new
        {
            success = result.Success,
            messageId = result.MessageId,
            recipient = result.Recipient,
            error = result.Error
        });
    }

    /// <summary>Directly test WhatsApp connection and message delivery</summary>
    [HttpPost("whatsapp/test")]
    [Authorize]
    public async Task<IActionResult> TestWhatsApp([FromBody] WhatsAppTestRequest? request)
    {
        var targetRecipient = request?.Recipient ?? _whatsAppService.DefaultRecipient;
        var customMsg = request?.Message ??
            $"🔔 *[ERCP] WhatsApp Notification Verification*\n\n" +
            $"✅ Connection Test Successful!\n" +
            $"Phone Number ID and Meta Cloud API Token are active.\n" +
            $"Target: {targetRecipient}\n" +
            $"Timestamp: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC\n\n" +
            $"_Emergency Resource Coordination Platform_";

        var result = await _whatsAppService.SendTextMessageAsync(targetRecipient, customMsg);

        return Ok(new
        {
            success = result.Success,
            messageId = result.MessageId,
            recipient = result.Recipient,
            error = result.Error,
            details = result.Success ? "Test message delivered to WhatsApp." : "Failed to deliver message."
        });
    }

    /// <summary>Send low stock inventory alert via Email and WhatsApp</summary>
    [HttpPost("inventory/low-stock")]
    [Authorize]
    public IActionResult SendLowStockAlert([FromBody] InventoryAlertRequest request)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                // 1. Send Email Alert
                await _emailService.SendAlertAsync(
                    "⚠️ Low Stock Alert",
                    $"[ERCP] Low Stock: {request.ItemName}",
                    $"ALERT: Inventory item \"{request.ItemName}\" is running low.\n\n" +
                    $"Current Stock : {request.Quantity} {request.Unit}\n" +
                    $"Min Threshold : {request.MinimumThreshold} {request.Unit}\n" +
                    $"Location      : {request.Location ?? "N/A"}\n\n" +
                    $"Immediate restocking is recommended.",
                    "High"
                );
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Notifications] Low stock email failed");
            }

            try
            {
                // 2. Send WhatsApp Alert
                await _whatsAppService.SendLowStockAlertAsync(
                    request.ItemName,
                    request.Quantity,
                    request.MinimumThreshold,
                    request.Unit,
                    request.Location,
                    request.Recipient
                );
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Notifications] Low stock WhatsApp alert failed");
            }
        });

        return Ok(new { success = true, queued = true });
    }

    /// <summary>Send out-of-stock critical alert via Email and WhatsApp</summary>
    [HttpPost("inventory/out-of-stock")]
    [Authorize]
    public IActionResult SendOutOfStockAlert([FromBody] InventoryAlertRequest request)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                // 1. Send Email Alert
                await _emailService.SendAlertAsync(
                    "🚨 Out of Stock — CRITICAL",
                    $"[ERCP] CRITICAL: {request.ItemName} is OUT OF STOCK",
                    $"CRITICAL ALERT: Inventory item \"{request.ItemName}\" has reached ZERO stock.\n\n" +
                    $"Location : {request.Location ?? "N/A"}\n\n" +
                    $"Immediate action required! Please restock urgently.",
                    "Critical"
                );
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Notifications] Out of stock email failed");
            }

            try
            {
                // 2. Send WhatsApp Alert
                await _whatsAppService.SendOutOfStockAlertAsync(
                    request.ItemName,
                    request.Location,
                    request.Unit,
                    request.Recipient
                );
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Notifications] Out of stock WhatsApp alert failed");
            }
        });

        return Ok(new { success = true, queued = true });
    }

    /// <summary>Send critical emergency incident notification</summary>
    [HttpPost("emergency")]
    [Authorize]
    public IActionResult SendEmergencyAlert([FromBody] EmergencyAlertRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(new { message = "Title is required." });

        _ = Task.Run(async () =>
        {
            try
            {
                var subject = $"🚨 CRITICAL EMERGENCY: {request.Title}";
                var body = $"EMERGENCY ALERT:\n" +
                           $"Title       : {request.Title}\n" +
                           $"Category    : {request.Category}\n" +
                           $"Priority    : {request.Priority}\n" +
                           $"Location    : {request.Location}\n" +
                           $"Description : {request.Description}\n" +
                           $"Reporter    : {request.ReporterContact ?? "N/A"}";

                await _emailService.SendAlertAsync(
                    $"🚨 Emergency: {request.Title}",
                    subject,
                    body,
                    request.Priority ?? "Critical"
                );
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Notifications] Emergency alert email failed");
            }

            try
            {
                await _whatsAppService.SendCriticalEmergencyAlertAsync(
                    request.Title,
                    request.Category ?? "General",
                    request.Priority ?? "Critical",
                    request.Location ?? "Unknown",
                    request.Description ?? "",
                    request.ReporterContact,
                    request.Recipient
                );
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Notifications] Emergency alert WhatsApp failed");
            }
        });

        return Ok(new { success = true, queued = true });
    }

    /// <summary>Send resource status change alert via Email and WhatsApp</summary>
    [HttpPost("resource/status")]
    [Authorize]
    public IActionResult SendResourceStatusAlert([FromBody] ResourceAlertRequest request)
    {
        var (alertType, subject, body, priority) = request.NewStatus switch
        {
            "Dispatched" => (
                "🚛 Resource Dispatched",
                $"[ERCP] Dispatched: {request.ResourceName}",
                $"DISPATCH ALERT: Resource \"{request.ResourceName}\" has been dispatched.\n\n" +
                $"Type     : {request.ResourceType}\n" +
                $"Location : {request.Location ?? "N/A"}\n\n" +
                $"This resource is no longer available for other incidents.",
                "High"
            ),
            "Maintenance" => (
                "🔧 Resource Under Maintenance",
                $"[ERCP] Maintenance: {request.ResourceName}",
                $"MAINTENANCE ALERT: \"{request.ResourceName}\" is under maintenance.\n\n" +
                $"Type : {request.ResourceType}\n\n" +
                $"This resource is temporarily unavailable.",
                "Medium"
            ),
            "Available" => (
                "✅ Resource Available",
                $"[ERCP] Resource Available: {request.ResourceName}",
                $"INFO: \"{request.ResourceName}\" is now available again.\n\nType : {request.ResourceType}",
                "Info"
            ),
            _ => (
                "ℹ️ Resource Status Updated",
                $"[ERCP] Status Update: {request.ResourceName}",
                $"Resource \"{request.ResourceName}\" status changed to {request.NewStatus}.",
                "Info"
            )
        };

        _ = Task.Run(async () =>
        {
            try
            {
                await _emailService.SendAlertAsync(alertType, subject, body, priority);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Notifications] Resource status email failed");
            }

            try
            {
                // Send WhatsApp for Dispatched or Maintenance
                if (request.NewStatus == "Dispatched" || request.NewStatus == "Maintenance")
                {
                    await _whatsAppService.SendResourceDispatchAlertAsync(
                        request.ResourceName,
                        request.ResourceType,
                        request.NewStatus,
                        request.Location,
                        request.Recipient
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Notifications] Resource status WhatsApp failed");
            }
        });

        return Ok(new { success = true, queued = true });
    }

    /// <summary>Send disaster early warning alert via Email and WhatsApp</summary>
    [HttpPost("disaster-warning")]
    [Authorize]
    public IActionResult SendDisasterWarning([FromBody] DisasterWarningRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Area))
            return BadRequest(new { message = "Title and Area are required." });

        _ = Task.Run(async () =>
        {
            try
            {
                await _emailService.SendAlertAsync(
                    $"🌊 Disaster Warning: {request.Title}",
                    $"[ERCP] DISASTER EARLY WARNING: {request.Title} in {request.Area}",
                    $"WARNING: {request.Title}\n" +
                    $"Severity : {request.Severity}\n" +
                    $"Area     : {request.Area}\n" +
                    $"Advisory : {request.Advisory}",
                    request.Severity ?? "Critical"
                );
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Notifications] Disaster warning email failed");
            }

            try
            {
                await _whatsAppService.SendDisasterWarningAlertAsync(
                    request.Title,
                    request.Severity ?? "Critical",
                    request.Area,
                    request.Advisory ?? "Seek shelter and follow emergency instructions.",
                    request.Recipient
                );
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Notifications] Disaster warning WhatsApp failed");
            }
        });

        return Ok(new { success = true, queued = true });
    }
}

// ── Request DTOs ────────────────────────────────────────────────────

public record EmailAlertRequest(
    string AlertType,
    string Subject,
    string? Body,
    string? Priority
);

public record InventoryAlertRequest(
    string ItemName,
    int Quantity,
    int MinimumThreshold,
    string? Unit,
    string? Location,
    string? Recipient = null
);

public record ResourceAlertRequest(
    string ResourceName,
    string ResourceType,
    string NewStatus,
    string? Location,
    string? Recipient = null
);

public record WhatsAppAlertRequest(
    string? Title,
    string Message,
    string? AlertType,
    string? Priority,
    string? Recipient = null
);

public record WhatsAppTestRequest(
    string? Recipient = null,
    string? Message = null
);

public record EmergencyAlertRequest(
    string Title,
    string? Category,
    string? Priority,
    string? Location,
    string? Description,
    string? ReporterContact = null,
    string? Recipient = null
);

public record DisasterWarningRequest(
    string Title,
    string Area,
    string? Severity = "Critical",
    string? Advisory = null,
    string? Recipient = null
);
