//-----------------------------------------------------------------------
// <copyright file="RevisionNumberRetentionTests.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Tests.Vault.RetentionManager;

using AliasServerDb;
using AliasVault.Api.Vault;
using AliasVault.Api.Vault.RetentionRules;

/// <summary>
/// Contains unit tests for the retention behavior related to the RevisionNumber property of Vaults.
/// These tests ensure that the retention policy correctly handles cases where multiple vaults
/// have the same highest revision number, which could indicate optimistic concurrency conflicts.
/// </summary>
[TestFixture]
public class RevisionNumberRetentionTests
{
    private List<Vault> testVaults;
    private DateTime now;

    /// <summary>
    /// Sets up the test environment before each test.
    /// Creates a list of test vaults with various revision numbers and update times.
    /// </summary>
    [SetUp]
    public void Setup()
    {
        now = new DateTime(2023, 6, 1, 12, 0, 0);
        testVaults = new List<Vault>
        {
            new Vault { RevisionNumber = 5, UpdatedAt = new DateTime(2023, 5, 31, 12, 0, 0), VaultBlob = "blob1", Version = "1.0", Salt = "salt1", Verifier = "verifier1", EncryptionType = "type1", EncryptionSettings = "settings1" },
            new Vault { RevisionNumber = 5, UpdatedAt = new DateTime(2023, 5, 31, 11, 0, 0), VaultBlob = "blob2", Version = "1.0", Salt = "salt2", Verifier = "verifier2", EncryptionType = "type1", EncryptionSettings = "settings1" },
            new Vault { RevisionNumber = 5, UpdatedAt = new DateTime(2023, 5, 31, 10, 0, 0), VaultBlob = "blob3", Version = "1.0", Salt = "salt3", Verifier = "verifier3", EncryptionType = "type1", EncryptionSettings = "settings1" },
            new Vault { RevisionNumber = 4, UpdatedAt = new DateTime(2023, 5, 30, 12, 0, 0), VaultBlob = "blob4", Version = "1.0", Salt = "salt4", Verifier = "verifier4", EncryptionType = "type1", EncryptionSettings = "settings1" },
            new Vault { RevisionNumber = 3, UpdatedAt = new DateTime(2023, 5, 29, 12, 0, 0), VaultBlob = "blob5", Version = "1.0", Salt = "salt5", Verifier = "verifier5", EncryptionType = "type1", EncryptionSettings = "settings1" },
        };
    }

    /// <summary>
    /// Tests that the retention policy keeps all vaults with the highest revision number,
    /// even if there are multiple vaults with the same highest revision number.
    /// This is crucial for handling potential optimistic concurrency conflicts.
    /// </summary>
    [Test]
    public void RevisionNumberConflictRuleTest()
    {
        // Arrange
        var retentionPolicy = new RetentionPolicy
        {
            Rules = new List<IRetentionRule>
            {
                new RevisionNumberConflictRetentionRule(),
                new DailyRetentionRule { DaysToKeep = 1 },
                new VersionRetentionRule { VersionsToKeep = 1 },
            },
        };

        // Act
        var vaultsToDelete = VaultRetentionManager.ApplyRetention(retentionPolicy, testVaults, now).ToList();
        var vaultsToKeep = testVaults.Except(vaultsToDelete).ToList();

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(vaultsToKeep, Has.Count.EqualTo(3), "All vaults with the highest revision number should be kept");
            Assert.That(vaultsToKeep.All(v => v.RevisionNumber == 5), Is.True, "All kept vaults should have the highest revision number");
            Assert.That(vaultsToDelete, Has.Count.EqualTo(2), "Vaults with lower revision numbers should be deleted");
            Assert.That(vaultsToDelete.All(v => v.RevisionNumber < 5), Is.True, "All deleted vaults should have lower revision numbers");
        });
    }
}
