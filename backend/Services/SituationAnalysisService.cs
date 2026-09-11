using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ERCP.Api.Data;
using ERCP.Api.DTOs;
using ERCP.Api.Models;

namespace ERCP.Api.Services;

public class SituationAnalysisService
{
    private readonly AppDbContext _context;

    public SituationAnalysisService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<SituationAssessmentResponseDto> AssessSituationAsync(int incidentId)
    {
        var incident = await _context.Incidents.FindAsync(incidentId);
        if (incident == null)
        {
            throw new KeyNotFoundException($"Incident with ID {incidentId} not found.");
        }

        // 1. Tool Call: Calculate Urgency Score based on Incident Priority and Title/Description keywords
        int urgencyScore = CalculateUrgencyScore(incident);
        string urgencyLevel = GetUrgencyLevel(urgencyScore);

        // 2. Tool Call: Evaluate Inventory Deficiencies
        var (deficiencies, summaryParts) = await EvaluateInventoryDeficienciesAsync();

        // 3. Tool Call: Evaluate Shelter Capacity & Nearest Match
        var shelterMatch = await FindBestAvailableShelterAsync();

        // 4. Synthesize Analysis Summary
        string recommendedResources = DetermineRecommendedResourceTypes(incident, urgencyLevel);
        string shelterSummary = shelterMatch != null
            ? $"Nearest shelter identified: {shelterMatch.Name} with {shelterMatch.AvailableCapacity} available capacity."
            : "Warning: No active shelters with available capacity found.";

        string summary = $"[Situation Analysis Agent] Assessment for Incident #{incident.Id} ('{incident.Title}'): " +
                         $"Urgency evaluated as {urgencyLevel} ({urgencyScore}/100). " +
                         $"{string.Join(" ", summaryParts)} {shelterSummary}";

        // 5. Persist Workflow State
        var assessment = new SituationAssessment
        {
            IncidentId = incident.Id,
            UrgencyScore = urgencyScore,
            UrgencyLevel = urgencyLevel,
            AnalysisSummary = summary,
            RecommendedResourceTypes = recommendedResources,
            NearestShelterId = shelterMatch?.Id,
            ResourceDeficiencyJson = JsonSerializer.Serialize(deficiencies),
            CreatedAt = DateTime.UtcNow
        };

        _context.SituationAssessments.Add(assessment);
        await _context.SaveChangesAsync();

        return new SituationAssessmentResponseDto
        {
            Id = assessment.Id,
            IncidentId = incident.Id,
            IncidentTitle = incident.Title,
            IncidentLocation = incident.Location,
            UrgencyScore = urgencyScore,
            UrgencyLevel = urgencyLevel,
            AnalysisSummary = summary,
            RecommendedResourceTypes = recommendedResources,
            NearestShelterId = shelterMatch?.Id,
            NearestShelterName = shelterMatch?.Name,
            AvailableShelterCapacity = shelterMatch?.AvailableCapacity ?? 0,
            ResourceDeficiencies = deficiencies,
            CreatedAt = assessment.CreatedAt
        };
    }

    private static int CalculateUrgencyScore(Incident incident)
    {
        int score = incident.Priority.ToLower() switch
        {
            "critical" => 90,
            "high" => 75,
            "medium" => 50,
            "low" => 25,
            _ => 50
        };

        string desc = (incident.Title + " " + incident.Description).ToLower();
        if (desc.Contains("flood") || desc.Contains("collapse") || desc.Contains("casualty") || desc.Contains("fire"))
        {
            score = Math.Min(100, score + 10);
        }

        return score;
    }

    private static string GetUrgencyLevel(int score) => score switch
    {
        >= 85 => "Critical",
        >= 65 => "High",
        >= 40 => "Medium",
        _ => "Low"
    };

    private async Task<(List<ResourceDeficiencyDto> Deficiencies, List<string> SummaryParts)> EvaluateInventoryDeficienciesAsync()
    {
        var inventoryItems = await _context.InventoryItems.ToListAsync();
        var resources = await _context.Resources.Where(r => r.Status == "Available").ToListAsync();

        var deficiencies = new List<ResourceDeficiencyDto>();
        var summaryParts = new List<string>();

        int medicalCount = inventoryItems.Where(i => i.Category.Equals("Medical", StringComparison.OrdinalIgnoreCase)).Sum(i => i.Quantity);
        int foodCount = inventoryItems.Where(i => i.Category.Equals("Food", StringComparison.OrdinalIgnoreCase) || i.Category.Equals("Water", StringComparison.OrdinalIgnoreCase)).Sum(i => i.Quantity);
        int vehicleCount = resources.Count(r => r.ResourceType.Equals("Vehicle", StringComparison.OrdinalIgnoreCase));

        deficiencies.Add(new ResourceDeficiencyDto
        {
            Category = "Medical Supplies",
            Available = medicalCount,
            Recommended = 50,
            IsDeficit = medicalCount < 50
        });

        deficiencies.Add(new ResourceDeficiencyDto
        {
            Category = "Food & Water Rations",
            Available = foodCount,
            Recommended = 100,
            IsDeficit = foodCount < 100
        });

        deficiencies.Add(new ResourceDeficiencyDto
        {
            Category = "Transport Vehicles",
            Available = vehicleCount,
            Recommended = 3,
            IsDeficit = vehicleCount < 3
        });

        var deficits = deficiencies.Where(d => d.IsDeficit).Select(d => d.Category).ToList();
        if (deficits.Any())
        {
            summaryParts.Add($"Resource deficit detected in: {string.Join(", ", deficits)}.");
        }
        else
        {
            summaryParts.Add("Current resource inventory levels meet baseline emergency thresholds.");
        }

        return (deficiencies, summaryParts);
    }

    private async Task<ShelterMatch?> FindBestAvailableShelterAsync()
    {
        var activeShelters = await _context.Shelters
            .Where(s => s.Status == "Active")
            .ToListAsync();

        var suitable = activeShelters
            .Select(s => new ShelterMatch
            {
                Id = s.Id,
                Name = s.Name,
                AvailableCapacity = Math.Max(0, s.TotalCapacity - s.CurrentOccupancy)
            })
            .Where(s => s.AvailableCapacity > 0)
            .OrderByDescending(s => s.AvailableCapacity)
            .FirstOrDefault();

        return suitable;
    }

    private static string DetermineRecommendedResourceTypes(Incident incident, string urgencyLevel)
    {
        var types = new List<string>();
        string combined = (incident.Title + " " + incident.Description).ToLower();

        if (combined.Contains("medical") || combined.Contains("injury") || urgencyLevel == "Critical")
            types.Add("Ambulance / Medical Unit");
        if (combined.Contains("evacuation") || combined.Contains("flood") || urgencyLevel == "High" || urgencyLevel == "Critical")
            types.Add("Evacuation Vehicle");
        if (combined.Contains("fire") || combined.Contains("explosion"))
            types.Add("Fire Tender / Rescue Rig");

        if (!types.Any())
            types.Add("General Response Vehicle");

        return string.Join(", ", types);
    }

    private class ShelterMatch
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int AvailableCapacity { get; set; }
    }
}
