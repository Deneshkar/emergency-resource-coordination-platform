namespace ERCP.Api.Models;

public enum ShiftStatus
{
    Scheduled,
    Active,
    Completed,
    Cancelled
}

public class Shift
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid VolunteerId { get; set; }
    public Volunteer? Volunteer { get; set; }

    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public ShiftStatus Status { get; set; } = ShiftStatus.Scheduled;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}