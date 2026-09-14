namespace ERCP.Api.Models;

public class DispatchTask
{
    public int Id { get; set; }

    // Relationship with Dispatch
    public int DispatchId { get; set; }
    public Dispatch? Dispatch { get; set; }

    // Relationship with existing Volunteer
    public Guid VolunteerId { get; set; }
    public Volunteer? Volunteer { get; set; }

    // Optional resource/vehicle
    public Guid? ResourceId { get; set; }

    public string TaskType { get; set; } = string.Empty;

    // Assigned, Accepted, Rejected, OnTheWay,
    // Arrived, InProgress, Completed
    public string Status { get; set; } = "Assigned";

    public DateTime? AssignedAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}