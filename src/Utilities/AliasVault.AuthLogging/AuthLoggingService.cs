//-----------------------------------------------------------------------
// <copyright file="AuthLoggingService.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.AuthLogging;

using AliasServerDb;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

/// <summary>
/// User service for managing users.
/// </summary>
/// <param name="serviceProvider">IServiceProvider instance.</param>
/// <param name="httpContextAccessor">IHttpContextAccessor instance.</param>
public class AuthLoggingService(IServiceProvider serviceProvider, IHttpContextAccessor httpContextAccessor)
{
    /// <summary>
    /// Logs a successful auth event.
    /// </summary>
    /// <param name="username">Username of login attempt.</param>
    /// <param name="eventType">The type of auth event.</param>
    public async Task LogAuthEventSuccessAsync(string username, AuthEventType eventType)
    {
        using var scope = serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AliasServerDbContext>();

        var httpContext = httpContextAccessor.HttpContext;

        var authAttempt = new AuthLog
        {
            Timestamp = DateTime.UtcNow,
            Username = username,
            EventType = eventType,
            IsSuccess = true,
            FailureReason = null,
            IpAddress = httpContext?.Connection.RemoteIpAddress?.ToString(),
            UserAgent = httpContext?.Request.Headers["User-Agent"],
            RequestPath = httpContext?.Request.Path,
            DeviceType = DetermineDeviceType(httpContext),
            OperatingSystem = DetermineOperatingSystem(httpContext),
            Browser = DetermineBrowser(httpContext),
            Country = DetermineCountry(httpContext),
            IsSuspiciousActivity = DetermineSuspiciousActivity(httpContext),
        };

        dbContext.AuthLogs.Add(authAttempt);
        await dbContext.SaveChangesAsync();
    }

    /// <summary>
    /// Logs an unsuccessful (failed) authentication attempt.
    /// </summary>
    /// <param name="username">Username of login attempt.</param>
    ///  <param name="eventType">The type of auth event.</param>
    /// <param name="failureReason">Reason of failure. Defaults to AuthFailureReason.None to indicate success.</param>
    public async Task LogAuthEventFailAsync(string username, AuthEventType eventType, AuthFailureReason failureReason)
    {
        using var scope = serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AliasServerDbContext>();

        var httpContext = httpContextAccessor.HttpContext;

        var authAttempt = new AuthLog
        {
            Timestamp = DateTime.UtcNow,
            Username = username,
            EventType = eventType,
            IsSuccess = false,
            FailureReason = failureReason,
            IpAddress = httpContext?.Connection.RemoteIpAddress?.ToString(),
            UserAgent = httpContext?.Request.Headers["User-Agent"],
            RequestPath = httpContext?.Request.Path,
            DeviceType = DetermineDeviceType(httpContext),
            OperatingSystem = DetermineOperatingSystem(httpContext),
            Browser = DetermineBrowser(httpContext),
            Country = DetermineCountry(httpContext),
            IsSuspiciousActivity = DetermineSuspiciousActivity(httpContext)
        };

        dbContext.AuthLogs.Add(authAttempt);
        await dbContext.SaveChangesAsync();
    }

    // Implement these methods based on your requirements and available data
    private string DetermineDeviceType(HttpContext? context) => "Unknown";
    private string DetermineOperatingSystem(HttpContext? context) => "Unknown";
    private string DetermineBrowser(HttpContext? context) => "Unknown";
    private string DetermineCountry(HttpContext? context) => "Unknown";
    private bool DetermineSuspiciousActivity(HttpContext? context) => false;
}
