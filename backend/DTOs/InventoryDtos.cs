namespace ERCP.Api.DTOs;

public class CreateInventoryItemDto
{
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public int Quantity { get; set; }
    public string UnitOfMeasure { get; set; } = "Units";
    public int MinimumThreshold { get; set; } = 10;
    public int? ShelterId { get; set; }
    public string Location { get; set; } = string.Empty;
}

public class UpdateInventoryItemDto
{
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public int Quantity { get; set; }
    public string UnitOfMeasure { get; set; } = "Units";
    public int MinimumThreshold { get; set; } = 10;
    public int? ShelterId { get; set; }
    public string Location { get; set; } = string.Empty;
}

public class AdjustStockDto
{
    public int QuantityAdjustment { get; set; } // positive to add, negative to subtract
}

public class InventoryItemResponseDto
{
    public int Id { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public int MinimumThreshold { get; set; }
    public int? ShelterId { get; set; }
    public string? ShelterName { get; set; }
    public string Location { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
