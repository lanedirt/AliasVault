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
    /// <param name="logFolder">The folder to log to.</param>
    /// <returns>IServiceCollection instance.</returns>
    public static IServiceCollection ConfigureLogging(this IServiceCollection services, IConfiguration configuration, string applicationName, string logFolder = "logs/")
    {
        services.AddSerilog(new LoggerConfiguration()
            .ReadFrom.Configuration(configuration)
            .Enrich.FromLogContext()
            .Enrich.WithProperty("Application", applicationName)
            .Filter.ByIncludingOnly(GetSourceContextFilter(configuration))

            // Log to console.
            .WriteTo.Logger(lc => lc
                .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext} {Message:lj} {Properties:j}{NewLine}{Exception}"))

            // Log everything to a file.
            .WriteTo.Logger(lc => lc
                .WriteTo.File(
                    path: $"{logFolder}/{applicationName}-log-.txt",
                    rollingInterval: RollingInterval.Day,
                    outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext} {Message:lj} {Properties:j}{NewLine}{Exception}"))

            // Log all errors and above to a separate file.
            .WriteTo.Logger(lc => lc
                .Filter.ByIncludingOnly(evt => evt.Level >= LogEventLevel.Error)
                .WriteTo.File(
                    path: $"{logFolder}/{applicationName}-error-.txt",
                    rollingInterval: RollingInterval.Day,
                    outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext} {Message:lj} {Properties:j}{NewLine}{Exception}"))

            // Log all warning and above to database via EF core except for:
            // - Microsoft.EntityFrameworkCore logsas this would create a loop.
            // - Microsoft.AspNetCore.Antiforgery logs
            // - Microsoft.AspNetCore.DataProtection logs
            .WriteTo.Logger(lc => lc
                .Filter.ByIncludingOnly(evt => evt.Level >= LogEventLevel.Warning)
                .Filter.ByExcluding(Matching.FromSource("Microsoft.EntityFrameworkCore"))
                .Filter.ByExcluding(Matching.FromSource("Microsoft.AspNetCore.Antiforgery"))
                .Filter.ByExcluding(Matching.FromSource("Microsoft.AspNetCore.DataProtection"))
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

        // If this specific source context has an override level defined in appsettings.json, return that.
        var logLevel = logLevels.GetChildren()
            .FirstOrDefault(ll => sourceContext.Contains(ll.Key, StringComparison.OrdinalIgnoreCase));
        if (logLevel != null)
        {
            return Enum.Parse<LogEventLevel>(logLevel.Value ?? "Information", true);
        }

        // If there is no specific override, use the default.
        var defaultLevel = logLevels["Default"] ?? "Information";
        return Enum.Parse<LogEventLevel>(defaultLevel, true);
    }
}
