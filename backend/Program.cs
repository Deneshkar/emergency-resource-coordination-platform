using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using ERCP.Api.Data;
using ERCP.Api.Services;
using ERCP.Api.Models;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
<<<<<<< HEAD
builder.Services.AddScoped<IncidentPlannerService>();
=======

>>>>>>> origin/main
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// JWT Authentication
<<<<<<< HEAD
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
=======
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
>>>>>>> origin/main
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
    });

<<<<<<< HEAD
// Check if PostgreSQL is accessible, otherwise fallback to InMemory Db for zero-config execution
bool usePostgres = false;
var connString = builder.Configuration.GetConnectionString("DefaultConnection");
if (!string.IsNullOrEmpty(connString))
{
    try
    {
        using var testConn = new NpgsqlConnection(connString);
        testConn.Open();
        usePostgres = true;
    }
    catch
    {
        usePostgres = false;
    }
}

builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (usePostgres)
    {
        options.UseNpgsql(connString);
    }
    else
    {
        options.UseInMemoryDatabase("ERCP_Db");
    }
});

// Add CORS configuration
=======
// Register DbContext with PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

// CORS configuration
>>>>>>> origin/main
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalDev", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
<<<<<<< HEAD
                new Uri(origin).Host == "localhost"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
=======
        {
            return new Uri(origin).Host == "localhost";
        })
        .AllowAnyHeader()
        .AllowAnyMethod();
>>>>>>> origin/main
    });
});

var app = builder.Build();

<<<<<<< HEAD
// Seed initial data if DB is empty
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var planner = scope.ServiceProvider.GetRequiredService<IncidentPlannerService>();
    
    try
    {
        context.Database.EnsureCreated();
        if (!context.Incidents.Any())
        {
            var inc1 = new Incident
            {
                Title = "Commercial High-Rise Fire",
                Description = "Heavy smoke and structural fire reported on upper floors of Metro Business Tower. Multiple occupants trapped.",
                Location = "Metro Business Center, Floor 14, Downtown",
                Category = "Fire",
                Priority = "Critical",
                Status = "Active Planning",
                AffectedCount = 45,
                ReporterContact = "Building Manager Ops",
                AssignedCoordinator = "AI Coordinator Agent",
                CreatedAt = DateTime.UtcNow.AddMinutes(-30),
                UpdatedAt = DateTime.UtcNow.AddMinutes(-10)
            };

            var inc2 = new Incident
            {
                Title = "Flash Flood Emergency",
                Description = "Severe rainfall caused riverbank overflow. Ground-level homes inundated with 3ft standing water.",
                Location = "Riverside Residential District, Sector 7",
                Category = "Flood",
                Priority = "High",
                Status = "Reported",
                AffectedCount = 120,
                ReporterContact = "Local Emergency Dispatch",
                AssignedCoordinator = "AI Coordinator Agent",
                CreatedAt = DateTime.UtcNow.AddHours(-1),
                UpdatedAt = DateTime.UtcNow.AddHours(-1)
            };

            context.Incidents.AddRange(inc1, inc2);
            context.SaveChanges();

            // Generate initial AI plans for sample incidents
            var plan1 = planner.GeneratePlan(inc1);
            plan1.Status = "InExecution";
            context.IncidentPlans.Add(plan1);

            var plan2 = planner.GeneratePlan(inc2);
            context.IncidentPlans.Add(plan2);

            // Add sample timeline events
            context.IncidentTimelineEvents.Add(new IncidentTimelineEvent
            {
                IncidentId = inc1.Id,
                EventType = "Created",
                Title = "Incident Reported",
                Description = "Commercial High-Rise Fire reported at Metro Business Tower.",
                CreatedBy = "Building Manager Ops",
                Timestamp = DateTime.UtcNow.AddMinutes(-30)
            });

            context.IncidentTimelineEvents.Add(new IncidentTimelineEvent
            {
                IncidentId = inc1.Id,
                EventType = "PlanGenerated",
                Title = "AI Response Plan Activated",
                Description = $"Coordinator Agent generated response plan: '{plan1.PlanTitle}'.",
                CreatedBy = "AI Coordinator Agent",
                Timestamp = DateTime.UtcNow.AddMinutes(-10)
            });

            context.SaveChanges();
        }
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "Database auto-migration/seeding skipped.");
    }
}

// Configure HTTP request pipeline
=======
// Configure the HTTP request pipeline.
>>>>>>> origin/main
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowLocalDev");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

<<<<<<< HEAD
=======
app.MapControllers();

// IMPORTANT: Start the ASP.NET Core application
>>>>>>> origin/main
app.Run();