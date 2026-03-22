using System.Text;
using IUSClosedMarketplace.API.Middleware;
using IUSClosedMarketplace.Application.Interfaces.Services;
using IUSClosedMarketplace.Application.Mappings;
using IUSClosedMarketplace.Application.Services;
using IUSClosedMarketplace.Infrastructure.Services;
using IUSClosedMarketplace.Persistence.Context;
using IUSClosedMarketplace.Persistence.Repositories.Implementations;
using IUSClosedMarketplace.Persistence.Repositories.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ─── Database ───────────────────────────────────────────────────────────────
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ─── Repositories ───────────────────────────────────────────────────────────
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IListingRepository, ListingRepository>();
builder.Services.AddScoped<IMessageRepository, MessageRepository>();

// ─── Services ───────────────────────────────────────────────────────────────
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IListingService, ListingService>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();

// ─── Infrastructure Services ────────────────────────────────────────────────
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();

// ─── AutoMapper ─────────────────────────────────────────────────────────────
builder.Services.AddAutoMapper(typeof(AutoMapperProfile));

// ─── Authentication ─────────────────────────────────────────────────────────
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
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
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
    };
});

builder.Services.AddAuthorization();

// ─── Controllers ────────────────────────────────────────────────────────────
builder.Services.AddControllers();

// ─── Swagger ────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "IUS Closed Marketplace API",
        Version = "v1",
        Description = "API for the IUS Closed Marketplace platform"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer' followed by a space and your JWT token."
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

// ─── CORS ───────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// ─── Middleware Pipeline ────────────────────────────────────────────────────
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ─── Database initialization ────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    // Step 1: Wait for SQL Server to be ready
    for (int i = 1; i <= 20; i++)
    {
        try
        {
            logger.LogInformation("Connecting to database (attempt {Attempt}/20)...", i);
            db.Database.CanConnect();
            logger.LogInformation("Database server is reachable.");
            break;
        }
        catch (Exception ex)
        {
            logger.LogWarning("Not ready: {Message}", ex.Message);
            if (i == 20) throw;
            Thread.Sleep(3000);
        }
    }

    // Step 2: Try EnsureCreated (works when DB doesn't exist yet)
    try
    {
        var created = db.Database.EnsureCreated();
        logger.LogInformation("EnsureCreated result: {Result}", created);
    }
    catch (Exception ex)
    {
        logger.LogWarning("EnsureCreated failed: {Message}. Will use raw SQL.", ex.Message);
    }

    // Step 3: Check if tables exist. If not, create them with raw SQL.
    try
    {
        var tableCount = db.Database.SqlQueryRaw<int>(
            "SELECT COUNT(*) AS [Value] FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'"
        ).FirstOrDefault();

        logger.LogInformation("Found {Count} tables in database.", tableCount);

        if (tableCount < 7)
        {
            logger.LogInformation("Creating tables with raw SQL...");

            db.Database.ExecuteSqlRaw(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Categories')
                CREATE TABLE Categories (
                    Id INT IDENTITY(1,1) PRIMARY KEY,
                    Name NVARCHAR(200) NOT NULL,
                    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                    UpdatedAt DATETIME2 NULL
                );
            ");

            db.Database.ExecuteSqlRaw(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
                CREATE TABLE Users (
                    Id INT IDENTITY(1,1) PRIMARY KEY,
                    Name NVARCHAR(100) NOT NULL,
                    Email NVARCHAR(200) NOT NULL,
                    PasswordHash NVARCHAR(MAX) NOT NULL,
                    Role NVARCHAR(20) NOT NULL DEFAULT 'Buyer',
                    IsBanned BIT NOT NULL DEFAULT 0,
                    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                    UpdatedAt DATETIME2 NULL
                );
            ");

            db.Database.ExecuteSqlRaw(@"
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Email')
                CREATE UNIQUE INDEX IX_Users_Email ON Users(Email);
            ");

            db.Database.ExecuteSqlRaw(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Listings')
                CREATE TABLE Listings (
                    Id INT IDENTITY(1,1) PRIMARY KEY,
                    Title NVARCHAR(200) NOT NULL,
                    Description NVARCHAR(2000) NULL,
                    Price DECIMAL(18,2) NOT NULL,
                    Condition NVARCHAR(50) NOT NULL,
                    ImageUrls NVARCHAR(2000) NULL,
                    IsActive BIT NOT NULL DEFAULT 1,
                    CategoryId INT NOT NULL,
                    SellerId INT NOT NULL,
                    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                    UpdatedAt DATETIME2 NULL,
                    CONSTRAINT FK_Listings_Categories FOREIGN KEY (CategoryId) REFERENCES Categories(Id),
                    CONSTRAINT FK_Listings_Users FOREIGN KEY (SellerId) REFERENCES Users(Id)
                );
            ");

            db.Database.ExecuteSqlRaw(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Messages')
                CREATE TABLE Messages (
                    Id INT IDENTITY(1,1) PRIMARY KEY,
                    Content NVARCHAR(2000) NOT NULL,
                    SenderId INT NOT NULL,
                    ReceiverId INT NOT NULL,
                    ListingId INT NOT NULL,
                    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                    UpdatedAt DATETIME2 NULL,
                    CONSTRAINT FK_Messages_Sender FOREIGN KEY (SenderId) REFERENCES Users(Id),
                    CONSTRAINT FK_Messages_Receiver FOREIGN KEY (ReceiverId) REFERENCES Users(Id),
                    CONSTRAINT FK_Messages_Listings FOREIGN KEY (ListingId) REFERENCES Listings(Id)
                );
            ");

            db.Database.ExecuteSqlRaw(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Reports')
                CREATE TABLE Reports (
                    Id INT IDENTITY(1,1) PRIMARY KEY,
                    Reason NVARCHAR(1000) NOT NULL,
                    Status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
                    ReporterId INT NOT NULL,
                    ListingId INT NOT NULL,
                    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                    UpdatedAt DATETIME2 NULL,
                    CONSTRAINT FK_Reports_Users FOREIGN KEY (ReporterId) REFERENCES Users(Id),
                    CONSTRAINT FK_Reports_Listings FOREIGN KEY (ListingId) REFERENCES Listings(Id)
                );
            ");

            db.Database.ExecuteSqlRaw(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Favorites')
                CREATE TABLE Favorites (
                    Id INT IDENTITY(1,1) PRIMARY KEY,
                    UserId INT NOT NULL,
                    ListingId INT NOT NULL,
                    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                    UpdatedAt DATETIME2 NULL,
                    CONSTRAINT FK_Favorites_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
                    CONSTRAINT FK_Favorites_Listings FOREIGN KEY (ListingId) REFERENCES Listings(Id),
                    CONSTRAINT UQ_Favorites UNIQUE (UserId, ListingId)
                );
            ");

            db.Database.ExecuteSqlRaw(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Transactions')
                CREATE TABLE Transactions (
                    Id INT IDENTITY(1,1) PRIMARY KEY,
                    Amount DECIMAL(18,2) NOT NULL,
                    BuyerId INT NOT NULL,
                    SellerId INT NOT NULL,
                    ListingId INT NOT NULL,
                    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                    UpdatedAt DATETIME2 NULL,
                    CONSTRAINT FK_Transactions_Buyer FOREIGN KEY (BuyerId) REFERENCES Users(Id),
                    CONSTRAINT FK_Transactions_Seller FOREIGN KEY (SellerId) REFERENCES Users(Id),
                    CONSTRAINT FK_Transactions_Listings FOREIGN KEY (ListingId) REFERENCES Listings(Id)
                );
            ");

            logger.LogInformation("All 7 tables created.");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Table creation failed.");
        throw;
    }

    // Step 4: Seed data
    try
    {
        if (!db.Categories.Any())
        {
            logger.LogInformation("Seeding categories...");
            db.Categories.AddRange(
                new IUSClosedMarketplace.Domain.Entities.Category { Name = "Electronics" },
                new IUSClosedMarketplace.Domain.Entities.Category { Name = "Books" },
                new IUSClosedMarketplace.Domain.Entities.Category { Name = "Furniture" },
                new IUSClosedMarketplace.Domain.Entities.Category { Name = "Clothing" },
                new IUSClosedMarketplace.Domain.Entities.Category { Name = "Sports" },
                new IUSClosedMarketplace.Domain.Entities.Category { Name = "Other" }
            );
            db.SaveChanges();
        }

        if (!db.Users.Any())
        {
            logger.LogInformation("Seeding admin user...");
            db.Users.Add(new IUSClosedMarketplace.Domain.Entities.User
            {
                Name = "Admin User",
                Email = "admin@ius.edu.ba",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                Role = IUSClosedMarketplace.Domain.Enums.UserRole.Admin,
                IsBanned = false
            });
            db.SaveChanges();
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Seeding failed.");
    }

    logger.LogInformation("=== DATABASE READY ===");
}

app.Run();
