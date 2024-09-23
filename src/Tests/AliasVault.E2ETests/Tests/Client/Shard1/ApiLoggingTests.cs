//-----------------------------------------------------------------------
// <copyright file="ApiLoggingTests.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Tests.Client.Shard1;

using Microsoft.EntityFrameworkCore;

/// <summary>
/// End-to-end tests for making sure errors and warnings in API are logged to database.
/// </summary>
[TestFixture]
[Category("ClientTests")]
[NonParallelizable]
public class ApiLoggingTests : ClientPlaywrightTest
{
    /// <summary>
    /// Test if an error in the API is logged to the database.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    public async Task ApiDbLogTest()
    {
        // Call webapi endpoint that throws an exception.
        try
        {
            await Page.GotoAsync(ApiBaseUrl + "api/v1/Test/Error");
            await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);
        }
        catch
        {
            // Ignore exception as this is expected.
        }

        // Read from database to check if the log entry was created.
        var logEntry = await ApiDbContext.Logs.Where(x => x.Application == "AliasVault.Api").OrderByDescending(x => x.Id).FirstOrDefaultAsync();

        Assert.That(logEntry, Is.Not.Null, "Log entry for triggered exception not found in database. Check Serilog configuration and /api/v1/Test/Error endpoint.");
        Assert.That(logEntry.Exception, Does.Contain("Test error"), "Log entry in database does not contain expected message. Check exception and Serilog configuration.");
    }
}
