using Microsoft.EntityFrameworkCore;
using ERCP.Api.Models;

namespace ERCP.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Volunteer> Volunteers => Set<Volunteer>();
    public DbSet<Shift> Shifts => Set<Shift>();
}