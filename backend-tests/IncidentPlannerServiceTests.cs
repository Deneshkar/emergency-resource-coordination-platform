using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using ERCP.Api.Data;
using ERCP.Api.Models;
using ERCP.Api.Services;
using Xunit;

namespace ERCP.Api.Tests;

public class IncidentPlannerServiceTests
{
    private AppDbContext GetInMemoryContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        var context = new AppDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }

    private (IncidentPlannerService, AppDbContext) CreateService(string dbName)
    {
        var context = GetInMemoryContext(dbName);
        var logger = new NullLogger<IncidentPlannerService>();
        var service = new IncidentPlannerService(logger, context);

        return (service, context);
    }

    [Fact]
    public void GeneratePlan_WithNoResources_AndNoVolunteers_ReportsNoAvailable()
    {
        var (service, context) = CreateService(Guid.NewGuid().ToString());
        
        var incident = new Incident
        {
            Id = 1,
            Title = "Test Incident",
            Location = "Downtown",
            Category = "Fire",
            Priority = "High",
            AffectedCount = 5
        };

        var plan = service.GeneratePlan(incident);

        Assert.NotNull(plan);
        Assert.Contains("No available resources found", plan.Reasoning);
        Assert.Contains("No available volunteers found", plan.Reasoning);
    }

    [Fact]
    public void GeneratePlan_WithAvailableResourcesAndVolunteers_AgentReceivesData()
    {
        var (service, context) = CreateService(Guid.NewGuid().ToString());
        
        context.Resources.Add(new Resource { Id = 101, Name = "Fire Engine 1", ResourceType = "Vehicle", Status = "Available" });
        context.Resources.Add(new Resource { Id = 102, Name = "Ambulance 1", ResourceType = "Vehicle", Status = "InUse" }); // Should be ignored
        context.Volunteers.Add(new Volunteer { Id = Guid.NewGuid(), Name = "John Doe", IsAvailable = true });
        context.SaveChanges();

        var incident = new Incident
        {
            Id = 2,
            Title = "Major Fire",
            Location = "Uptown",
            Category = "Fire",
            Priority = "Critical",
            AffectedCount = 15
        };

        var plan = service.GeneratePlan(incident);

        Assert.NotNull(plan);
        Assert.Contains("1 resources available", plan.Reasoning); // Ambulance ignored
        Assert.Contains("1 volunteers available", plan.Reasoning);
    }
}
