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
            UserAgent = httpContext?.Request.Headers.UserAgent,
            RequestPath = httpContext?.Request.Path,
            DeviceType = DetermineDeviceType(httpContext),
            OperatingSystem = DetermineOperatingSystem(httpContext),
            Browser = DetermineBrowser(httpContext),
            Country = DetermineCountry(httpContext),
            IsSuspiciousActivity = DetermineSuspiciousActivity(),
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
            IpAddress = GetIpFromContext(httpContext),
            UserAgent = httpContext?.Request.Headers.UserAgent,
            RequestPath = httpContext?.Request.Path,
            DeviceType = DetermineDeviceType(httpContext),
            OperatingSystem = DetermineOperatingSystem(httpContext),
            Browser = DetermineBrowser(httpContext),
            Country = DetermineCountry(httpContext),
            IsSuspiciousActivity = DetermineSuspiciousActivity(),
        };

        dbContext.AuthLogs.Add(authAttempt);
        await dbContext.SaveChangesAsync();
    }

    /// <summary>
    /// Determines the type of device based on the User-Agent header.
    /// </summary>
    /// <param name="context">The HttpContext containing the request information.</param>
    /// <returns>A string representing the device type: "Mobile", "Tablet", "Smart TV", "Desktop", or "Unknown".</returns>
    private string DetermineDeviceType(HttpContext? context)
    {
        if (context == null) return "Unknown";

        return context.Request.Headers["User-Agent"].ToString().ToLower() switch
        {
            var ua when ua.Contains("mobile") || ua.Contains("android") || ua.Contains("iphone") => "Mobile",
            var ua when ua.Contains("tablet") || ua.Contains("ipad") => "Tablet",
            var ua when ua.Contains("tv") || ua.Contains("smart-tv") => "Smart TV",
            _ => "Desktop"
        };
    }

    /// <summary>
    /// Determines the operating system based on the User-Agent header.
    /// </summary>
    /// <param name="context">The HttpContext containing the request information.</param>
    /// <returns>A string representing the operating system: "Windows", "MacOS", "Linux", "Android", "iOS", or "Unknown".</returns>
    private string DetermineOperatingSystem(HttpContext? context)
    {
        if (context is null)
        {
            return "Unknown";
        }

        return context.Request.Headers.UserAgent.ToString().ToLower() switch
        {
            var ua when ua.Contains("win") => "Windows",
            var ua when ua.Contains("mac") => "MacOS",
            var ua when ua.Contains("linux") => "Linux",
            var ua when ua.Contains("android") => "Android",
            var ua when ua.Contains("iphone") || ua.Contains("ipad") => "iOS",
            _ => "Unknown",
        };
    }

    /// <summary>
    /// Determines the browser type based on the User-Agent header.
    /// </summary>
    /// <param name="context">The HttpContext containing the request information.</param>
    /// <returns>A string representing the browser: "Firefox", "Chrome", "Safari", "Edge", "Opera", or "Unknown".</returns>
    private string DetermineBrowser(HttpContext? context)
    {
        if (context is null)
        {
            return "Unknown";
        }

        return context.Request.Headers.UserAgent.ToString().ToLower() switch
        {
            var ua when ua.Contains("firefox") => "Firefox",
            var ua when ua.Contains("chrome") && !ua.Contains("edg") => "Chrome",
            var ua when ua.Contains("safari") && !ua.Contains("chrome") => "Safari",
            var ua when ua.Contains("edg") => "Edge",
            var ua when ua.Contains("opr") || ua.Contains("opera") => "Opera",
            _ => "Unknown"
        };
    }

    /// <summary>
    /// Determines the country based on the IP address of the request.
    /// </summary>
    /// <param name="context">The HttpContext containing the request information.</param>
    /// <returns>A string representing the country or "Unknown" if the country cannot be determined.</returns>
    /// <remarks>
    /// This method currently returns a placeholder value. In a production environment,
    /// it should be implemented using a Geo-IP database or service for accurate results.
    /// </remarks>
    private string DetermineCountry(HttpContext? context)
    {
        // Implement later by using a Geo-IP database or service.
        return "Unknown";
    }

    /// <summary>
    /// Logic to determine if the activity is suspicious. For the moment it always returns false.
    /// Needs to be implemented later.
    /// </summary>
    /// <returns></returns>
    private bool DetermineSuspiciousActivity() => false;

    /// <summary>
    /// Extract IP address from HttpContext.
    /// </summary>
    /// <param name="httpContext">HttpContext to extract the IP address from.</param>
    /// <returns></returns>
    private string GetIpFromContext(HttpContext? httpContext)
    {
        string ipAddress = "";

        if (httpContext == null)
        {
            return ipAddress;
        }

        if (string.IsNullOrEmpty(ipAddress))
        {
            // Check if X-Forwarded-For header exists, if so, extract first IP address from comma separated list.
            if (httpContext.Request.Headers.ContainsKey("X-Forwarded-For"))
            {
                ipAddress = httpContext.Request.Headers["X-Forwarded-For"].ToString().Split(',')[0];
            }
            else
            {
                // Otherwise use RemoteIpAddress.
                ipAddress = httpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0";
            }
        }

        // Anonymize the last octet of the IP address.
        if (ipAddress.Contains('.'))
        {
            try
            {
                ipAddress = ipAddress.Split('.')[0] + "." + ipAddress.Split('.')[1] + "." + ipAddress.Split('.')[2] + ".xxx";
            }
            catch
            {
                // If an exception occurs, continue execution with original IP address.
            }
        }

        return ipAddress;
    }
}
