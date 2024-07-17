//-----------------------------------------------------------------------
// <copyright file="Worker.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.SmtpService
{
    public class Worker(ILogger<Worker> logger, SmtpServer.SmtpServer smtpServer) : BackgroundService
    {
        /// <inheritdoc />
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            if (logger.IsEnabled(LogLevel.Information))
            {
                logger.LogInformation("AliasVault.SmtpService running at: {Time}", DateTimeOffset.Now);
            }
            await smtpServer.StartAsync(stoppingToken);
        }
    }
}
