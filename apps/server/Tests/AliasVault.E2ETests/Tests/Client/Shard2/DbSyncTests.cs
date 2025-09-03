//-----------------------------------------------------------------------
// <copyright file="DbSyncTests.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Tests.Client.Shard2;

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
            await CreateCredentialEntry(new Dictionary<string, string> { { "service-name", "TestBaseline1" } });
            await CreateCredentialEntry(new Dictionary<string, string> { { "service-name", "TestBaseline2" } });
        });

        var client1Vault = await SimulateClient(baselineVault, async () =>
        {
            await NavigateUsingBlazorRouter("credentials");
            await WaitForUrlAsync("credentials", "Find all of your credentials");

            await CreateCredentialEntry(new Dictionary<string, string> { { "service-name", "TestA" } });

            // Delete a credential to test the delete support during merge.
            await DeleteCredentialEntry("TestBaseline1");
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
        var expectedServiceNames = new[] { "TestBaseline2", "TestA", "TestB" };
        foreach (var serviceName in expectedServiceNames)
        {
            Assert.That(pageContent, Does.Contain(serviceName), $"{serviceName} not found in vault after merge.");
        }

        // Assert that the deleted credential is not found.
        Assert.That(pageContent, Does.Not.Contain("TestBaseline1"), "Deleted credential found in vault after merge.");
    }

    /// <summary>
    /// Test that client side merge works correctly when two or more clients have updated the same vault.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    [Order(2)]
    public async Task DbSyncClientMergeCredentialPropertiesTest()
    {
        var baselineVault = await CreateBaselineVault(async () =>
        {
            await CreateCredentialEntry(new Dictionary<string, string> { { "service-name", "TestBaseline1" }, { "username", "user1" }, { "email", "email1" }, { "first-name", "firstname1" } });
            await CreateCredentialEntry(new Dictionary<string, string> { { "service-name", "TestBaseline2" }, { "username", "user2" }, { "email", "email2" }, { "first-name", "firstname2" } });
            await CreateCredentialEntry(new Dictionary<string, string> { { "service-name", "TestBaseline3" }, { "username", "user3" }, { "email", "email3" }, { "first-name", "firstname3" } });
        });

        // Client 1 updates the vault first.
        var client1Vault = await SimulateClient(baselineVault, async () =>
        {
            await UpdateCredentialEntry("TestBaseline2", new Dictionary<string, string> { { "service-name", "TestBaseMutate2" }, { "username", "usermutate2" }, { "email", "emailmutate2" }, { "first-name", "firstnamemutate2" } });
        });

        // Then client 2 updates the same vault causing a conflict and requiring a client-side merge.
        var client2Vault = await SimulateClient(baselineVault, async () =>
        {
            // Re-add client1 vault to simulate conflict when this second client updates the same vault.
            client1Vault.Id = Guid.NewGuid();
            ApiDbContext.Vaults.Add(client1Vault);
            await ApiDbContext.SaveChangesAsync();

            await UpdateCredentialEntry("TestBaseline3", new Dictionary<string, string> { { "service-name", "TestBaseMutate3" }, { "username", "usermutate3" }, { "email", "emailmutate3" } });
        });

        // Then another client updates the client 1 vault again, which should also cause a conflict with the client 2 vault update.
        await SimulateClient(client1Vault, async () =>
        {
            // Re-add client2 vault to simulate conflict when this third client updates the same vault.
            client2Vault.Id = Guid.NewGuid();
            ApiDbContext.Vaults.Add(client2Vault);
            await ApiDbContext.SaveChangesAsync();

            await UpdateCredentialEntry("TestBaseMutate2", new Dictionary<string, string> { { "service-name", "TestBaseMutate23" }, { "first-name", "firstnamemutate23" } });
        });

        // Assert that the two conflicting vaults have been merged and all mutated service names are found.
        Dictionary<string, List<string>> expectedStrings = new()
        {
            { "TestBaseMutate23", new List<string> { "usermutate2", "emailmutate2@example.tld", "firstnamemutate23" } },
            { "TestBaseMutate3", new List<string> { "usermutate3", "emailmutate3@example.tld" } },
        };

        foreach (var serviceName in expectedStrings)
        {
            // Navigate to the credential details page.
            await NavigateUsingBlazorRouter("credentials");
            await WaitForUrlAsync("credentials", "Find all of your credentials");

            await Page.ClickAsync($"text={serviceName.Key}");
            await WaitForUrlAsync($"credentials/**", "View credential");
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
    /// Test that merge between two vaults where one has changed the password results in an error.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    [Order(3)]
    public async Task DbSyncClientMergePasswordChangeErrorTest()
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

            // Attempt to change password.
            await NavigateUsingBlazorRouter("settings/security/change-password");
            await WaitForUrlAsync("settings/security/change-password", "Current Password");

            // Fill in the form.
            var currentPasswordField = Page.Locator("input[id='currentPassword']");
            var newPasswordField = Page.Locator("input[id='newPassword']");
            var confirmPasswordField = Page.Locator("input[id='newPasswordConfirm']");

            var newPassword = TestUserPassword + "123";

            await currentPasswordField.FillAsync(TestUserPassword);
            await newPasswordField.FillAsync(newPassword);
            await confirmPasswordField.FillAsync(newPassword);

            // Advance time by 1 second manually to ensure the new vault (encrypted with new password) is created in the future.
            ApiTimeProvider.AdvanceBy(TimeSpan.FromSeconds(1));

            // Click the change password button.
            var changePasswordButton = Page.Locator("button:has-text('Change Password')");
            await changePasswordButton.ClickAsync();

            // Wait for success message.
            await WaitForUrlAsync("settings/security/change-password**", "Password changed successfully.");
        });

        await SimulateClient(baselineVault, async () =>
        {
            // Re-add client1 vault to simulate conflict when this second client updates the same vault.
            client1Vault.Id = Guid.NewGuid();
            ApiDbContext.Vaults.Add(client1Vault);
            await ApiDbContext.SaveChangesAsync();

            await NavigateUsingBlazorRouter("credentials");
            await WaitForUrlAsync("credentials", "Find all of your credentials");

            await CreateCredentialEntry(new Dictionary<string, string> { { "service-name", "TestB" } }, null, false);

            // Wait for 1 second to ensure the page is loaded.
            await Task.Delay(1000);
        });

        // Assert that merge failed error message is shown.
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain("Unable to save changes"), $"Merge failed error expected after another client changed the password but no error message found.");
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
        await Logout();
        await Login();
        await WaitForUrlAsync("credentials", "Find all of your credentials");

        // Execute custom client actions.
        await clientActions();
        return await ApiDbContext.Vaults.OrderByDescending(x => x.RevisionNumber).FirstAsync();
    }
}
