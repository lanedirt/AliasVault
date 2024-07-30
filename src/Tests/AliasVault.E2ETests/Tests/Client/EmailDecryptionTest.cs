//-----------------------------------------------------------------------
// <copyright file="EmailDecryptionTest.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Tests.Client;

using AliasVault.IntegrationTests.SmtpServer;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using MimeKit;

/// <summary>
/// End-to-end tests for making sure errors and warnings in API are logged to database.
/// </summary>
[TestFixture]
[Category("ClientTests")]
[NonParallelizable]
public class EmailDecryptionTest : ClientPlaywrightTest
{
    /// <summary>
    /// The test host instance.
    /// </summary>
    private IHost _testHost = null!;

    /// <summary>
    /// The test host builder instance.
    /// </summary>
    private TestHostBuilder _testHostBuilder = null!;

    /// <summary>
    /// Setup logic for every test.
    /// </summary>
    /// <returns>Task.</returns>
    [SetUp]
    public async Task Setup()
    {
        // Start the SMTP server test host so we can send emails to it and test encryption/decryption.
        _testHostBuilder = new TestHostBuilder();
        _testHost = _testHostBuilder.Build(ApiDbContext.Database.GetDbConnection());
        await _testHost.StartAsync();
    }

    /// <summary>
    /// Test if received email encrypted by server can be successfully decrypted by client.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    public async Task EmailEncryptionDecryptionTest()
    {
        // Create credential which should automatically create claim on server during database sync.
        const string serviceName = "Test Service";
        const string email = "testclaim@example.tld";
        await CreateCredentialEntry(new Dictionary<string, string>
        {
            { "service-name", serviceName },
            { "email", email },
        });

        // Assert that the claim was created on the server.
        var claim = await ApiDbContext.UserEmailClaims.Where(x => x.Address == email).FirstOrDefaultAsync();
        Assert.That(claim, Is.Not.Null, "Claim for email address not found in database. Check if credential creation and claim creation are working correctly.");

        // Assert that the users public key was created on the server.
        var publicKey = await ApiDbContext.UserEncryptionKeys.Where(x => x.UserId == claim.UserId).FirstOrDefaultAsync();
        Assert.That(publicKey, Is.Not.Null, "Public key for user not found in database. Check if public key creation is working correctly.");
        Assert.That(publicKey.PublicKey, Has.Length.GreaterThanOrEqualTo(100), "Public key exists but length does not match expected. Check if public key creation is working correctly.");

        // Email the SMTP server which will save the email in encrypted form in the database..
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Test Sender", "sender@example.com"));
        message.To.Add(new MailboxAddress("Test Recipient", email));
        const string textSubject = "Encrypted Email Subject";
        const string textBody = "This is a test email plain.";
        message.Subject = textSubject;
        message.Body = new BodyBuilder { TextBody = textBody }.ToMessageBody();
        await SendMessageToSmtpServer(message);

        // Assert that email was received by the server.
        var emailReceived = await ApiDbContext.Emails.FirstOrDefaultAsync(x => x.To == email);
        Assert.That(emailReceived, Is.Not.Null, "Email not received by server. Check SMTP server and email encryption/decryption logic.");

        // Assert that subject is not stored as plain text in the database.
        Assert.That(emailReceived.Subject, Does.Not.Contain(textSubject), "Email subject stored as plain text in database. Check email encryption logic.");

        // Attempt to click on email refresh button to get new emails.
        // Id =  recent-email-refresh
        await Page.Locator("id=recent-email-refresh").First.ClickAsync();

        // Wait for 1 sec
        await Task.Delay(1000);

        // Check if the email is visible on the page now.
        var emailContent = await Page.TextContentAsync("body");
        Assert.That(emailContent, Does.Contain(textSubject), "Email not (correctly) decrypted and displayed on the page. Check email decryption logic.");
    }

    /// <summary>
    /// Test that adding a credential with email domain that is not in the known list to not get added as claim.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    public async Task EmailUnknownDomainNoClaimTest()
    {
        // Create credential which should automatically create claim on server during database sync.
        const string serviceName = "Test Service";
        const string email = "testclaim@unknowndomain.tld";
        await CreateCredentialEntry(new Dictionary<string, string>
        {
            { "service-name", serviceName },
            { "email", email },
        });

        // Assert that the claim was created on the server.
        var claim = await ApiDbContext.UserEmailClaims.FirstOrDefaultAsync(x => x.Address == email);

        Assert.That(claim, Is.Null, "Claim for unknown email address domain found in database. Check if claim creation domain check is working correctly.");
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
    /// Sends a message to the SMTP server.
    /// </summary>
    /// <param name="message">MimeMessage to send.</param>
    private static async Task SendMessageToSmtpServer(MimeMessage message)
    {
        using var client = new SmtpClient();

        await client.ConnectAsync("localhost", 2525, SecureSocketOptions.None);
        try
        {
            await client.SendAsync(message);
        }
        finally
        {
            await client.DisconnectAsync(true);
        }
    }
}
