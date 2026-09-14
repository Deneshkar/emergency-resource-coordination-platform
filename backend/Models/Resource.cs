namespace ERCP.Api.Models;

public class Resource
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    // Vehicle, MedicalEquipment, Generator, FoodSupply, ShelterSupply
    public string ResourceType { get; set; } = "Vehicle";

    // Available, Dispatched, Maintenance, Reserved
    public string Status { get; set; } = "Available";

    public int Capacity { get; set; } = 1;

    public string Location { get; set; } = string.Empty;

    public int? ShelterId { get; set; }
    public Shelter? Shelter { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
