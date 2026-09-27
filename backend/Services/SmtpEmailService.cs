using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace ERCP.Api.Services;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        var host     = _config["SMTP_HOST"] ?? Environment.GetEnvironmentVariable("SMTP_HOST") ?? "smtp.gmail.com";
        var port     = int.Parse(_config["SMTP_PORT"] ?? Environment.GetEnvironmentVariable("SMTP_PORT") ?? "587");
        var user     = _config["SMTP_USER"] ?? Environment.GetEnvironmentVariable("SMTP_USER") ?? "";
        var pass     = _config["SMTP_PASS"] ?? Environment.GetEnvironmentVariable("SMTP_PASS") ?? "";
        var fromRaw  = _config["SMTP_FROM"] ?? Environment.GetEnvironmentVariable("SMTP_FROM") ?? user;

        if (string.IsNullOrWhiteSpace(user) || string.IsNullOrWhiteSpace(pass))
        {
            _logger.LogWarning("[EmailService] SMTP credentials not configured — skipping email.");
            return;
        }

        // Parse "Display Name <email>" format
        string fromName  = "ERCP Alerts";
        string fromEmail = user;
        if (fromRaw.Contains('<') && fromRaw.Contains('>'))
        {
            fromName  = fromRaw[..fromRaw.IndexOf('<')].Trim();
            fromEmail = fromRaw[(fromRaw.IndexOf('<') + 1)..fromRaw.IndexOf('>')].Trim();
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(fromName, fromEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;

        var builder = new BodyBuilder { HtmlBody = htmlBody };
        message.Body = builder.ToMessageBody();

        using var smtp = new SmtpClient();
        smtp.Timeout = 10000;
        try
        {
            await smtp.ConnectAsync(host, port, SecureSocketOptions.StartTls);
            await smtp.AuthenticateAsync(user, pass);
            await smtp.SendAsync(message);
            await smtp.DisconnectAsync(true);
            _logger.LogInformation("[EmailService] Email sent to {To} — Subject: {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[EmailService] Failed to send email to {To}", toEmail);
            throw;
        }
    }

    public async Task SendAlertAsync(string alertType, string subject, string body, string priority = "High")
    {
        var recipientEmail = _config["ALERT_EMAIL"]
            ?? Environment.GetEnvironmentVariable("ALERT_EMAIL")
            ?? _config["SMTP_USER"]
            ?? Environment.GetEnvironmentVariable("SMTP_USER")
            ?? "";

        if (string.IsNullOrWhiteSpace(recipientEmail)) return;

        var priorityColor = priority switch
        {
            "Critical" => "#ef4444",
            "High"     => "#f97316",
            "Medium"   => "#f59e0b",
            _          => "#3b82f6"
        };

        var html = $"""
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family:Inter,Arial,sans-serif;background:#0a0f1a;color:#e2e8f0;margin:0;padding:0;">
              <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
                <!-- Header -->
                <div style="background:linear-gradient(135deg,#1e293b,#0f172a);border:1px solid #334155;border-radius:12px;padding:24px;margin-bottom:20px;">
                  <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                    <span style="font-size:28px;">🚨</span>
                    <div>
                      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:600;">ERCP · Emergency Resource Coordination Platform</div>
                      <div style="font-size:20px;font-weight:800;color:#f8fafc;margin-top:2px;">{alertType}</div>
                    </div>
                  </div>
                  <span style="display:inline-block;padding:4px 12px;border-radius:20px;background:{priorityColor}22;border:1px solid {priorityColor};color:{priorityColor};font-size:12px;font-weight:700;">{priority} Priority</span>
                </div>

                <!-- Body -->
                <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:24px;margin-bottom:20px;">
                  <pre style="white-space:pre-wrap;font-family:inherit;color:#cbd5e1;font-size:14px;line-height:1.7;margin:0;">{body}</pre>
                </div>

                <!-- Timestamp -->
                <div style="text-align:center;color:#475569;font-size:12px;">
                  Sent at {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC · ERCP Notification System
                </div>
              </div>
            </body>
            </html>
            """;

        await SendEmailAsync(recipientEmail, subject, html);
    }
}
