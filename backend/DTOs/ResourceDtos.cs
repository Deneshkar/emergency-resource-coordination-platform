namespace ERCP.Api.DTOs;

public class CreateResourceDto
{
    public string Name { get; set; } = string.Empty;
    public string ResourceType { get; set; } = "Vehicle";
    public int Capacity { get; set; } = 1;
    public string Location { get; set; } = string.Empty;
    public int? ShelterId { get; set; }
}

public class UpdateResourceDto
{
    public string Name { get; set; } = string.Empty;
    public string ResourceType { get; set; } = "Vehicle";
    public string Status { get; set; } = "Available";
    public int Capacity { get; set; } = 1;
    public string Location { get; set; } = string.Empty;
    public int? ShelterId { get; set; }
}

public class UpdateResourceStatusDto
{
    public string Status { get; set; } = "Available";
}

public class ResourceResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ResourceType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public string Location { get; set; } = string.Empty;
    public int? ShelterId { get; set; }
    public string? ShelterName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
