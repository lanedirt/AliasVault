//-----------------------------------------------------------------------
// <copyright file="Program.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

using System.Data.Common;
using System.Reflection;
using System.Text;
using AliasServerDb;
using AliasVault.Api.Jwt;
using AliasVault.Logging;
using AliasVault.Shared.Providers.Time;
using Asp.Versioning;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
builder.Configuration.AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true);
builder.Services.ConfigureLogging(builder.Configuration, Assembly.GetExecutingAssembly().GetName().Name!, "../../logs");

builder.Services.AddSingleton<ITimeProvider, SystemTimeProvider>();
builder.Services.AddScoped<TimeValidationJwtBearerEvents>();

builder.Services.AddLogging(logging =>
{
    logging.AddConsole();
    logging.SetMinimumLevel(LogLevel.Error);
    logging.AddFilter("Microsoft.AspNetCore.Identity.DataProtectorTokenProvider", LogLevel.Error);
    logging.AddFilter("Microsoft.AspNetCore.Identity.UserManager", LogLevel.Error);
});

builder.Services.AddSingleton<DbConnection>(container =>
{
    var connection = new SqliteConnection(builder.Configuration.GetConnectionString("AliasServerDbContext"));
    connection.Open();

    return connection;
});

builder.Services.AddDbContextFactory<AliasServerDbContext>((container, options) =>
{
    var connection = container.GetRequiredService<DbConnection>();
    options.UseSqlite(connection).UseLazyLoadingProxies();
});

builder.Services.AddDataProtection();
builder.Services.Configure<DataProtectionTokenProviderOptions>(options =>
{
    options.TokenLifespan = TimeSpan.FromDays(30);
    options.Name = "AliasVault";
});
builder.Services.AddIdentity<AliasVaultUser, AliasVaultRole>(options =>
    {
        options.Password.RequireDigit = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequireUppercase = false;
        options.Password.RequiredLength = 8;
        options.Password.RequiredUniqueChars = 0;
        options.SignIn.RequireConfirmedAccount = false;
        options.Tokens.ProviderMap.Add("AliasVault", new TokenProviderDescriptor(typeof(DataProtectorTokenProvider<AliasVaultUser>)));
    })
    .AddEntityFrameworkStores<AliasServerDbContext>()
    .AddDefaultTokenProviders()
    .AddTokenProvider<DataProtectorTokenProvider<AliasVaultUser>>("AliasVault");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY");
    if (jwtKey is null)
    {
        throw new KeyNotFoundException("JWT_KEY environment variable is not set.");
    }

    options.IncludeErrorDetails = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        RequireExpirationTime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Issuer"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero,
    };

    // Add custom event handler for validating token expiration time in order
    // to be able to mutate current time for testing the token expiration logic in unit tests.
    options.EventsType = typeof(TimeValidationJwtBearerEvents);
});

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "CorsPolicy",
        policy => policy.AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader());
});

builder.Services.AddControllers();
builder.Services.AddMemoryCache();

builder.Services.AddApiVersioning(options =>
    {
        options.DefaultApiVersion = new ApiVersion(1, 0);
        options.AssumeDefaultVersionWhenUnspecified = true;
        options.ReportApiVersions = true;
    })
    .AddApiExplorer(options =>
    {
        options.GroupNameFormat = "'v'VVV";
        options.SubstituteApiVersionInUrl = true;
    });
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "AliasVault API", Version = "v1" });

    // Add JWT Authentication
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Please enter a valid token",
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        BearerFormat = "JWT",
        Scheme = "Bearer",
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer",
                },
            },
            Array.Empty<string>()
        },
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHttpsRedirection();
}

app.UseCors("CorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var container = scope.ServiceProvider;
    var db = await container.GetRequiredService<IDbContextFactory<AliasServerDbContext>>().CreateDbContextAsync();

    await db.Database.MigrateAsync();
}

await app.RunAsync();

namespace AliasVault.Api
{
    /// <summary>
    /// Explicit program class definition. This is required in order to start the WebAPI project
    /// in-memory from E2ETests project via WebApplicationFactory.
    /// </summary>
    public partial class Program
    {
    }
}
