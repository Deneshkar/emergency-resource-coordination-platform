using Microsoft.EntityFrameworkCore;
using ERCP.Api.Models;

namespace ERCP.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // Volunteer Management
    public DbSet<Volunteer> Volunteers => Set<Volunteer>();
    public DbSet<Shift> Shifts => Set<Shift>();

    // Component 3 - Dispatch & Task Assignment
    public DbSet<Dispatch> Dispatches => Set<Dispatch>();
    public DbSet<DispatchTask> DispatchTasks => Set<DispatchTask>();

    // Component - Incident Intelligence & Management
    public DbSet<Incident> Incidents => Set<Incident>();
    public DbSet<IncidentPlan> IncidentPlans => Set<IncidentPlan>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Volunteer 1 → Many Shifts
        modelBuilder.Entity<Shift>()
            .HasOne(s => s.Volunteer)
            .WithMany(v => v.Shifts)
            .HasForeignKey(s => s.VolunteerId)
            .OnDelete(DeleteBehavior.Cascade);

        // Dispatch 1 → Many DispatchTasks
        modelBuilder.Entity<DispatchTask>()
            .HasOne(t => t.Dispatch)
            .WithMany(d => d.Tasks)
            .HasForeignKey(t => t.DispatchId)
            .OnDelete(DeleteBehavior.Cascade);

        // Volunteer 1 → Many DispatchTasks
        modelBuilder.Entity<DispatchTask>()
            .HasOne(t => t.Volunteer)
            .WithMany()
            .HasForeignKey(t => t.VolunteerId)
            .OnDelete(DeleteBehavior.Restrict);

        // Incident 1 → Many IncidentPlans
        modelBuilder.Entity<IncidentPlan>()
            .HasOne(p => p.Incident)
            .WithMany(i => i.Plans)
            .HasForeignKey(p => p.IncidentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}