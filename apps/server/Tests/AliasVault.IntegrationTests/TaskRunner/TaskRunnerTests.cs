//-----------------------------------------------------------------------
// <copyright file="TaskRunnerTests.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
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
    [SetUp]
    public void Setup()
    {
        _testHostBuilder = new TestHostBuilder();
        _testHost = _testHostBuilder.Build();
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
        await _testHostBuilder.DisposeAsync();
    }

    /// <summary>
    /// Tests the EmailCleanup task.
    /// </summary>
    /// <returns>Task.</returns>
    [Test]
    public async Task EmailCleanup()
    {
        // Arrange
        await InitializeWithTestData();

        // Assert
        await using var dbContext = await _testHostBuilder.GetDbContextAsync();
        var emails = await dbContext.Emails.ToListAsync();
        Assert.That(emails, Has.Count.EqualTo(50));
    }

    /// <summary>
    /// Tests the LogCleanup task.
    /// </summary>
    /// <returns>Task.</returns>
    [Test]
    public async Task LogCleanup()
    {
        // Arrange
        await InitializeWithTestData();

        // Assert
        await using var dbContext = await _testHostBuilder.GetDbContextAsync();
        var generalLogs = await dbContext.Logs.Where(x => x.Application == "TestApp").ToListAsync();
        Assert.That(generalLogs, Has.Count.EqualTo(50), "Only recent general logs should remain");
    }

    /// <summary>
    /// Tests the LogCleanup task.
    /// </summary>
    /// <returns>Task.</returns>
    [Test]
    public async Task AuthLogCleanup()
    {
        // Arrange
        await InitializeWithTestData();

        // Assert
        await using var dbContext = await _testHostBuilder.GetDbContextAsync();

        // Check auth logs
        var authLogs = await dbContext.AuthLogs.ToListAsync();
        Assert.That(authLogs, Has.Count.EqualTo(50), "Only recent auth logs should remain");
    }

    /// <summary>
    /// Tests the DisabledEmailCleanup task with 30 days retention.
    /// </summary>
    /// <returns>Task.</returns>
    [Test]
    public async Task DisabledEmailCleanup_30DaysRetention()
    {
        // Arrange
        await using var dbContext = await _testHostBuilder.GetDbContextAsync();
        await SetupDisabledEmailCleanupTest();

        // Set disabled email retention to 30 days in database
        var setting = new ServerSetting
        {
            Key = "DisabledEmailRetentionDays",
            Value = "30",
        };
        dbContext.ServerSettings.Add(setting);
        await dbContext.SaveChangesAsync();

        // Act - Run the cleanup
        await _testHost.StartAsync();
        await WaitForMaintenanceJobCompletion();

        // Assert
        var remainingEmails = await dbContext.Emails.CountAsync();
        const int expectedEmails = 190; // 3*50 for enabled aliases + 2*20 for disabled aliases (10 10-day and 10 20-day old emails)
        Assert.That(remainingEmails, Is.EqualTo(expectedEmails), $"Expected {expectedEmails} emails to remain with 30-day retention, but found {remainingEmails}");
    }

    /// <summary>
    /// Tests the DisabledEmailCleanup task with 15 days retention.
    /// </summary>
    /// <returns>Task.</returns>
    [Test]
    public async Task DisabledEmailCleanup_15DaysRetention()
    {
        // Arrange
        await using var dbContext = await _testHostBuilder.GetDbContextAsync();
        await SetupDisabledEmailCleanupTest();

        // Set disabled email retention to 10 days in database
        var setting = new ServerSetting
        {
            Key = "DisabledEmailRetentionDays",
            Value = "15",
        };
        dbContext.ServerSettings.Add(setting);
        await dbContext.SaveChangesAsync();

        // Act - Run the cleanup
        await _testHost.StartAsync();
        await WaitForMaintenanceJobCompletion();

        // Assert
        var remainingEmails = await dbContext.Emails.CountAsync();
        const int expectedEmails = 170; // 3*50 for enabled aliases + 2*10 for disabled aliases (10 10-day old emails)
        Assert.That(remainingEmails, Is.EqualTo(expectedEmails), $"Expected {expectedEmails} emails to remain with 10-day retention, but found {remainingEmails}");
    }

    /// <summary>
    /// Tests that the TaskRunner does not run tasks before the maintenance time.
    /// </summary>
    /// <returns>Task.</returns>
    [Test]
    public async Task MaintenanceTimeInFutureDoesNotRun()
    {
        // Seed database with generic test data.
        await using var dbContext = await _testHostBuilder.GetDbContextAsync();
        await SeedData.SeedDatabase(dbContext);

        // Update maintenance time in database to future to ensure the task runner doesn't execute yet.

        // Get current time and set maintenance time to 2 hours in the future
        var now = DateTime.Now;
        var futureTime = now.AddHours(2);

        // Make sure we don't exceed midnight
        if (futureTime.Day != now.Day)
        {
            futureTime = new DateTime(now.Year, now.Month, now.Day, 23, 59, 5, DateTimeKind.Local);
        }

        // Update maintenance time in database
        var maintenanceTimeSetting = await dbContext.ServerSettings
            .FirstAsync(s => s.Key == "MaintenanceTime");
        maintenanceTimeSetting.Value = futureTime.ToString("HH:mm");
        await dbContext.SaveChangesAsync();

        // Get initial email count
        var initialEmailCount = await dbContext.Emails.CountAsync();

        // Start the service.
        await _testHost.StartAsync();

        // Verify email count hasn't changed (tasks haven't run)
        var currentEmailCount = await dbContext.Emails.CountAsync();
        Assert.That(currentEmailCount, Is.EqualTo(initialEmailCount), "Email count changed despite maintenance time being in the future. Check if TaskRunner is respecting the maintenance time setting.");
    }

    /// <summary>
    /// Tests that the TaskRunner does not run tasks when the current day is excluded.
    /// </summary>
    /// <returns>Task.</returns>
    [Test]
    public async Task MaintenanceTimeExcludedDayDoesNotRun()
    {
        // Seed database with generic test data.
        await using var dbContext = await _testHostBuilder.GetDbContextAsync();
        await SeedData.SeedDatabase(dbContext);

        // Get current day of week (1-7, Monday = 1, Sunday = 7)
        var currentDay = (int)DateTime.Now.DayOfWeek + 1;

        // Update maintenance settings in database to exclude current day
        // Set maintenance time to midnight
        var maintenanceTimeSetting = await dbContext.ServerSettings
            .FirstAsync(s => s.Key == "MaintenanceTime");
        maintenanceTimeSetting.Value = "00:00";

        // Set task runner days to all days except current day
        var taskRunnerDays = Enumerable.Range(1, 7)
            .Where(d => d != currentDay)
            .ToList();
        var taskRunnerDaysSetting = await dbContext.ServerSettings
            .FirstAsync(s => s.Key == "TaskRunnerDays");
        taskRunnerDaysSetting.Value = string.Join(",", taskRunnerDays);

        await dbContext.SaveChangesAsync();

        // Get initial email count
        var initialEmailCount = await dbContext.Emails.CountAsync();

        // Start the service
        await _testHost.StartAsync();

        // Verify email count hasn't changed (tasks haven't run)
        var currentEmailCount = await dbContext.Emails.CountAsync();
        Assert.That(currentEmailCount, Is.EqualTo(initialEmailCount), "Email count changed despite current day being excluded from maintenance days. Check if TaskRunner is respecting the task runner days setting.");
    }

    /// <summary>
    /// Initializes the test with test data.
    /// </summary>
    /// <returns>Task.</returns>
    protected async Task InitializeWithTestData()
    {
        await using var dbContext = await _testHostBuilder.GetDbContextAsync();
        await SeedData.SeedDatabase(dbContext);
        await _testHost.StartAsync();

        // Wait for the maintenance job to complete instead of using a fixed delay
        await WaitForMaintenanceJobCompletion();
    }

    /// <summary>
    /// Waits for the maintenance job to complete.
    /// </summary>
    /// <param name="timeoutSeconds">The timeout in seconds.</param>
    /// <returns>Task.</returns>
    protected async Task WaitForMaintenanceJobCompletion(int timeoutSeconds = 10)
    {
        var startTime = DateTime.Now;
        var timeout = startTime.AddSeconds(timeoutSeconds);

        while (DateTime.Now < timeout)
        {
            await using var dbContext = await _testHostBuilder.GetDbContextAsync();
            var job = await dbContext.TaskRunnerJobs
                .OrderByDescending(j => j.Id)
                .FirstOrDefaultAsync();

            if (job != null && (job.Status == TaskRunnerJobStatus.Finished || job.Status == TaskRunnerJobStatus.Error))
            {
                if (job.Status == TaskRunnerJobStatus.Error)
                {
                    Assert.Fail($"Maintenance job failed with error: {job.ErrorMessage}");
                }

                return;
            }

            await Task.Delay(500); // Poll every 500ms
        }

        Assert.Fail($"Maintenance job did not complete within {timeoutSeconds} seconds");
    }

    /// <summary>
    /// Creates a base email with static required fields.
    /// </summary>
    /// <param name="to">The recipient email address.</param>
    /// <param name="userEncryptionKey">The to be associated user encryption key.</param>
    /// <param name="subject">The email subject.</param>
    /// <param name="date">The email date.</param>
    /// <returns>A new Email object with static fields pre-filled.</returns>
    private static Email CreateTestEmail(string to, UserEncryptionKey userEncryptionKey, string subject, DateTime date)
    {
        return new Email
        {
            UserEncryptionKeyId = userEncryptionKey.Id,
            From = "n/a",
            FromLocal = "n/a",
            FromDomain = "n/a",
            To = to,
            ToLocal = "n/a",
            ToDomain = "n/a",
            MessageSource = "n/a",
            MessagePlain = "n/a",
            MessageHtml = "n/a",
            MessagePreview = "n/a",
            Subject = subject,
            EncryptedSymmetricKey = "n/a",
            Date = date,
            DateSystem = date,
        };
    }

    /// <summary>
    /// Sets up test data for disabled email cleanup tests.
    /// </summary>
    /// <returns>Task containing the test user and encryption key.</returns>
    private async Task SetupDisabledEmailCleanupTest()
    {
        await using var dbContext = await _testHostBuilder.GetDbContextAsync();

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

        // Create 5 aliases
        var aliases = new List<UserEmailClaim>();
        for (var i = 0; i < 5; i++)
        {
            var alias = new UserEmailClaim
            {
                UserId = user.Id,
                Address = $"alias{i}@example.tld",
                AddressLocal = $"alias{i}",
                AddressDomain = "example.tld",
                Disabled = i < 2, // First two aliases are disabled
                CreatedAt = DateTime.UtcNow.AddDays(-60),
                UpdatedAt = DateTime.UtcNow.AddDays(-60),
            };
            aliases.Add(alias);
            dbContext.UserEmailClaims.Add(alias);
        }

        await dbContext.SaveChangesAsync();

        // Add emails to each alias
        foreach (var alias in aliases)
        {
            // Add 50 random emails for enabled aliases
            if (!alias.Disabled)
            {
                for (int i = 0; i < 50; i++)
                {
                    var randomDate = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 60));
                    dbContext.Emails.Add(CreateTestEmail(alias.Address, encryptionKey, $"Test Email {i}", randomDate));
                }
            }
            else
            {
                // For disabled aliases, add emails in specific age groups
                // 10 emails from 50 days ago
                var date50DaysAgo = DateTime.UtcNow.AddDays(-50);
                for (int i = 0; i < 10; i++)
                {
                    dbContext.Emails.Add(CreateTestEmail(alias.Address, encryptionKey, $"Old Email {i}", date50DaysAgo));
                }

                // 10 emails from 40 days ago
                var date40DaysAgo = DateTime.UtcNow.AddDays(-40);
                for (int i = 0; i < 10; i++)
                {
                    dbContext.Emails.Add(CreateTestEmail(alias.Address, encryptionKey, $"Old Email {i}", date40DaysAgo));
                }

                // 10 emails from 30 days ago
                var date30DaysAgo = DateTime.UtcNow.AddDays(-30);
                for (int i = 0; i < 10; i++)
                {
                    dbContext.Emails.Add(CreateTestEmail(alias.Address, encryptionKey, $"Old Email {i}", date30DaysAgo));
                }

                // 10 emails from 20 days ago
                var date20DaysAgo = DateTime.UtcNow.AddDays(-20);
                for (int i = 0; i < 10; i++)
                {
                    dbContext.Emails.Add(CreateTestEmail(alias.Address, encryptionKey, $"Recent Email {i}", date20DaysAgo));
                }

                // 10 emails from 10 days ago
                var date10DaysAgo = DateTime.UtcNow.AddDays(-10);
                for (int i = 0; i < 10; i++)
                {
                    dbContext.Emails.Add(CreateTestEmail(alias.Address, encryptionKey, $"Recent Email {i}", date10DaysAgo));
                }
            }
        }

        await dbContext.SaveChangesAsync();
    }
}
