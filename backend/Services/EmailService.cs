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

    // Read from env vars (Railway injects these) or appsettings
    private string Env(string key) =>
        Environment.GetEnvironmentVariable(key)
        ?? _config[key]
        ?? _config[key.Replace("_", ":")] // fallback: SMTP_HOST → Smtp:Host
        ?? "";

    public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        var host = Env("SMTP_HOST");
        var portStr = Env("SMTP_PORT");
        var user = Env("SMTP_USER");
        var pass = Env("SMTP_PASS");
        var fromRaw = Env("SMTP_FROM");

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(user) || string.IsNullOrWhiteSpace(pass))
        {
            _logger.LogWarning("[EmailService] SMTP credentials not configured — skipping email.");
            return;
        }

        int port = int.TryParse(portStr, out int p) ? p : 587;

        // Parse "Display Name <email@>" format
        string fromDisplay = "HEXORA ERCP";
        string fromEmail = user;
        if (!string.IsNullOrWhiteSpace(fromRaw) && fromRaw.Contains('<') && fromRaw.Contains('>'))
        {
            fromDisplay = fromRaw[..fromRaw.IndexOf('<')].Trim();
            fromEmail   = fromRaw[(fromRaw.IndexOf('<') + 1)..fromRaw.IndexOf('>')].Trim();
        }

        using var client = new SmtpClient(host, port)
        {
            Credentials = new NetworkCredential(user, pass),
            EnableSsl   = true
        };

        var mail = new MailMessage
        {
            From       = new MailAddress(fromEmail, fromDisplay),
            Subject    = subject,
            Body       = htmlBody,
            IsBodyHtml = true
        };
        mail.To.Add(toEmail);

        try
        {
            await client.SendMailAsync(mail);
            _logger.LogInformation("[EmailService] ✅ Email sent to {To} — {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[EmailService] ❌ Failed to send email to {To}", toEmail);
            throw;
        }
    }

    public async Task SendAlertAsync(string alertType, string subject, string body, string priority = "High")
    {
        var recipient = Env("ALERT_EMAIL");
        if (string.IsNullOrWhiteSpace(recipient))
            recipient = Env("SMTP_USER"); // fallback: send to self

        if (string.IsNullOrWhiteSpace(recipient)) return;

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
                <div style="background:linear-gradient(135deg,#1e293b,#0f172a);border:1px solid #334155;border-radius:12px;padding:24px;margin-bottom:20px;">
                  <div style="margin-bottom:12px;">
                    <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:600;margin-bottom:4px;">
                      🚨 HEXORA · Emergency Resource Coordination Platform
                    </div>
                    <div style="font-size:22px;font-weight:800;color:#f8fafc;">{alertType}</div>
                  </div>
                  <span style="display:inline-block;padding:4px 14px;border-radius:20px;background:{priorityColor}22;border:1px solid {priorityColor};color:{priorityColor};font-size:12px;font-weight:700;">
                    {priority} Priority
                  </span>
                </div>
                <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:24px;margin-bottom:20px;">
                  <pre style="white-space:pre-wrap;font-family:inherit;color:#cbd5e1;font-size:14px;line-height:1.8;margin:0;">{body}</pre>
                </div>
                <div style="text-align:center;color:#475569;font-size:11px;padding:16px 0;">
                  {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC · ERCP Notification System · Powered by HEXORA
                </div>
              </div>
            </body>
            </html>
            """;

        await SendEmailAsync(recipient, subject, html);
    }
}
