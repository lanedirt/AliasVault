//-----------------------------------------------------------------------
// <copyright file="LoggingConfiguration.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Logging;

using System.Globalization;
using AliasServerDb;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Serilog;
using Serilog.Events;
using Serilog.Filters;

/// <summary>
/// Extension methods for configuring logging.
/// </summary>
public static class LoggingConfiguration
{
    /// <summary>
    /// Configures Serilog logging for the application.
    /// </summary>
    /// <param name="services">IServiceCollection.</param>
    /// <param name="configuration">IConfiguration.</param>
    /// <param name="applicationName">The application name to include in the log.</param>
    /// <returns>IServiceCollection instance.</returns>
    public static IServiceCollection ConfigureLogging(this IServiceCollection services, IConfiguration configuration, string applicationName)
    {
        services.AddSerilog(new LoggerConfiguration()
            .ReadFrom.Configuration(configuration)
            .Enrich.FromLogContext()
            .Enrich.WithProperty("Application", applicationName)
            .Filter.ByIncludingOnly(GetSourceContextFilter(configuration))

            // Log to console.
            .WriteTo.Logger(lc => lc
                .WriteTo.Console())

            // Log everything to a file.
            .WriteTo.Logger(lc => lc
                .WriteTo.File($"logs/{applicationName}-log-.txt", rollingInterval: RollingInterval.Day))

            // Log all errors and above to a separate file.
            .WriteTo.Logger(lc => lc
                .Filter.ByIncludingOnly(evt => evt.Level >= LogEventLevel.Error)
                .WriteTo.File($"logs/{applicationName}-error-.txt", rollingInterval: RollingInterval.Day))

            // Log all warning and above to database via EF core except for Microsoft.EntityFrameworkCore logs
            // as this would create a loop.
            .WriteTo.Logger(lc => lc
                .Filter.ByIncludingOnly(evt => evt.Level >= LogEventLevel.Warning)
                .Filter.ByExcluding(Matching.FromSource("Microsoft.EntityFrameworkCore"))
                .WriteTo.Sink(new DatabaseSink(CultureInfo.InvariantCulture, () => services.BuildServiceProvider().GetRequiredService<IDbContextFactory<AliasServerDbContext>>(), applicationName)))
            .CreateLogger());

        return services;
    }

    /// <summary>
    /// Helper method to create the source context filter.
    /// </summary>
    /// <param name="configuration">IConfiguration instance.</param>
    /// <returns>Source context filter for serilog builder.</returns>
    private static Func<LogEvent, bool> GetSourceContextFilter(IConfiguration configuration)
    {
        return evt =>
        {
            var sourceContext = evt.Properties.ContainsKey("SourceContext")
                ? evt.Properties["SourceContext"].ToString()
                : string.Empty;
            var configuredLevel = GetLogEventLevel(sourceContext, configuration);
            return evt.Level >= configuredLevel;
        };
    }

    /// <summary>
    /// Gets the log event level for the source context based on IConfiguration (appsettings.json).
    /// </summary>
    /// <param name="sourceContext">The source context to look for in the configuration.</param>
    /// <param name="configuration">IConfiguration instance.</param>
    /// <returns>LogEventLevel enum.</returns>
    private static LogEventLevel GetLogEventLevel(string sourceContext, IConfiguration configuration)
    {
        var logLevels = configuration.GetSection("Logging:LogLevel");

        // Check if this specific source context has an override level defined in appsettings.json.
        foreach (var logLevel in logLevels.GetChildren())
        {
            if (sourceContext.Contains(logLevel.Key, StringComparison.OrdinalIgnoreCase))
            {
                return Enum.Parse<LogEventLevel>(logLevel.Value ?? "Information", true);
            }
        }

        // If no specific override, use the default.
        var defaultLevel = logLevels["Default"] ?? "Information";
        return Enum.Parse<LogEventLevel>(defaultLevel, true);
    }
}
