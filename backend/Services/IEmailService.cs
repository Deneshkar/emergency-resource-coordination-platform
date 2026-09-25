namespace ERCP.Api.Services;

public interface IEmailService
{
    Task SendEmailAsync(string toEmail, string subject, string htmlBody);
    Task SendAlertAsync(string alertType, string subject, string body, string priority = "High");
}
