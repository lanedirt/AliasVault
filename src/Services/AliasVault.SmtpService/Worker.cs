//-----------------------------------------------------------------------
// <copyright file="Worker.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.SmtpService;

public class Worker(ILogger<Worker> logger, SmtpServer.SmtpServer smtpServer) : BackgroundService
{
    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            logger.LogWarning("AliasVault.SmtpService starting at: {Time}", DateTimeOffset.Now);

            // Start the SMTP server
            await smtpServer.StartAsync(stoppingToken);

            // Wait for the cancellation token to be triggered
            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (OperationCanceledException ex)
        {
            // This exception is thrown when the stoppingToken is canceled
            // It's expected behavior, so we can just log it
            logger.LogWarning(ex, "AliasVault.SmtpService is stopping due to a cancellation request.");
        }
        catch (Exception ex)
        {
            // Log any unexpected exceptions
            logger.LogError(ex, "An error occurred in AliasVault.SmtpService");
        }
        finally
        {
            // Log that the service is stopping, whether it's due to cancellation or an error
            logger.LogWarning("AliasVault.SmtpService stopped at: {Time}", DateTimeOffset.Now);

            // Ensure the SMTP server is stopped
            smtpServer.Shutdown();
        }
    }
}
