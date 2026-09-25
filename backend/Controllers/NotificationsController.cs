using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ERCP.Api.Services;

namespace ERCP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly IEmailService _emailService;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(IEmailService emailService, ILogger<NotificationsController> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    /// <summary>Send an alert email notification</summary>
    [HttpPost("email")]
    [Authorize]
    public async Task<IActionResult> SendEmailAlert([FromBody] EmailAlertRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.AlertType) || string.IsNullOrWhiteSpace(request.Subject))
            return BadRequest(new { message = "alertType and subject are required." });

        try
        {
            await _emailService.SendAlertAsync(
                request.AlertType,
                request.Subject,
                request.Body ?? "",
                request.Priority ?? "High"
            );
            return Ok(new { success = true, message = "Email sent successfully." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send alert email");
            return StatusCode(500, new { success = false, message = "Failed to send email. Check SMTP configuration." });
        }
    }

    /// <summary>Send low stock inventory alert</summary>
    [HttpPost("inventory/low-stock")]
    [Authorize]
    public async Task<IActionResult> SendLowStockAlert([FromBody] InventoryAlertRequest request)
    {
        try
        {
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
            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send low stock email");
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    /// <summary>Send out-of-stock critical alert</summary>
    [HttpPost("inventory/out-of-stock")]
    [Authorize]
    public async Task<IActionResult> SendOutOfStockAlert([FromBody] InventoryAlertRequest request)
    {
        try
        {
            await _emailService.SendAlertAsync(
                "🚨 Out of Stock — CRITICAL",
                $"[ERCP] CRITICAL: {request.ItemName} is OUT OF STOCK",
                $"CRITICAL ALERT: Inventory item \"{request.ItemName}\" has reached ZERO stock.\n\n" +
                $"Location : {request.Location ?? "N/A"}\n\n" +
                $"Immediate action required! Please restock urgently.",
                "Critical"
            );
            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send out-of-stock email");
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    /// <summary>Send resource status change alert</summary>
    [HttpPost("resource/status")]
    [Authorize]
    public async Task<IActionResult> SendResourceStatusAlert([FromBody] ResourceAlertRequest request)
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

        try
        {
            await _emailService.SendAlertAsync(alertType, subject, body, priority);
            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send resource status email");
            return StatusCode(500, new { success = false, message = ex.Message });
        }
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
    string? Location
);

public record ResourceAlertRequest(
    string ResourceName,
    string ResourceType,
    string NewStatus,
    string? Location
);
