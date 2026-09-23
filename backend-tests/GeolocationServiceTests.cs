using Microsoft.EntityFrameworkCore;
using ERCP.Api.Data;
using ERCP.Api.Models;
using ERCP.Api.Services;
using Xunit;

namespace ERCP.Api.Tests;

public class GeolocationServiceTests
{
    private AppDbContext GetInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public void CalculateHaversineDistanceKm_ReturnsAccurateKmDistance()
    {
        // Colombo (6.9271, 79.8612) to Kandy (7.2906, 80.6337) is approx 95-100 km
        double distance = GeolocationService.CalculateHaversineDistanceKm(6.9271, 79.8612, 7.2906, 80.6337);

        Assert.InRange(distance, 90.0, 110.0);
    }

    [Fact]
    public async Task GetNearestShelters_OrdersSheltersByProximity()
    {
        var context = GetInMemoryContext();
        context.Shelters.Add(new Shelter
        {
            Name = "Far Shelter",
            Location = "Kandy",
            TotalCapacity = 200,
            CurrentOccupancy = 10,
            Status = "Active",
            Latitude = 7.2906,
            Longitude = 80.6337
        });

        context.Shelters.Add(new Shelter
        {
            Name = "Near Shelter",
            Location = "Colombo Fort",
            TotalCapacity = 100,
            CurrentOccupancy = 20,
            Status = "Active",
            Latitude = 6.9344,
            Longitude = 79.8428
        });

        await context.SaveChangesAsync();

        var service = new GeolocationService(context);
        var nearest = await service.GetNearestSheltersAsync(6.9271, 79.8612, limit: 2);

        Assert.Equal(2, nearest.Count);
        Assert.Equal("Near Shelter", nearest[0].Name);
        Assert.True(nearest[0].DistanceKm < nearest[1].DistanceKm);
    }
}
