namespace IUSClosedMarketplace.Infrastructure.Services;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body);
}

public class EmailService : IEmailService
{
    // Placeholder implementation - integrate with SMTP or SendGrid as needed
    public Task SendEmailAsync(string to, string subject, string body)
    {
        // In production, implement actual email sending
        Console.WriteLine($"[Email] To: {to}, Subject: {subject}");
        return Task.CompletedTask;
    }
}
