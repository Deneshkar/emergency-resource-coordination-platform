using System.Text;
using System.Security.Claims;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ERCP.Api.Data;
using ERCP.Api.Services;
using ERCP.Api.Models;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Npgsql;

// Load local .env (repo root + backend dir) into process env so
// GEMINI_API_KEY and Jwt__/ConnectionStrings__ overrides work with `dotnet run`.
// No extra NuGet dependency; gitignored file, never committed.
static void LoadDotEnv()
{
    var candidates = new[]
    {
        Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".env"),
        Path.Combine(Directory.GetCurrentDirectory(), "..", ".env"),
        Path.Combine(Directory.GetCurrentDirectory(), ".env"),
    };
    foreach (var path in candidates)
    {
        string full;
        try { full = Path.GetFullPath(path); }
        catch { continue; }
        if (!File.Exists(full)) continue;
        foreach (var rawLine in File.ReadAllLines(full))
        {
            var line = rawLine.Trim();
            if (line.Length == 0 || line.StartsWith("#")) continue;
            var eq = line.IndexOf('=');
            if (eq <= 0) continue;
            var key = line[..eq].Trim();
            var value = line[(eq + 1)..].Trim().Trim('"').Trim('\'');
            if (key.Length == 0) continue;
            if (Environment.GetEnvironmentVariable(key) is null)
                Environment.SetEnvironmentVariable(key, value);
        }
        break; // first found .env wins
    }
}

LoadDotEnv();

var builder = WebApplication.CreateBuilder(args);

var portEnv = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(portEnv))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{portEnv}");
}

// Add services to the container.
builder.Services.AddControllers().AddJsonOptions(o =>
{
    // Safety net for any remaining EF navigation cycles (e.g. Volunteer <-> Shifts).
    // Shift endpoints now return DTOs, so this should rarely trigger.
    o.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});
builder.Services.AddScoped<IncidentPlannerService>();
builder.Services.AddScoped<SituationAnalysisService>();
builder.Services.AddScoped<DispatchValidationService>();
builder.Services.AddScoped<GeolocationService>();
builder.Services.AddScoped<IEmailService, SmtpEmailService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Emergency Resource Coordination Platform API",
        Version = "v1",
        Description = "SE3090 Integrated Full-Stack & Agentic AI Platform API"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer' [space] and then your valid JWT token.\r\n\r\nExample: \"Bearer eyJhbGciOi...\""
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// JWT Authentication
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "ERCP.Api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "ERCP.Clients";
var jwtKey = builder.Configuration["Jwt:SecretKey"] ?? "ERCP_EmergencyResourceCoordinationPlatform_SecretKey_2026!";

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            RoleClaimType = ClaimTypes.Role,
            NameClaimType = ClaimTypes.NameIdentifier
        };
    });

// Check if PostgreSQL is accessible, otherwise fallback to InMemory Db for zero-config execution
bool usePostgres = false;

// Support DATABASE_URL env var (Railway injects this automatically)
// Format: postgresql://user:password@host:port/database
static string? ConvertDatabaseUrl(string? databaseUrl)
{
    if (string.IsNullOrEmpty(databaseUrl)) return null;
    try
    {
        var uri = new Uri(databaseUrl);
        var userInfo = uri.UserInfo.Split(':');
        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 5432;
        var database = uri.AbsolutePath.TrimStart('/');
        var username = Uri.UnescapeDataString(userInfo[0]);
        var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
        return $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true";
    }
    catch { return null; }
}

var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
var connString = ConvertDatabaseUrl(databaseUrl)
    ?? builder.Configuration.GetConnectionString("DefaultConnection");
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
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Seed initial data if DB is empty
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var planner = scope.ServiceProvider.GetRequiredService<IncidentPlannerService>();
    try
    {
        if (context.Database.IsRelational())
        {
            var creator = context.Database.GetService<IDatabaseCreator>() as RelationalDatabaseCreator;
            if (creator != null)
            {
                try { creator.CreateTables(); } catch { }
            }
        }
        else
        {
            context.Database.EnsureCreated();
        }

        if (context.Database.IsRelational())
        {
            context.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS ""Users"" (
                    ""Id"" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    ""FullName"" character varying(100) NOT NULL,
                    ""Email"" character varying(150) NOT NULL,
                    ""PasswordHash"" text NOT NULL,
                    ""Role"" character varying(30) NOT NULL,
                    ""PhoneNumber"" character varying(30),
                    ""Skills"" character varying(200),
                    ""CreatedAt"" timestamp with time zone NOT NULL,
                    ""UpdatedAt"" timestamp with time zone NOT NULL
                );
                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Users_Email"" ON ""Users"" (""Email"");
            ");

            // Self-heal databases created by an older model (EnsureCreated never
            // alters existing tables, so new columns like ConstraintsJson would
            // otherwise cause 42703 "column does not exist"). All statements are
            // idempotent and safe to run on every startup, including Railway.
            context.Database.ExecuteSqlRaw(@"
                ALTER TABLE ""Incidents"" ADD COLUMN IF NOT EXISTS ""Category"" text NOT NULL DEFAULT 'General Emergency';
                ALTER TABLE ""Incidents"" ADD COLUMN IF NOT EXISTS ""AffectedCount"" integer NOT NULL DEFAULT 0;
                ALTER TABLE ""Incidents"" ADD COLUMN IF NOT EXISTS ""ReporterContact"" text NOT NULL DEFAULT '';
                ALTER TABLE ""Incidents"" ADD COLUMN IF NOT EXISTS ""Latitude"" double precision NULL;
                ALTER TABLE ""Incidents"" ADD COLUMN IF NOT EXISTS ""Longitude"" double precision NULL;
                ALTER TABLE ""Incidents"" ADD COLUMN IF NOT EXISTS ""AssignedCoordinator"" text NOT NULL DEFAULT 'AI Coordinator';

                ALTER TABLE ""IncidentPlans"" ADD COLUMN IF NOT EXISTS ""PlanTitle"" text NOT NULL DEFAULT '';
                ALTER TABLE ""IncidentPlans"" ADD COLUMN IF NOT EXISTS ""PlanDescription"" text NOT NULL DEFAULT '';
                ALTER TABLE ""IncidentPlans"" ADD COLUMN IF NOT EXISTS ""Status"" text NOT NULL DEFAULT 'Draft';
                ALTER TABLE ""IncidentPlans"" ADD COLUMN IF NOT EXISTS ""Phase"" text NOT NULL DEFAULT 'Immediate Containment';
                ALTER TABLE ""IncidentPlans"" ADD COLUMN IF NOT EXISTS ""ActionStepsJson"" text NOT NULL DEFAULT '[]';
                ALTER TABLE ""IncidentPlans"" ADD COLUMN IF NOT EXISTS ""EstimatedResourcesJson"" text NOT NULL DEFAULT '[]';
                ALTER TABLE ""IncidentPlans"" ADD COLUMN IF NOT EXISTS ""RiskAssessment"" text NOT NULL DEFAULT '';
                ALTER TABLE ""IncidentPlans"" ADD COLUMN IF NOT EXISTS ""Reasoning"" text NOT NULL DEFAULT '';
                ALTER TABLE ""IncidentPlans"" ADD COLUMN IF NOT EXISTS ""RisksJson"" text NOT NULL DEFAULT '[]';
                ALTER TABLE ""IncidentPlans"" ADD COLUMN IF NOT EXISTS ""ConstraintsJson"" text NOT NULL DEFAULT '[]';
                ALTER TABLE ""IncidentPlans"" ADD COLUMN IF NOT EXISTS ""RequiresHumanApproval"" boolean NOT NULL DEFAULT TRUE;
                ALTER TABLE ""IncidentPlans"" ADD COLUMN IF NOT EXISTS ""SuggestedAssignmentsJson"" text NOT NULL DEFAULT '[]';
                ALTER TABLE ""IncidentPlans"" ADD COLUMN IF NOT EXISTS ""DispatchPlanJson"" text NOT NULL DEFAULT '[]';
                ALTER TABLE ""IncidentPlans"" ADD COLUMN IF NOT EXISTS ""ApprovedBy"" text NOT NULL DEFAULT '';
                ALTER TABLE ""IncidentPlans"" ADD COLUMN IF NOT EXISTS ""ApprovedAt"" timestamp with time zone NULL;
                ALTER TABLE ""IncidentPlans"" ADD COLUMN IF NOT EXISTS ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW();

                -- Dispatches created by an older model via EnsureCreated lack
                -- AllocationPlanId/ApprovedAt/ApprovedBy (42703). Idempotent heal.
                ALTER TABLE ""Dispatches"" ADD COLUMN IF NOT EXISTS ""IncidentId"" integer NOT NULL DEFAULT 0;
                ALTER TABLE ""Dispatches"" ADD COLUMN IF NOT EXISTS ""Status"" text NOT NULL DEFAULT 'Proposed';
                ALTER TABLE ""Dispatches"" ADD COLUMN IF NOT EXISTS ""Priority"" text NOT NULL DEFAULT 'Medium';
                ALTER TABLE ""Dispatches"" ADD COLUMN IF NOT EXISTS ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW();
                ALTER TABLE ""Dispatches"" ADD COLUMN IF NOT EXISTS ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT NOW();
                ALTER TABLE ""Dispatches"" ADD COLUMN IF NOT EXISTS ""ApprovedAt"" timestamp with time zone NULL;
                ALTER TABLE ""Dispatches"" ADD COLUMN IF NOT EXISTS ""ApprovedBy"" text NULL;
                ALTER TABLE ""Dispatches"" ADD COLUMN IF NOT EXISTS ""AllocationPlanId"" integer NULL;
                CREATE INDEX IF NOT EXISTS ""IX_Dispatches_AllocationPlanId"" ON ""Dispatches"" (""AllocationPlanId"");

                -- DispatchTasks base columns (old DBs may predate them).
                ALTER TABLE ""DispatchTasks"" ADD COLUMN IF NOT EXISTS ""DispatchId"" integer NOT NULL DEFAULT 0;
                ALTER TABLE ""DispatchTasks"" ADD COLUMN IF NOT EXISTS ""TaskType"" text NOT NULL DEFAULT '';
                ALTER TABLE ""DispatchTasks"" ADD COLUMN IF NOT EXISTS ""Status"" text NOT NULL DEFAULT 'Assigned';
                ALTER TABLE ""DispatchTasks"" ADD COLUMN IF NOT EXISTS ""AssignedAt"" timestamp with time zone NULL;
                ALTER TABLE ""DispatchTasks"" ADD COLUMN IF NOT EXISTS ""AcceptedAt"" timestamp with time zone NULL;
                ALTER TABLE ""DispatchTasks"" ADD COLUMN IF NOT EXISTS ""CompletedAt"" timestamp with time zone NULL;

                -- ValidationAudits table (added after initial EnsureCreated on old DBs).
                CREATE TABLE IF NOT EXISTS ""ValidationAudits"" (
                    ""Id"" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    ""DispatchId"" integer NOT NULL,
                    ""IncidentId"" integer NULL,
                    ""IsValid"" boolean NOT NULL,
                    ""Recommendation"" text NOT NULL,
                    ""ViolationsJson"" text NOT NULL,
                    ""WarningsJson"" text NOT NULL,
                    ""ChecksJson"" text NOT NULL,
                    ""ValidatedBy"" text NOT NULL,
                    ""DurationMs"" bigint NOT NULL,
                    ""ValidatedAt"" timestamp with time zone NOT NULL
                );
                CREATE INDEX IF NOT EXISTS ""IX_ValidationAudits_DispatchId"" ON ""ValidationAudits"" (""DispatchId"");
            ");

            // DispatchTasks.ResourceId changed uuid -> integer (UnifyDispatchTaskResourceId migration).
            // Old DBs still carry the uuid column which breaks the int mapping.
            context.Database.ExecuteSqlRaw(@"
                DO $$ BEGIN
                    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_DispatchTasks_Resources_ResourceId') THEN
                        ALTER TABLE ""DispatchTasks"" DROP CONSTRAINT ""FK_DispatchTasks_Resources_ResourceId"";
                    END IF;
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'DispatchTasks' AND column_name = 'ResourceId' AND udt_name = 'uuid') THEN
                        ALTER TABLE ""DispatchTasks"" DROP COLUMN ""ResourceId"";
                    END IF;
                END $$;
            ");
            context.Database.ExecuteSqlRaw(@"
                ALTER TABLE ""DispatchTasks"" ADD COLUMN IF NOT EXISTS ""ResourceId"" integer NULL;
                CREATE INDEX IF NOT EXISTS ""IX_DispatchTasks_ResourceId"" ON ""DispatchTasks"" (""ResourceId"");
            ");
            context.Database.ExecuteSqlRaw(@"
                DO $$ BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_Dispatches_IncidentPlans_AllocationPlanId') THEN
                        ALTER TABLE ""Dispatches"" ADD CONSTRAINT ""FK_Dispatches_IncidentPlans_AllocationPlanId"" FOREIGN KEY (""AllocationPlanId"") REFERENCES ""IncidentPlans"" (""Id"") ON DELETE SET NULL;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_DispatchTasks_Resources_ResourceId') THEN
                        ALTER TABLE ""DispatchTasks"" ADD CONSTRAINT ""FK_DispatchTasks_Resources_ResourceId"" FOREIGN KEY (""ResourceId"") REFERENCES ""Resources"" (""Id"") ON DELETE SET NULL;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_ValidationAudits_Dispatches_DispatchId') THEN
                        ALTER TABLE ""ValidationAudits"" ADD CONSTRAINT ""FK_ValidationAudits_Dispatches_DispatchId"" FOREIGN KEY (""DispatchId"") REFERENCES ""Dispatches"" (""Id"") ON DELETE CASCADE;
                    END IF;
                END $$;
            ");
        }

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

        // Seed default demo accounts for each assignment role
        if (!context.Users.Any())
        {
            var hasher = new PasswordHasher<User>();

            var coordinator = new User
            {
                FullName = "Sarah Chen - Emergency Operations Coordinator",
                Email = "coordinator@ercp.org",
                Role = "Coordinator",
                PhoneNumber = "+1-555-0101",
                Skills = "Incident Commander, Multi-Agency Coordination",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            coordinator.PasswordHash = hasher.HashPassword(coordinator, "Coord@123");

            var admin = new User
            {
                FullName = "System Administrator",
                Email = "admin@ercp.org",
                Role = "Admin",
                PhoneNumber = "+1-555-0100",
                Skills = "System Administration, Access Governance",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            admin.PasswordHash = hasher.HashPassword(admin, "Admin@123");

            var volunteer = new User
            {
                FullName = "Marcus Vance - First Responder",
                Email = "volunteer@ercp.org",
                Role = "Volunteer",
                PhoneNumber = "+1-555-0144",
                Skills = "Search & Rescue, Medical EMT, Heavy Equipment",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            volunteer.PasswordHash = hasher.HashPassword(volunteer, "Vol@123");

            var citizen = new User
            {
                FullName = "Elena Gomez - Downtown Resident",
                Email = "citizen@ercp.org",
                Role = "Citizen",
                PhoneNumber = "+1-555-0199",
                Skills = "Local Community Watch",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            citizen.PasswordHash = hasher.HashPassword(citizen, "Citizen@123");

            context.Users.AddRange(coordinator, admin, volunteer, citizen);
            context.SaveChanges();
        }

        // Ensure demo citizen has a sample reported incident to display in My Reports
        if (!context.Incidents.Any(i => i.ReporterContact.ToLower().Contains("citizen@ercp.org")))
        {
            var citizenInc = new Incident
            {
                Title = "Residential Gas Leak & Power Line Hazard",
                Description = "Strong gas odor detected following power transformer spark on Oakwood Avenue. Odor entering nearby residences.",
                Location = "42 Oakwood Avenue, Sector 3",
                Category = "Chemical",
                Priority = "High",
                Status = "Reported",
                AffectedCount = 18,
                ReporterContact = "citizen@ercp.org",
                AssignedCoordinator = "AI Coordinator Agent",
                CreatedAt = DateTime.UtcNow.AddHours(-2),
                UpdatedAt = DateTime.UtcNow.AddHours(-2)
            };
            context.Incidents.Add(citizenInc);

            context.IncidentTimelineEvents.Add(new IncidentTimelineEvent
            {
                Incident = citizenInc,
                EventType = "Created",
                Title = "Incident Reported by Citizen",
                Description = "Citizen Elena Gomez reported gas odor on Oakwood Avenue.",
                CreatedBy = "citizen@ercp.org",
                Timestamp = DateTime.UtcNow.AddHours(-2)
            });

            context.SaveChanges();
        }

        // Ensure demo volunteer has a corresponding Volunteer responder entry
        if (!context.Volunteers.Any(v => v.Email.ToLower() == "volunteer@ercp.org"))
        {
            var responder = new Volunteer
            {
                Name = "Marcus Vance",
                Email = "volunteer@ercp.org",
                Phone = "+1-555-0144",
                Skills = "Search & Rescue, Medical EMT, Heavy Equipment",
                IsAvailable = true,
                Rating = 4.9,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            context.Volunteers.Add(responder);
            context.SaveChanges();
        }
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "Database auto-migration/seeding skipped.");
    }
}

// Configure HTTP request pipeline
// Enable Swagger in all environments (Railway production included)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "ERCP API v1");
    c.RoutePrefix = "swagger";
});

// Health check endpoint for cloud platforms
app.MapGet("/", () => Results.Ok(new { status = "healthy", service = "ERCP.Api", timestamp = DateTime.UtcNow }));
app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

// Railway handles SSL at the edge — no HTTPS redirect needed
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

// Exposes the top-level entry point to the test project for
// WebApplicationFactory-based HTTP integration tests (Student 4).
public partial class Program { }