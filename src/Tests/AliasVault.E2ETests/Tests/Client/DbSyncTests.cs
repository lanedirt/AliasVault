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
    /// Test that client side merge works correctly when two or more conflicting vault versions have been detected.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    [Order(1)]
    public async Task DbSyncClientMergeBasicTest()
    {
        var baselineVault = await CreateBaselineVault(async () =>
        {
            await CreateCredentialEntry(new Dictionary<string, string> { { "service-name", "TestBaseline" } });
        });

        var client1Vault = await SimulateClient(baselineVault, async () =>
        {
            await NavigateUsingBlazorRouter("credentials");
            await WaitForUrlAsync("credentials", "Find all of your credentials");

            await CreateCredentialEntry(new Dictionary<string, string> { { "service-name", "TestA" } });
        });

        await SimulateClient(baselineVault, async () =>
        {
            // Re-add client1 vault to simulate conflict when this second client updates the same vault.
            client1Vault.Id = Guid.NewGuid();
            ApiDbContext.Vaults.Add(client1Vault);
            await ApiDbContext.SaveChangesAsync();

            await NavigateUsingBlazorRouter("credentials");
            await WaitForUrlAsync("credentials", "Find all of your credentials");

            await CreateCredentialEntry(new Dictionary<string, string> { { "service-name", "TestB" } });
        });

        // Assert that the two conflicting vaults have been merged and all service names are found.
        await NavigateUsingBlazorRouter("credentials");
        await WaitForUrlAsync("credentials", "Find all of your credentials");

        var pageContent = await Page.TextContentAsync("body");
        var expectedServiceNames = new[] { "TestBaseline", "TestA", "TestB" };
        foreach (var serviceName in expectedServiceNames)
        {
            Assert.That(pageContent, Does.Contain(serviceName), $"{serviceName} not found in vault after merge.");
        }
    }

    /// <summary>
    /// Test that client side merge works correctly when two or more conflicting vault versions have been detected.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    [Order(2)]
    public async Task DbSyncClientMergeCredentialPropertiesTest()
    {
        var baselineVault = await CreateBaselineVault(async () =>
        {
            ApiTimeProvider.AdvanceBy(TimeSpan.FromSeconds(1));
            await CreateCredentialEntry(new Dictionary<string, string> { { "service-name", "TestBaseline1" }, { "username", "user1" }, { "email", "email1" }, { "first-name", "firstname1" } });
            ApiTimeProvider.AdvanceBy(TimeSpan.FromSeconds(1));
            await CreateCredentialEntry(new Dictionary<string, string> { { "service-name", "TestBaseline2" }, { "username", "user2" }, { "email", "email2" }, { "first-name", "firstname2" } });
            ApiTimeProvider.AdvanceBy(TimeSpan.FromSeconds(1));
            await CreateCredentialEntry(new Dictionary<string, string> { { "service-name", "TestBaseline3" }, { "username", "user3" }, { "email", "email3" }, { "first-name", "firstname3" } });
        });

        var client1Vault = await SimulateClient(baselineVault, async () =>
        {
            await UpdateCredentialEntry("TestBaseline2", new Dictionary<string, string> { { "service-name", "TestBaseMutate2" }, { "username", "usermutate2" }, { "email", "emailmutate2" }, { "first-name", "firstnamemutate2" } });
        });

        await SimulateClient(baselineVault, async () =>
        {
            // Re-add client1 vault to simulate conflict when this second client updates the same vault.
            client1Vault.Id = Guid.NewGuid();
            ApiDbContext.Vaults.Add(client1Vault);
            await ApiDbContext.SaveChangesAsync();

            await UpdateCredentialEntry("TestBaseline3", new Dictionary<string, string> { { "service-name", "TestBaseMutate3" }, { "username", "usermutate3" }, { "email", "emailmutate3" } });
        });

        // Assert that the two conflicting vaults have been merged and all mutated service names are found.
        Dictionary<string, List<string>> expectedStrings = new()
        {
            { "TestBaseMutate2", new List<string> { "usermutate2", "emailmutate2@example.tld", "firstnamemutate2" } },
            { "TestBaseMutate3", new List<string> { "usermutate3", "emailmutate3@example.tld" } },
        };

        foreach (var serviceName in expectedStrings)
        {
            // Navigate to the credential details page.
            await NavigateUsingBlazorRouter("credentials");
            await WaitForUrlAsync("credentials", "Find all of your credentials");

            await Page.ClickAsync($"text={serviceName.Key}");
            await WaitForUrlAsync($"credentials/**", "View credentials entry");
            foreach (var property in serviceName.Value)
            {
                // Check if any input on the page has the expected value
                var inputWithValue = await Page.EvaluateAsync<bool>($@"
                Array.from(document.querySelectorAll('input, textarea'))
                    .some(el => el.value === '{property}')");

                Assert.That(inputWithValue, Is.True, $"No input found with value '{property}' in {serviceName.Key} credential page after merge.");
            }
        }
    }

    /// <summary>
    /// Create a baseline vault.
    /// </summary>
    /// <param name="clientActions">Optional client actions to execute after creating the baseline vault.</param>
    /// <returns>The baseline vault.</returns>
    private async Task<AliasServerDb.Vault> CreateBaselineVault(Func<Task> clientActions)
    {
        ApiTimeProvider.AdvanceBy(TimeSpan.FromSeconds(1));
        await clientActions();

        return await ApiDbContext.Vaults.OrderByDescending(x => x.UpdatedAt).FirstAsync();
    }

    /// <summary>
    /// Simulate a client by removing all vaults and adding the baseline vault back.
    /// </summary>
    /// <param name="baselineVault">The baseline vault to add back.</param>
    /// <param name="clientActions">Optional client actions to execute after simulating the client.</param>
    /// <returns>The baseline vault.</returns>
    private async Task<AliasServerDb.Vault> SimulateClient(AliasServerDb.Vault baselineVault, Func<Task> clientActions)
    {
        ApiTimeProvider.AdvanceBy(TimeSpan.FromSeconds(1));

        // Remove all vaults and add the baseline vault back.
        ApiDbContext.Vaults.RemoveRange(ApiDbContext.Vaults);
        await ApiDbContext.SaveChangesAsync();
        baselineVault.Id = Guid.NewGuid();
        ApiDbContext.Vaults.Add(baselineVault);
        await ApiDbContext.SaveChangesAsync();

        // Simulate new client.
        await RefreshPageAndUnlockVault();

        // Execute custom client actions.
        await clientActions();
        return await ApiDbContext.Vaults.OrderByDescending(x => x.UpdatedAt).FirstAsync();
    }
}
