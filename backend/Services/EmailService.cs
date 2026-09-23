using System.Net;
using System.Net.Mail;

namespace ERCP.Api.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        try
        {
            var host = _config["Smtp:Host"];
            var portStr = _config["Smtp:Port"];
            var user = _config["Smtp:User"];
            var pass = _config["Smtp:Pass"];
            var from = _config["Smtp:From"];

            if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(user) || string.IsNullOrEmpty(pass))
            {
                _logger.LogWarning("SMTP configuration is missing. Cannot send email.");
                return;
            }

            int port = int.TryParse(portStr, out int p) ? p : 587;

            using var client = new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(user, pass),
                EnableSsl = true
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(user, "HEXORA ERCP"), // Use the user email to avoid Gmail rejection, display name as HEXORA
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };

            // Custom From display name if specified
            if (!string.IsNullOrEmpty(from))
            {
                try 
                {
                    mailMessage.From = new MailAddress(from);
                } 
                catch { /* Ignore formatting errors, fallback to default */ }
            }

            mailMessage.To.Add(toEmail);

            await client.SendMailAsync(mailMessage);
            _logger.LogInformation($"Email successfully sent to {toEmail} with subject: {subject}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Failed to send email to {toEmail}");
        }
    }
}
