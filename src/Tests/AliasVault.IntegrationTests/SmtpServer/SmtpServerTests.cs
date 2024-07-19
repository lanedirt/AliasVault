//-----------------------------------------------------------------------
// <copyright file="SmtpServerTests.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.IntegrationTests.SmtpServer;

using AliasServerDb;

using MailKit.Security;
using MailKit.Net.Smtp;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using MimeKit;

[TestFixture]
public class SmtpServerTests
{
    private IHost _testHost;

    [SetUp]
    public async Task Setup()
    {
        _testHost = new TestHostBuilder().Build(services =>
        {
            // Here you can override services or add mocks as needed
        });

        await _testHost.StartAsync();
    }

    [TearDown]
    public async Task TearDown()
    {
        if (_testHost != null)
        {
            await _testHost.StopAsync();
            _testHost.Dispose();
        }
    }

    [Test]
    public async Task TestWorkerProcessesEmails()
    {
        // Arrange
        // Simulate sending an email to your SMTP server
        // You might need to implement a method to do this in your test SMTP server
        // Arrange
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Test Sender", "sender@example.com"));
        message.To.Add(new MailboxAddress("Test Recipient", "recipient.to@example.tld"));
        message.Cc.Add(new MailboxAddress("Test Recipient 2", "recipient.cc@example.tld"));
        message.Subject = "Test Email with multiple recipients.";
        message.Body = new TextPart("plain")
        {
            Text = "This is a test email."
        };

        using var client = new SmtpClient();

        // Send message to SMTP server
        await client.ConnectAsync("localhost", 25, SecureSocketOptions.None);
        try
        {
            await client.SendAsync(message);
        }
        catch (Exception ex)
        {
            throw;
            // Show failure message indicating that message was not sent: SMTP server issue?
            Assert.Fail($"Failed to send email, check SMTP server receive logs: {ex}");
        }
        finally
        {
            await client.DisconnectAsync(true);
        }

        // Act
        // Wait for the worker to process the email
        await Task.Delay(1000); // Adjust as needed

        // Assert
        using (var scope = _testHost.Services.CreateScope())
        {
            var dbContextFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<AliasServerDbContext>>();
            var dbContext = await dbContextFactory.CreateDbContextAsync();

            // Check the database for the expected results
            var processedEmail = await dbContext.Emails.FirstOrDefaultAsync(e => e.Subject == "Test Email");
            Assert.That(processedEmail, Is.Not.Null);
            Assert.That(processedEmail.To, Is.EqualTo("test@test.com"));
            // Add more assertions as needed
        }

    }
}
