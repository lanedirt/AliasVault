//-----------------------------------------------------------------------
// <copyright file="TestExceptionWorker.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.IntegrationTests.StatusHostedService;

using Microsoft.Extensions.Hosting;

/// <summary>
/// A simple worker that throws an exception during task execution. This is used for testing purposes.
/// </summary>
public class TestExceptionWorker() : BackgroundService
{
    /// <inheritdoc/>
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(TimeSpan.FromMilliseconds(100), stoppingToken);
        throw new Exception("Test exception");
    }
}
