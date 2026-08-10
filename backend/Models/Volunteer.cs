namespace ERCP.Api.Models;

public class Volunteer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Skills { get; set; } = string.Empty;   // e.g. "medical,driving"
    public bool IsAvailable { get; set; } = true;
    public double Rating { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Shift> Shifts { get; set; } = new List<Shift>();
}