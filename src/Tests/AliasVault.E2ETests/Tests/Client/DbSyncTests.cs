//-----------------------------------------------------------------------
// <copyright file="DbSyncTests.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Tests.Client;

using Microsoft.EntityFrameworkCore;

/// <summary>
/// End-to-end tests for the client database synchronization when two or more databases
/// are saved with the same revision number indicating a conflict that requires a merge.
/// </summary>
[TestFixture]
[Category("ClientTests")]
[NonParallelizable]
public class DbSyncTests : ClientPlaywrightTest
{
    /// <summary>
    /// Test if saving a new vault with the same revision number as an existing vault it results
    /// in two vaults with the same revision number in the server database.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    [Order(1)]
    public async Task DbSyncDuplicateVersionNumberTest()
    {
        // Advance time by 1 second manually to ensure the new vault is created in the future.
        ApiTimeProvider.AdvanceBy(TimeSpan.FromSeconds(1));

        // Create a new credential which will trigger a vault save to the server.
        await CreateCredentialEntry();

        // Assert that the vault is stored in the database with revision number 1.
        var secondUpdateVault = await ApiDbContext.Vaults.OrderByDescending(x => x.UpdatedAt).FirstAsync();
        Assert.That(secondUpdateVault.RevisionNumber, Is.EqualTo(1), "Vault revision number is not 1 after the first credential save.");

        // Set the revision number of the vault to 2 (+1) to simulate a conflict where another client has
        // saved a vault with the same revision number.
        secondUpdateVault.RevisionNumber = 2;
        await ApiDbContext.SaveChangesAsync();

        // Create a new credential. The client will provide revision number 1 as the previous one, which should result
        // in the server giving this new vault revision number 2 as well. Thus resulting in a conflict.
        await CreateCredentialEntry();

        // Assert that there are now two vaults in the database with revision number 2.
        var revisionNumber2VaultCount = await ApiDbContext.Vaults.CountAsync(x => x.RevisionNumber == 2);
        Assert.That(revisionNumber2VaultCount, Is.EqualTo(2), "Two vaults with revision number 2 not found in the database. Check if the server correctly handles conflicts when two clients save a vault with the same revision number.");
    }
}
