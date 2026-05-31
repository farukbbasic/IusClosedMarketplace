using IUSClosedMarketplace.API.Auth;
using IUSClosedMarketplace.API.Middleware;
using IUSClosedMarketplace.Application.Interfaces.Services;
using IUSClosedMarketplace.Application.Mappings;
using IUSClosedMarketplace.Application.Services;
using IUSClosedMarketplace.Infrastructure.Hubs;
using IUSClosedMarketplace.Infrastructure.Services;
using IUSClosedMarketplace.Persistence.Context;
using IUSClosedMarketplace.Persistence.Repositories.Implementations;
using IUSClosedMarketplace.Persistence.Repositories.Interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
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
builder.Services.AddScoped<IChatNotificationService, ChatNotificationService>();

// ─── SignalR ────────────────────────────────────────────────────────────────
builder.Services.AddSignalR();

// ─── AutoMapper ─────────────────────────────────────────────────────────────
builder.Services.AddAutoMapper(typeof(AutoMapperProfile));

// ─── Authentication: Microsoft Identity Web (Azure AD) ─────────────────────
// Reads the AzureAd section of appsettings.json (Instance, TenantId, ClientId,
// Audience). It validates the JWT signature via the IUS tenant's JWKS endpoint
// and verifies the audience claim against our API's app registration.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(
        jwtOptions =>
        {
            builder.Configuration.Bind("AzureAd", jwtOptions);

            // SignalR can't set headers on the WebSocket upgrade, so the JS
            // client passes the access token in the `access_token` query
            // string. We pull it out here and feed it to the JWT validator.
            jwtOptions.Events ??= new JwtBearerEvents();
            var existingOnMessage = jwtOptions.Events.OnMessageReceived;
            jwtOptions.Events.OnMessageReceived = async context =>
            {
                if (existingOnMessage != null) await existingOnMessage(context);

                var token = context.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(token) &&
                    context.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                {
                    context.Token = token;
                }
            };
        },
        identityOptions =>
        {
            builder.Configuration.Bind("AzureAd", identityOptions);
        });

builder.Services.AddAuthorization();

// ─── Claims transformation ─────────────────────────────────────────────────
// Maps the Azure AD identity (Object ID, email) onto our internal User row
// on every authenticated request. Auto-provisions on first sign-in. Must be
// a singleton per ASP.NET conventions; it resolves scoped services internally.
builder.Services.AddSingleton<IClaimsTransformation, AzureAdClaimsTransformation>();

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
        Description = "Paste an Azure AD access token (without the 'Bearer ' prefix)."
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
// 5173 is the Vite dev port (required by the MSAL redirect URI registration).
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "http://localhost:3000",
                "http://localhost")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // Required for SignalR
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

// Order matters: Authentication BEFORE Authorization.
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");

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
                    Role NVARCHAR(20) NOT NULL DEFAULT 'User',
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

        // Add Status column to Transactions if it was created before this feature
        db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Transactions') AND name = 'Status')
                ALTER TABLE Transactions ADD Status NVARCHAR(20) NOT NULL CONSTRAINT DF_Transactions_Status DEFAULT 'Pending';
        ");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Table creation failed.");
        throw;
    }

    // Step 4: Migrate legacy role values — 'Buyer' and 'Seller' no longer exist
    // in the enum. Any row written by old code must be updated before EF Core
    // tries to materialize them, or it will throw and make every query fail.
    try
    {
        var migrated = db.Database.ExecuteSqlRaw(
            "UPDATE Users SET Role = 'User' WHERE Role IN ('Buyer', 'Seller')");
        if (migrated > 0)
            logger.LogInformation("Migrated {Count} user(s) from legacy Buyer/Seller role to User.", migrated);
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Role migration step failed — continuing.");
    }

    // Step 5: Seed data
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

        // Seed admin user. With Azure AD, the password is unused — admin
        // status is granted by matching the email when the real Azure user
        // signs in for the first time. Change "admin@ius.edu.ba" to whichever
        // IUS account should be the initial admin.
        if (!db.Users.Any())
        {
            logger.LogInformation("Seeding admin user...");
            db.Users.Add(new IUSClosedMarketplace.Domain.Entities.User
            {
                Name = "Admin User",
                Email = "admin@ius.edu.ba",
                PasswordHash = "AZURE_AD_AUTH_NO_LOCAL_PASSWORD",
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
