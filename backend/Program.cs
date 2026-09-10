using Microsoft.EntityFrameworkCore;
using ERCP.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register DbContext with PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register Student 2 Situation Analysis AI Agent Service
builder.Services.AddScoped<ERCP.Api.Services.SituationAnalysisService>();

// Add CORS configuration - allows any localhost port (React on 5173, Flutter web on a changing port, etc.)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalDev", policy =>
    {
        policy.SetIsOriginAllowed(origin => new Uri(origin).Host == "localhost")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Enable CORS policy (Must be placed before UseAuthorization and MapControllers)
app.UseCors("AllowLocalDev");

app.UseAuthorization();

app.MapControllers();

app.Run();