//-----------------------------------------------------------------------
// <copyright file="SmtpServerWorker.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.SmtpService.Workers;

public class SmtpServerWorker(ILogger<SmtpServerWorker> logger, SmtpServer.SmtpServer smtpServer) : BackgroundService
{
    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogWarning("AliasVault.SmtpService started at: {Time}", DateTimeOffset.Now);

        // Start the SMTP server
        await smtpServer.StartAsync(stoppingToken);
    }
}
