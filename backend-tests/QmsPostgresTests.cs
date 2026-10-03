using ERCP.Api.Data;
using ERCP.Api.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;
namespace ERCP.Api.Tests;
public class PostgresFactAttribute : FactAttribute
{
    public PostgresFactAttribute()
    {
        if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("QMS_POSTGRES")))
            Skip = "Set QMS_POSTGRES to an isolated PostgreSQL test database.";
    }
}
public class QmsPostgresTests
{
    private static AppDbContext Open() => new(new DbContextOptionsBuilder<AppDbContext>()
        .UseNpgsql(Environment.GetEnvironmentVariable("QMS_POSTGRES")).Options);
    [PostgresFact]
    public async Task DB01_DuplicateEmail_IsRejectedByPostgres()
    {
        await using var db = Open();
        await using var tx = await db.Database.BeginTransactionAsync();
        var email = $"unique-{Guid.NewGuid()}@test.local";
        db.Users.Add(new User { FullName = "First", Email = email, PasswordHash = "test-only" });
        await db.SaveChangesAsync();
        db.Users.Add(new User { FullName = "Second", Email = email, PasswordHash = "test-only" });
        var error = await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
        Assert.Equal("23505", Assert.IsType<Npgsql.PostgresException>(error.InnerException).SqlState);
    }
    [PostgresFact]
    public async Task DB02_OrphanShift_IsRejectedByForeignKey()
    {
        await using var db = Open();
        await using var tx = await db.Database.BeginTransactionAsync();
        db.Shifts.Add(new Shift { VolunteerId = Guid.NewGuid(), StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow.AddHours(1) });
        var error = await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
        Assert.Equal("23503", Assert.IsType<Npgsql.PostgresException>(error.InnerException).SqlState);
    }
    [PostgresFact]
    public async Task DB03_DeletingVolunteer_CascadesShift()
    {
        await using var db = Open();
        await using var tx = await db.Database.BeginTransactionAsync();
        var volunteer = new Volunteer { Id = Guid.NewGuid(), Name = "Cascade Test", Email = $"{Guid.NewGuid()}@test.local" };
        var shift = new Shift { VolunteerId = volunteer.Id, StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow.AddHours(1) };
        db.Add(volunteer); db.Add(shift); await db.SaveChangesAsync();
        await db.Database.ExecuteSqlInterpolatedAsync($"DELETE FROM \"Volunteers\" WHERE \"Id\" = {volunteer.Id}");
        Assert.False(await db.Shifts.AsNoTracking().AnyAsync(s => s.Id == shift.Id));
    }
    [PostgresFact]
    public async Task DB04_Rollback_DoesNotPersistResource()
    {
        var name = $"Rollback-{Guid.NewGuid()}";
        await using (var db = Open())
        {
            await using var tx = await db.Database.BeginTransactionAsync();
            db.Resources.Add(new Resource { Name = name }); await db.SaveChangesAsync(); await tx.RollbackAsync();
        }
        await using var verify = Open();
        Assert.False(await verify.Resources.AnyAsync(r => r.Name == name));
    }
}
