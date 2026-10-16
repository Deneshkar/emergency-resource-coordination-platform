namespace ERCP.Api.Services;

public record WhatsAppSendResult(
    bool Success,
    string? MessageId = null,
    string? Recipient = null,
    string? Error = null
);

public interface IWhatsAppService
{
    bool IsEnabled { get; }
    string DefaultRecipient { get; }

    /// <summary>
    /// Send an arbitrary raw text message via WhatsApp Cloud API to the given phone number.
    /// </summary>
    Task<WhatsAppSendResult> SendTextMessageAsync(string? toPhoneNumber, string message);

    /// <summary>
    /// Send formatted Low Stock Alert.
    /// </summary>
    Task<WhatsAppSendResult> SendLowStockAlertAsync(
        string itemName,
        int quantity,
        int minimumThreshold,
        string? unit = null,
        string? location = null,
        string? recipient = null
    );

    /// <summary>
    /// Send formatted Out of Stock Critical Alert.
    /// </summary>
    Task<WhatsAppSendResult> SendOutOfStockAlertAsync(
        string itemName,
        string? location = null,
        string? unit = null,
        string? recipient = null
    );

    /// <summary>
    /// Send formatted Critical Emergency Incident Alert.
    /// </summary>
    Task<WhatsAppSendResult> SendCriticalEmergencyAlertAsync(
        string title,
        string category,
        string priority,
        string location,
        string description,
        string? reporterContact = null,
        string? recipient = null
    );

    /// <summary>
    /// Send formatted Resource Dispatched / Status Update Alert.
    /// </summary>
    Task<WhatsAppSendResult> SendResourceDispatchAlertAsync(
        string resourceName,
        string resourceType,
        string status,
        string? location = null,
        string? recipient = null
    );

    /// <summary>
    /// Send formatted Disaster Warning / Weather Alert.
    /// </summary>
    Task<WhatsAppSendResult> SendDisasterWarningAlertAsync(
        string title,
        string severity,
        string area,
        string advisory,
        string? recipient = null
    );

    /// <summary>
    /// Send a custom emergency alert via WhatsApp.
    /// </summary>
    Task<WhatsAppSendResult> SendCustomAlertAsync(
        string alertType,
        string title,
        string message,
        string priority = "High",
        string? recipient = null
    );
}
