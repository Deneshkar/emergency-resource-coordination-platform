using System.Diagnostics;
using System.Text.Json;
using ERCP.Api.DTOs;
using ERCP.Api.Models;

namespace ERCP.Api.Services;

public class IncidentPlannerService
{
    private readonly ILogger<IncidentPlannerService> _logger;

    public IncidentPlannerService(ILogger<IncidentPlannerService> logger)
    {
        _logger = logger;
    }

    public IncidentPlan GeneratePlan(Incident incident, string? customDirectives = null, string? focusPhase = null)
    {
        // Try Python AI Agent integration first if available
        var pyPlan = TryGeneratePythonAgentPlan(incident, customDirectives, focusPhase);
        if (pyPlan != null)
        {
            return pyPlan;
        }

        // Fall back to robust built-in emergency planning engine
        return GenerateRuleBasedPlan(incident, customDirectives, focusPhase);
    }

    private IncidentPlan? TryGeneratePythonAgentPlan(Incident incident, string? customDirectives, string? focusPhase)
    {
        try
        {
            var agentPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "ai-agents", "coordinator_planner_agent.py");
            if (!File.Exists(agentPath))
            {
                agentPath = Path.Combine(Directory.GetCurrentDirectory(), "ai-agents", "coordinator_planner_agent.py");
            }

            if (!File.Exists(agentPath))
            {
                return null;
            }

            var inputPayload = JsonSerializer.Serialize(new
            {
                incident_id = incident.Id,
                title = incident.Title,
                description = incident.Description,
                location = incident.Location,
                category = incident.Category,
                priority = incident.Priority,
                affected_count = incident.AffectedCount,
                custom_directives = customDirectives ?? "",
                focus_phase = focusPhase ?? ""
            });

            var psi = new ProcessStartInfo
            {
                FileName = "python",
                Arguments = $"\"{agentPath}\" --json \"{inputPayload.Replace("\"", "\\\"")}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = Process.Start(psi);
            if (process == null) return null;

            var output = process.StandardOutput.ReadToEnd();
            process.WaitForExit(3000);

            if (process.ExitCode == 0 && !string.IsNullOrWhiteSpace(output))
            {
                using var doc = JsonDocument.Parse(output);
                var root = doc.RootElement;

                // Validate structured AI output schema
                if (!ValidateStructuredAiOutput(root, incident.Id))
                {
                    _logger.LogWarning("Python AI agent output failed schema validation. Falling back to internal engine.");
                    return null;
                }

                var planTitle = root.TryGetProperty("objective", out var objProp) && !string.IsNullOrWhiteSpace(objProp.GetString())
                    ? objProp.GetString()!
                    : (root.TryGetProperty("plan_title", out var pt) ? pt.GetString() : null);

                var planDesc = root.TryGetProperty("plan_description", out var pd) ? pd.GetString() : null;
                var phase = root.TryGetProperty("phase", out var ph) ? ph.GetString() : "Immediate Containment";
                var steps = root.TryGetProperty("action_steps", out var st) ? st.GetRawText() : "[]";
                var resources = root.TryGetProperty("estimated_resources", out var res) ? res.GetRawText() : "[]";
                var risk = root.TryGetProperty("risk_assessment", out var rk) ? rk.GetString() : "";

                if (!string.IsNullOrEmpty(planTitle))
                {
                    return new IncidentPlan
                    {
                        IncidentId = incident.Id,
                        PlanTitle = planTitle,
                        PlanDescription = planDesc ?? $"Tactical response strategy for {incident.Title}",
                        Status = "Draft", // Safety constraint: Generated plan defaults to Draft until approved
                        Phase = phase ?? "Immediate Containment",
                        ActionStepsJson = steps,
                        EstimatedResourcesJson = resources,
                        RiskAssessment = risk ?? "Standard risk parameters applied.",
                        CreatedAt = DateTime.UtcNow
                    };
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Python agent invocation skipped or failed, reverting to internal AI engine.");
        }

        return null;
    }

    private bool ValidateStructuredAiOutput(JsonElement root, int expectedIncidentId)
    {
        // 1. incidentId validation
        int incId = 0;
        if (root.TryGetProperty("incidentId", out var idProp))
        {
            idProp.TryGetInt32(out incId);
        }
        else if (root.TryGetProperty("incident_id", out var idPropSnake))
        {
            idPropSnake.TryGetInt32(out incId);
        }

        if (incId != expectedIncidentId && expectedIncidentId > 0 && incId > 0)
        {
            _logger.LogWarning("AI validation failed: incidentId mismatch. Expected {Expected}, got {Actual}", expectedIncidentId, incId);
            return false;
        }

        // 2. priority present
        var priority = root.TryGetProperty("priority", out var pProp) ? pProp.GetString() : null;
        if (string.IsNullOrWhiteSpace(priority))
        {
            _logger.LogWarning("AI validation failed: priority property missing.");
            return false;
        }

        // 3. objective present
        var objective = root.TryGetProperty("objective", out var objProp) ? objProp.GetString() :
                        (root.TryGetProperty("plan_title", out var ptProp) ? ptProp.GetString() : null);
        if (string.IsNullOrWhiteSpace(objective))
        {
            _logger.LogWarning("AI validation failed: objective property missing.");
            return false;
        }

        // 4. actions present
        bool hasActions = (root.TryGetProperty("actions", out var actProp) && actProp.ValueKind == JsonValueKind.Array && actProp.GetArrayLength() > 0) ||
                          (root.TryGetProperty("action_steps", out var stProp) && stProp.ValueKind == JsonValueKind.Array && stProp.GetArrayLength() > 0);
        if (!hasActions)
        {
            _logger.LogWarning("AI validation failed: actions array missing or empty.");
            return false;
        }

        // 5. status present
        var status = root.TryGetProperty("status", out var statusProp) ? statusProp.GetString() : null;
        if (string.IsNullOrWhiteSpace(status))
        {
            _logger.LogWarning("AI validation failed: status property missing.");
            return false;
        }

        // 6. requiredResources present
        bool hasResources = (root.TryGetProperty("requiredResources", out var resProp) && resProp.ValueKind == JsonValueKind.Array) ||
                            (root.TryGetProperty("estimated_resources", out var resSnakeProp) && resSnakeProp.ValueKind == JsonValueKind.Array);
        if (!hasResources)
        {
            _logger.LogWarning("AI validation failed: requiredResources array missing.");
            return false;
        }

        return true;
    }

    private IncidentPlan GenerateRuleBasedPlan(Incident incident, string? customDirectives, string? focusPhase)
    {
        var category = (incident.Category ?? "General").Trim();
        var priority = (incident.Priority ?? "Medium").Trim();
        var affected = incident.AffectedCount;

        var title = $"{priority} Priority Response Strategy - {category} Operation";
        var description = $"AI Coordinator Action Plan generated for '{incident.Title}' at {incident.Location}. Target: Quick containment, risk reduction, and public safety.";

        if (!string.IsNullOrWhiteSpace(customDirectives))
        {
            description += $" Directives applied: {customDirectives}";
        }

        var phase = string.IsNullOrWhiteSpace(focusPhase) ? GetDefaultPhase(priority) : focusPhase;
        var actionSteps = BuildActionSteps(category, priority, affected, incident.Location);
        var estimatedResources = BuildEstimatedResources(category, priority, affected);
        var riskAssessment = BuildRiskAssessment(category, priority, affected);

        return new IncidentPlan
        {
            IncidentId = incident.Id,
            PlanTitle = title,
            PlanDescription = description,
            Status = "Draft",
            Phase = phase,
            ActionStepsJson = JsonSerializer.Serialize(actionSteps),
            EstimatedResourcesJson = JsonSerializer.Serialize(estimatedResources),
            RiskAssessment = riskAssessment,
            CreatedAt = DateTime.UtcNow
        };
    }

    private string GetDefaultPhase(string priority)
    {
        return priority switch
        {
            "Critical" => "Immediate Containment & Life Safety",
            "High" => "Resource Mobilization & Evacuation",
            "Medium" => "Tactical Response & Perimter Control",
            _ => "Monitoring & Area Assessment"
        };
    }

    private List<PlanActionStepDto> BuildActionSteps(string category, string priority, int affected, string location)
    {
        var steps = new List<PlanActionStepDto>();

        // Step 1: Initial Dispatch & Safety Perimeter
        steps.Add(new PlanActionStepDto
        {
            StepNumber = 1,
            Task = $"Establish safe perimeter and command center at {location}.",
            ResponsibleTeam = "First Response & Police Unit",
            Priority = "Critical",
            EstimatedMinutes = 15,
            IsCompleted = false
        });

        // Category specific core steps
        if (category.Contains("Fire", StringComparison.OrdinalIgnoreCase))
        {
            steps.Add(new PlanActionStepDto
            {
                StepNumber = 2,
                Task = "Deploy primary firefighting apparatus and search & rescue crews into affected structures.",
                ResponsibleTeam = "Fire & Rescue Task Force",
                Priority = "Critical",
                EstimatedMinutes = 20,
                IsCompleted = false
            });
            steps.Add(new PlanActionStepDto
            {
                StepNumber = 3,
                Task = "Set up smoke evacuation and thermal imaging scan of nearby exposures.",
                ResponsibleTeam = "HazMat & Technical Rescue",
                Priority = "High",
                EstimatedMinutes = 30,
                IsCompleted = false
            });
        }
        else if (category.Contains("Flood", StringComparison.OrdinalIgnoreCase))
        {
            steps.Add(new PlanActionStepDto
            {
                StepNumber = 2,
                Task = "Deploy swift-water rescue teams and inflatable boats for stranded residents.",
                ResponsibleTeam = "Water Rescue Team",
                Priority = "Critical",
                EstimatedMinutes = 25,
                IsCompleted = false
            });
            steps.Add(new PlanActionStepDto
            {
                StepNumber = 3,
                Task = "Stage emergency water pumps and barrier walls at critical infrastructure points.",
                ResponsibleTeam = "Public Works & Logistics",
                Priority = "High",
                EstimatedMinutes = 45,
                IsCompleted = false
            });
        }
        else if (category.Contains("Medical", StringComparison.OrdinalIgnoreCase))
        {
            steps.Add(new PlanActionStepDto
            {
                StepNumber = 2,
                Task = "Establish field triage unit and coordinate emergency ambulance corridors.",
                ResponsibleTeam = "Emergency Medical Services",
                Priority = "Critical",
                EstimatedMinutes = 15,
                IsCompleted = false
            });
            steps.Add(new PlanActionStepDto
            {
                StepNumber = 3,
                Task = "Pre-notify trauma centers and activate emergency blood supply reserves.",
                ResponsibleTeam = "Health Authority Liaison",
                Priority = "High",
                EstimatedMinutes = 20,
                IsCompleted = false
            });
        }
        else if (category.Contains("Earthquake", StringComparison.OrdinalIgnoreCase))
        {
            steps.Add(new PlanActionStepDto
            {
                StepNumber = 2,
                Task = "Deploy USAR (Urban Search & Rescue) canine and acoustic listening teams for rubble search.",
                ResponsibleTeam = "Special Rescue Task Force",
                Priority = "Critical",
                EstimatedMinutes = 30,
                IsCompleted = false
            });
            steps.Add(new PlanActionStepDto
            {
                StepNumber = 3,
                Task = "Perform structural safety assessments on critical bridges, hospitals, and shelters.",
                ResponsibleTeam = "Structural Engineering Corps",
                Priority = "High",
                EstimatedMinutes = 60,
                IsCompleted = false
            });
        }
        else
        {
            steps.Add(new PlanActionStepDto
            {
                StepNumber = 2,
                Task = "Assess hazard level, clear immediate danger zones, and secure utility lines.",
                ResponsibleTeam = "Emergency Response Team",
                Priority = "High",
                EstimatedMinutes = 30,
                IsCompleted = false
            });
        }

        // Evacuation step if high affected count
        if (affected > 10 || priority == "Critical" || priority == "High")
        {
            steps.Add(new PlanActionStepDto
            {
                StepNumber = steps.Count + 1,
                Task = $"Initiate immediate evacuation order for estimated {Math.Max(affected, 15)} individuals to designated emergency shelter.",
                ResponsibleTeam = "Evacuation & Transportation Team",
                Priority = "High",
                EstimatedMinutes = 40,
                IsCompleted = false
            });
        }

        // Final Recovery Step
        steps.Add(new PlanActionStepDto
        {
            StepNumber = steps.Count + 1,
            Task = "Conduct post-incident debrief, restock emergency supplies, and file situation report.",
            ResponsibleTeam = "Incident Coordinator Agent",
            Priority = "Medium",
            EstimatedMinutes = 60,
            IsCompleted = false
        });

        return steps;
    }

    private List<EstimatedResourceDto> BuildEstimatedResources(string category, string priority, int affected)
    {
        var multiplier = priority switch
        {
            "Critical" => 3,
            "High" => 2,
            _ => 1
        };

        var resources = new List<EstimatedResourceDto>();

        resources.Add(new EstimatedResourceDto
        {
            ResourceType = "Personnel",
            Quantity = Math.Max(5, (affected > 0 ? affected / 2 : 10) * multiplier),
            Unit = "Responders",
            Description = "Trained emergency responders, paramedics, and field officers."
        });

        if (category.Contains("Fire", StringComparison.OrdinalIgnoreCase))
        {
            resources.Add(new EstimatedResourceDto
            {
                ResourceType = "Vehicle",
                Quantity = 2 * multiplier,
                Unit = "Fire Engines / Tankers",
                Description = "Heavy water pumper trucks and aerial ladder units."
            });
        }
        else if (category.Contains("Flood", StringComparison.OrdinalIgnoreCase))
        {
            resources.Add(new EstimatedResourceDto
            {
                ResourceType = "Equipment",
                Quantity = 4 * multiplier,
                Unit = "Rescue Boats & Pumps",
                Description = "Inflatable watercraft and high-capacity drainage pumps."
            });
        }
        else if (category.Contains("Medical", StringComparison.OrdinalIgnoreCase))
        {
            resources.Add(new EstimatedResourceDto
            {
                ResourceType = "Medical",
                Quantity = 3 * multiplier,
                Unit = "Ambulances & Triage Kits",
                Description = "Advanced Life Support ambulances and mobile trauma kits."
            });
        }
        else
        {
            resources.Add(new EstimatedResourceDto
            {
                ResourceType = "Vehicle",
                Quantity = 2 * multiplier,
                Unit = "Emergency Command Vehicles",
                Description = "Field operations vehicles and mobile communication units."
            });
        }

        resources.Add(new EstimatedResourceDto
        {
            ResourceType = "Supplies",
            Quantity = Math.Max(20, affected * 2),
            Unit = "Emergency Ration Packs",
            Description = "Clean drinking water, blankets, emergency rations, and basic first aid."
        });

        return resources;
    }

    private string BuildRiskAssessment(string category, string priority, int affected)
    {
        var risk = $"[Threat Assessment] Severity Level: {priority.ToUpper()}. ";

        if (priority == "Critical" || priority == "High")
        {
            risk += "HIGH ESCALATION POTENTIAL. Risk of secondary hazards (infrastructure failure, fire spread, or medical overload). ";
        }
        else
        {
            risk += "MODERATE STABILITY. Escalation unlikely under current weather/environmental conditions. ";
        }

        if (affected > 50)
        {
            risk += $"Mass casualty/displacement risk with {affected} individuals affected. Priority focus on rapid triage and evacuation staging.";
        }
        else
        {
            risk += "Standard safety protocol enforcement required. Maintain continuous monitoring of surrounding perimeter.";
        }

        return risk;
    }
}