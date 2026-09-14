namespace ERCP.Api.Models;

public class InventoryItem
{
    public int Id { get; set; }

    public string ItemName { get; set; } = string.Empty;

    // Medical, Food, Water, ShelterSupplies, Power
    public string Category { get; set; } = "General";

    public int Quantity { get; set; }

    public string UnitOfMeasure { get; set; } = "Units";

    public int MinimumThreshold { get; set; } = 10;

    public int? ShelterId { get; set; }
    public Shelter? Shelter { get; set; }

    public string Location { get; set; } = string.Empty;

    // InStock, LowStock, OutOfStock
    public string Status { get; set; } = "InStock";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
