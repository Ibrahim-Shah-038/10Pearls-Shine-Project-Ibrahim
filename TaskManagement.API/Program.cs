using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using TaskManagement.API.Data;
using TaskManagement.API.Helpers;
using TaskManagement.API.Hubs;
using TaskManagement.API.Middleware;
using TaskManagement.API.Models;
using TaskManagement.API.Services;

// Configure Serilog
var configuration = new ConfigurationBuilder()
    .AddJsonFile("appsettings.json")
    .Build();

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("Logs/taskmanager-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

try
{
    Log.Information("Starting Task Management System API...");
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog();

    // Add services to the container.
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();

    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

    // Register Business Services
    builder.Services.AddScoped<ITaskService, TaskService>();
    builder.Services.AddScoped<IUserService, UserService>();

    // Register SignalR
    builder.Services.AddSignalR();

    // Configure CORS to work with the React Frontend
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("CorsPolicy", policy =>
        {
            policy.WithOrigins("http://localhost:3000") // React App Port
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
    });

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer = builder.Configuration["Jwt:Issuer"],
                ValidAudience = builder.Configuration["Jwt:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"])
                )
            };
        });

    builder.Services.AddAuthorization();

    var app = builder.Build();

    // Use Exception Handling Middleware first
    app.UseMiddleware<ExceptionHandlingMiddleware>();

    // Configure the HTTP request pipeline.
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseHttpsRedirection();

    // Enable CORS before Authentication/Authorization
    app.UseCors("CorsPolicy");

    app.UseAuthentication();
    app.UseAuthorization();

    // Seed default SuperUser
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        try
        {
            var context = services.GetRequiredService<ApplicationDbContext>();
            var superuserEmail = "superuser@taskmanagement.com";
            var existingSuper = context.Users.FirstOrDefault(u => u.Email == superuserEmail);
            if (existingSuper == null)
            {
                Log.Information("Seeding default SuperUser account...");
                context.Users.Add(new User
                {
                    Username = "superuser",
                    Email = superuserEmail,
                    PasswordHash = PasswordHasher.Hash("SuperUser@123"),
                    Role = "SuperUser"
                });
                context.SaveChanges();
                Log.Information("SuperUser account seeded successfully.");
            }
        }
        catch (Exception ex)
        {
            Log.Error(ex, "An error occurred while seeding the database.");
        }
    }

    app.MapControllers();
    app.MapHub<TaskHub>("/taskhub");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Host terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

