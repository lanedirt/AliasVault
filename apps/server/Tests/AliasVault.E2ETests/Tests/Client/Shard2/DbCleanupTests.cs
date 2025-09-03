//-----------------------------------------------------------------------
// <copyright file="DbCleanupTests.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Tests.Client.Shard2;

/// <summary>
/// End-to-end tests for the client database persistence.
/// </summary>
[TestFixture]
[Category("ClientTests")]
[NonParallelizable]
public class DbCleanupTests : ClientPlaywrightTest
{
    /// <summary>
    /// Test if the soft deleted records are cleaned up after 7 days.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    [Order(1)]
    public async Task DbCleanupSoftDeletedRecordsTest()
    {
        // Create two credentials. One random and one with a known name.
        await CreateCredentialEntry();
        await CreateCredentialEntry(new Dictionary<string, string> { { "service-name", "CredentialB" } });

        // Delete the credential with the known name.
        await DeleteCredentialEntry("CredentialB");

        // Verify that the soft delete count is now 1.
        await NavigateUsingBlazorRouter("test/cleanup-stats");

        // Extract value from input hidden with id soft-deleted-credential-count
        var softDeletedCredentialCount = await Page.EvaluateAsync<int>("document.getElementById('soft-deleted-credential-count').value");
        Assert.That(softDeletedCredentialCount, Is.EqualTo(1), "Soft deleted credential count is not as expected.");

        // Unlock the vault to trigger the cleanup.
        await RefreshPageAndUnlockVault();

        // Verify that the soft delete count is now 0 as cleanup should have run.
        await NavigateUsingBlazorRouter("test/cleanup-stats");
        softDeletedCredentialCount = await Page.EvaluateAsync<int>("document.getElementById('soft-deleted-credential-count').value");
        Assert.That(softDeletedCredentialCount, Is.EqualTo(1), "Soft deleted credential count is not as expected. Cleanup should only run after 7 days.");
    }
}
