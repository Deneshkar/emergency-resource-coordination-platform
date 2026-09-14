namespace ERCP.Api.Models;

public class Shelter
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Location { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public int TotalCapacity { get; set; }

    public int CurrentOccupancy { get; set; } = 0;

    // Active, Full, Inactive
    public string Status { get; set; } = "Active";

    public string ContactNumber { get; set; } = string.Empty;

    public double? Latitude { get; set; }

    public double? Longitude { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Resource> Resources { get; set; } = new List<Resource>();

    public ICollection<InventoryItem> InventoryItems { get; set; } = new List<InventoryItem>();
}
