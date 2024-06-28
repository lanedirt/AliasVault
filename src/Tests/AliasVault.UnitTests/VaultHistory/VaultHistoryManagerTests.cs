//-----------------------------------------------------------------------
// <copyright file="VaultHistoryManagerTests.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Tests.VaultHistory;

using AliasServerDb;
using AliasVault.Api.Controllers.Vault.RetentionRules;

/// <summary>
/// Tests for the VaultHistoryManager class which is responsible for applying
/// retention rules to keep backups of vaults when client uploads a new encrypted vault
/// to the server.
/// </summary>
public class VaultHistoryManagerTests
{
    private List<Vault> testVaults;
    private DateTime now;

    /// <summary>
    /// Common setup for all tests.
    /// </summary>
    [SetUp]
    public void Setup()
    {
        now = new DateTime(2023, 6, 1, 12, 0, 0); // Set a fixed "now" date for testing: June 1, 2023, 12:00 PM
        testVaults = new List<Vault>
        {
            new Vault { UpdatedAt = new DateTime(2023, 5, 31, 12, 0, 0) }, // yesterday 12:00
            new Vault { UpdatedAt = new DateTime(2023, 5, 31, 4, 0, 0) }, // yesterday 04:00
            new Vault { UpdatedAt = new DateTime(2023, 5, 30, 12, 0, 0) }, // 2 days ago
            new Vault { UpdatedAt = new DateTime(2023, 5, 29, 12, 0, 0) }, // 3 days ago
            new Vault { UpdatedAt = new DateTime(2023, 5, 28, 12, 0, 0) }, // 4 days ago
            new Vault { UpdatedAt = new DateTime(2023, 5, 18, 12, 0, 0) }, // 2 weeks ago
            new Vault { UpdatedAt = new DateTime(2023, 5, 11, 12, 0, 0) }, // 3 weeks ago
            new Vault { UpdatedAt = new DateTime(2023, 5, 1, 12, 0, 0) }, // 1 month ago
            new Vault { UpdatedAt = new DateTime(2023, 4, 1, 12, 0, 0) }, // 2 months ago
        };
    }

    /// <summary>
    /// Test the DailyRetentionRule.
    /// </summary>
    [Test]
    public void DailyRetentionRuleTest()
    {
        // Keep 1 vault per day for max. last 3 days. If there are multiple vaults for a day, keep the latest one.
        var rule = new DailyRetentionRule { DaysToKeep = 3 };
        var result = rule.ApplyRule(testVaults, now).ToList();

        // Expecting three vaults to be kept:
        // - one from yesterday
        // - one from 36 hours ago (this one gets priority vs. the one from two days ago as we only take the last one per day)
        // - one from three days ago
        // The one from 4 days ago should be excluded because that one is outside the 3 day window.
        Assert.That(result.Count, Is.EqualTo(3));
        Assert.That(result[0].UpdatedAt, Is.EqualTo(new DateTime(2023, 5, 31, 12, 0, 0)));
        Assert.That(result[1].UpdatedAt, Is.EqualTo(new DateTime(2023, 5, 30, 12, 0, 0)));
        Assert.That(result[2].UpdatedAt, Is.EqualTo(new DateTime(2023, 5, 29, 12, 0, 0)));
    }

    /// <summary>
    /// Test the WeeklyRetentionRule.
    /// </summary>
    [Test]
    public void WeeklyRetentionRuleTest()
    {
        var rule = new WeeklyRetentionRule { WeeksToKeep = 3 };
        var result = rule.ApplyRule(testVaults, now).ToList();

        Assert.That(result.Count, Is.EqualTo(3));
        Assert.That(result[0].UpdatedAt, Is.EqualTo(new DateTime(2023, 5, 31, 12, 0, 0))); // Most recent from this week
        Assert.That(result[1].UpdatedAt, Is.EqualTo(new DateTime(2023, 5, 28, 12, 0, 0))); // Most recent from last week
        Assert.That(result[2].UpdatedAt, Is.EqualTo(new DateTime(2023, 5, 18, 12, 0, 0))); // Most recent from week before last week
    }

    /// <summary>
    /// Test the MonthlyRetentionRule.
    /// </summary>
    [Test]
    public void MonthlyRetentionRuleTest()
    {
        var rule = new MonthlyRetentionRule { MonthsToKeep = 2 };
        var result = rule.ApplyRule(testVaults, now).ToList();

        Assert.That(result.Count, Is.EqualTo(2));
        Assert.That(result[0].UpdatedAt, Is.EqualTo(new DateTime(2023, 5, 31, 12, 0, 0))); // Most recent from last month
        Assert.That(result[1].UpdatedAt, Is.EqualTo(new DateTime(2023, 4, 1, 12, 0, 0))); // Most recent from second last month
    }
}
