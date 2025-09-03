//-----------------------------------------------------------------------
// <copyright file="DatabaseSink.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Logging;

using System;
using AliasServerDb;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Serilog.Core;
using Serilog.Events;

/// <summary>
/// Custom Serilog sink for Database via Entity Framework Core.
/// </summary>
/// <param name="formatProvider">IFormatProvider instance.</param>
/// <param name="contextFactory">DB context factory to use.</param>
/// <param name="applicationName">Application name.</param>
public class DatabaseSink(IFormatProvider formatProvider, Func<IDbContextFactory<AliasServerDbContext>> contextFactory, string applicationName) : ILogEventSink
{
    /// <summary>
    /// Saves the log event to the database.
    /// </summary>
    /// <param name="logEvent">LogEvent instance.</param>
    public void Emit(LogEvent logEvent)
    {
        var logEntry = new Log
        {
            TimeStamp = logEvent.Timestamp.UtcDateTime,
            Level = logEvent.Level.ToString(),
            Message = logEvent.RenderMessage(formatProvider),
            Exception = logEvent.Exception?.ToString() ?? string.Empty,
            Properties = JsonConvert.SerializeObject(logEvent.Properties),
            LogEvent = (logEvent.Level >= LogEventLevel.Error) ? JsonConvert.SerializeObject(logEvent) : string.Empty,
            MessageTemplate = logEvent.MessageTemplate.Text,
            Application = applicationName,
            SourceContext = logEvent.Properties.ContainsKey("SourceContext")
                ? logEvent.Properties["SourceContext"].ToString().Trim('"')
                : string.Empty,
        };

        try
        {
            using var context = contextFactory.Invoke().CreateDbContext();
            context.Logs.Add(logEntry);
            context.SaveChanges();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error writing log entry to database: {ex}");
        }
    }
}
