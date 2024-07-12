//-----------------------------------------------------------------------
// <copyright file="DbPersistTest.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Tests;

/// <summary>
/// End-to-end tests for the credential management.
/// </summary>
[TestFixture]
[NonParallelizable]
public class DbPersistTest : PlaywrightTest
{
    /// <summary>
    /// Test if a created credential is still present after a hard page refresh which causes
    /// the database to be loaded fresh from the remote server. This is to ensure that the
    /// database is correctly persisted and then loaded from the server.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    public async Task DbPersistCredentialTest()
    {
        var serviceNameBefore = "Credential service before";
        await CreateCredentialEntry(new Dictionary<string, string>
        {
            { "service-name", serviceNameBefore },
        });

        // Check that the service name is present in the content.
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain(serviceNameBefore), "Created credential service name does not appear on login page.");

        // Refresh page so the database gets dropped then unlock the vault again which will refetch the database from the server.
        await RefreshPageAndUnlockVault();

        // Wait for the credentials page to load again.
        await WaitForURLAsync("**/credentials*");

        // Check if the service name is still present in the content.
        pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain(serviceNameBefore), "Created credential service name does not appear on login page after hard page reload. Check if the database is correctly persisted and then loaded from the server.");
    }
}
