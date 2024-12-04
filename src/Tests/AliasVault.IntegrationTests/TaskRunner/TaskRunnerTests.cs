//-----------------------------------------------------------------------
// <copyright file="TaskRunnerTests.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.IntegrationTests.TaskRunner;

using AliasServerDb;
using AliasVault.Shared.Models.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;

/// <summary>
/// Integration tests for TaskRunner service.
/// </summary>
[TestFixture]
public class TaskRunnerTests
{
    /// <summary>
    /// The test host instance.
    /// </summary>
    private IHost _testHost;

    /// <summary>
    /// The test host builder instance.
    /// </summary>
    private TestHostBuilder _testHostBuilder;

    /// <summary>
    /// Setup logic for every test.
    /// </summary>
    /// <returns>Task.</returns>
    [SetUp]
    public async Task Setup()
    {
        _testHostBuilder = new TestHostBuilder();
        _testHost = _testHostBuilder.Build();

        // Seed the database before starting the service.
        await SeedDatabase();

        // Start the service so it can run the tasks on the test data.
        await _testHost.StartAsync();
    }

    /// <summary>
    /// Tear down logic for every test.
    /// </summary>
    /// <returns>Task.</returns>
    [TearDown]
    public async Task TearDown()
    {
        await _testHost.StopAsync();
        _testHost.Dispose();
    }

    /// <summary>
    /// Tests the EmailCleanup task.
    /// </summary>
    /// <returns>Task.</returns>
    [Test]
    public async Task EmailCleanup()
    {
        // Assert
        var dbContext = _testHostBuilder.GetDbContext();
        var emails = await dbContext.Emails.ToListAsync();
        Assert.That(emails.Count, Is.EqualTo(50));
    }

    /// <summary>
    /// Tests the LogCleanup task.
    /// </summary>
    /// <returns>Task.</returns>
    [Test]
    public async Task LogCleanup()
    {
        // Assert
        var dbContext = _testHostBuilder.GetDbContext();

        // Check general logs
        var generalLogs = await dbContext.Logs.ToListAsync();
        Assert.That(generalLogs.Count, Is.EqualTo(50), "Only recent general logs should remain");
    }

    /// <summary>
    /// Tests the LogCleanup task.
    /// </summary>
    /// <returns>Task.</returns>
    [Test]
    public async Task AuthLogCleanup()
    {
        // Assert
        var dbContext = _testHostBuilder.GetDbContext();

        // Check auth logs
        var authLogs = await dbContext.AuthLogs.ToListAsync();
        Assert.That(authLogs.Count, Is.EqualTo(50), "Only recent auth logs should remain");
    }

    /// <summary>
    /// Seeds the database with test data.
    /// </summary>
    private async Task SeedDatabase()
    {
        // Seed the database with settings
        var dbContext = _testHostBuilder.GetDbContext();

        // Configure maintenance settings
        var settings = new List<ServerSetting>
        {
            new() { Key = "EmailRetentionDays", Value = "30" },
            new() { Key = "GeneralLogRetentionDays", Value = "45" },
            new() { Key = "AuthLogRetentionDays", Value = "60" },
            new() { Key = "MaxEmailsPerUser", Value = "100" },
            new() { Key = "MaintenanceTime", Value = "03:30" },
            new() { Key = "TaskRunnerDays", Value = "1,2,3,4,5,6,7" },
        };

        await dbContext.ServerSettings.AddRangeAsync(settings);

        // Create test user
        var user = new AliasVaultUser
        {
            UserName = "testuser",
            Email = "testuser@example.tld",
        };
        dbContext.AliasVaultUsers.Add(user);
        await dbContext.SaveChangesAsync();

        // Create encryption key for the user
        var encryptionKey = new UserEncryptionKey
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            PublicKey = "test-encryption-key",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        dbContext.UserEncryptionKeys.Add(encryptionKey);
        await dbContext.SaveChangesAsync();

        // Seed old emails (older than 30 days)
        var oldEmails = new List<Email>();
        for (int i = 0; i < 50; i++)
        {
            oldEmails.Add(new Email
            {
                Subject = $"Old Email {i}",
                From = "sender@example.com",
                FromLocal = "sender",
                FromDomain = "example.com",
                To = "testuser@example.tld",
                ToLocal = "testuser",
                ToDomain = "example.tld",
                Date = DateTime.UtcNow.AddDays(-45),
                DateSystem = DateTime.UtcNow.AddDays(-45),
                MessagePlain = "Test message",
                MessagePreview = "Test message",
                MessageSource = "Test source",
                EncryptedSymmetricKey = "dummy-key",
                UserEncryptionKeyId = encryptionKey.Id,
            });
        }

        await dbContext.Emails.AddRangeAsync(oldEmails);

        // Seed recent emails (within 30 days)
        var recentEmails = new List<Email>();
        for (int i = 0; i < 50; i++)
        {
            recentEmails.Add(new Email
            {
                Subject = $"Recent Email {i}",
                From = "sender@example.com",
                FromLocal = "sender",
                FromDomain = "example.com",
                To = "testuser@example.tld",
                ToLocal = "testuser",
                ToDomain = "example.tld",
                Date = DateTime.UtcNow.AddDays(-1),
                DateSystem = DateTime.UtcNow.AddDays(-1),
                MessagePlain = "Test message",
                MessagePreview = "Test message",
                MessageSource = "Test source",
                EncryptedSymmetricKey = "dummy-key",
                UserEncryptionKeyId = encryptionKey.Id,
            });
        }

        await dbContext.Emails.AddRangeAsync(recentEmails);

        // Add old general logs (older than 45 days)
        var oldLogs = new List<Log>();
        for (int i = 0; i < 50; i++)
        {
            oldLogs.Add(new Log
            {
                Application = "TestApp",
                SourceContext = "TestContext",
                Message = $"Old Log {i}",
                MessageTemplate = $"Old Log {i}",
                Level = "Information",
                TimeStamp = DateTime.UtcNow.AddDays(-60),
                Exception = string.Empty,
                Properties = "{}",
                LogEvent = "{}",
            });
        }

        await dbContext.Logs.AddRangeAsync(oldLogs);

        // Add recent logs (within 45 days)
        var recentLogs = new List<Log>();
        for (int i = 0; i < 50; i++)
        {
            recentLogs.Add(new Log
            {
                Application = "TestApp",
                SourceContext = "TestContext",
                Message = $"Recent Log {i}",
                MessageTemplate = $"Recent Log {i}",
                Level = "Information",
                TimeStamp = DateTime.UtcNow.AddDays(-1),
                Exception = string.Empty,
                Properties = "{}",
                LogEvent = "{}",
            });
        }

        await dbContext.Logs.AddRangeAsync(recentLogs);

        // Add old auth logs (older than 60 days)
        var oldAuthLogs = new List<AuthLog>();
        for (int i = 0; i < 50; i++)
        {
            oldAuthLogs.Add(new AuthLog
            {
                Username = "testuser",
                EventType = AuthEventType.Login,
                IsSuccess = true,
                Timestamp = DateTime.UtcNow.AddDays(-70),
            });
        }

        await dbContext.AuthLogs.AddRangeAsync(oldAuthLogs);

        var recentAuthLogs = new List<AuthLog>();
        for (int i = 0; i < 50; i++)
        {
            recentAuthLogs.Add(new AuthLog
            {
                Username = "testuser",
                EventType = AuthEventType.Login,
                IsSuccess = true,
                Timestamp = DateTime.UtcNow.AddDays(-1),
            });
        }

        await dbContext.AuthLogs.AddRangeAsync(recentAuthLogs);

        await dbContext.SaveChangesAsync();
    }
}
