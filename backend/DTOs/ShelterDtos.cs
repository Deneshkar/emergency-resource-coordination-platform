namespace ERCP.Api.DTOs;

public class CreateShelterDto
{
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public int TotalCapacity { get; set; }
    public string ContactNumber { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}

public class UpdateShelterDto
{
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public int TotalCapacity { get; set; }
    public int CurrentOccupancy { get; set; }
    public string Status { get; set; } = "Active";
    public string ContactNumber { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}

public class UpdateShelterOccupancyDto
{
    public int CurrentOccupancy { get; set; }
}

public class ShelterResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public int TotalCapacity { get; set; }
    public int CurrentOccupancy { get; set; }
    public int AvailableCapacity => Math.Max(0, TotalCapacity - CurrentOccupancy);
    public string Status { get; set; } = string.Empty;
    public string ContactNumber { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
