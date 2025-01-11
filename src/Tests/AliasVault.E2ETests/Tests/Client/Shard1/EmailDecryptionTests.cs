//-----------------------------------------------------------------------
// <copyright file="EmailDecryptionTests.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Tests.Client.Shard1;

using System.Text;
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
public class EmailDecryptionTests : ClientPlaywrightTest
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
        // Start the SMTP server test host so we can send emails to it and test encryption/decryption.
        _testHostBuilder = new TestHostBuilder();
        _testHost = _testHostBuilder.Build(ApiDbContext.Database.GetDbConnection());
        await _testHost.StartAsync();
    }

    /// <summary>
    /// Test if received email without attachments encrypted by server can be successfully decrypted by client
    /// and then be deleted by client.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    [Order(1)]
    public async Task EmailEncryptionDecryptionDeleteTest()
    {
        // Create credential which should automatically create claim on server during database sync.
        const string serviceName = "Test Service";
        const string email = "testclaim2@example.tld";
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

        // Email the SMTP server which will save the email in encrypted form in the database.
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Test Sender", "sender@example.com"));
        message.To.Add(new MailboxAddress("Test Recipient", email));
        const string textSubject = "Encrypted Email Subject";
        const string textBody = "This is a test email plain.";
        const string htmlBody = @"
        <html>
        <body>
            <h1>Test Email</h1>
            <p>This is a test email with HTML content.</p>
            <p>Sample anchor tag: <a href=""https://example.com"">Example Link</a></p>
        </body>
        </html>";
        message.Subject = textSubject;
        var bodyBuilder = new BodyBuilder
        {
            TextBody = textBody,
            HtmlBody = htmlBody,
        };
        message.Body = bodyBuilder.ToMessageBody();

        await SendMessageToSmtpServer(message);

        // Assert that email was received by the server.
        var emailReceived = await ApiDbContext.Emails.FirstOrDefaultAsync(x => x.To == email);
        Assert.That(emailReceived, Is.Not.Null, "Email not received by server. Check SMTP server and email encryption/decryption logic.");

        // Assert that subject is not stored as plain text in the database.
        Assert.That(emailReceived.Subject, Does.Not.Contain(textSubject), "Email subject stored as plain text in database. Check email encryption logic.");

        // Attempt to click on email refresh button to get new emails.
        await Page.Locator("id=recent-email-refresh").First.ClickAsync();
        await WaitForUrlAsync("credentials/**", "Subject");

        // Check if the email is visible on the page now.
        var emailContent = await Page.TextContentAsync("body");
        Assert.That(emailContent, Does.Contain(textSubject), "Email not (correctly) decrypted and displayed on the credential page. Check email decryption logic.");

        // Navigate to the email index page and ensure that the decrypted email is also readable there.
        await NavigateUsingBlazorRouter("emails");
        await WaitForUrlAsync("emails", "Inbox");

        // Check if the email is visible on the page now.
        emailContent = await Page.TextContentAsync("body");
        Assert.That(emailContent, Does.Contain(textSubject), "Email not (correctly) decrypted and displayed on the emails page. Check email decryption logic.");

        // Attempt to click on the email subject to open the modal.
        await Page.Locator("text=" + textSubject).First.ClickAsync();
        await WaitForUrlAsync("emails**", "Delete");

        // Assert that the anchor tag in the email iframe has target="_blank" attribute.
        var anchorTag = await Page.Locator("iframe").First.GetAttributeAsync("srcdoc");
        Assert.That(anchorTag, Does.Contain("target=\"_blank\""), "Anchor tag in email iframe does not have target=\"_blank\" attribute. Check email decryption logic.");

        // Click the delete button to delete the email.
        await Page.Locator("id=delete-email").First.ClickAsync();

        // Wait for the email delete confirm message to show up.
        await WaitForUrlAsync("emails**", "Email deleted successfully");

        // Assert that the email is no longer visible on the page.
        var body = await Page.TextContentAsync("body");
        Assert.That(body, Does.Not.Contain(textSubject), "Email not deleted from page after deletion. Check email deletion logic.");
    }

    /// <summary>
    /// Test if received email including attachment encrypted by server can be successfully decrypted by client
    /// and then be deleted by client.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    [Order(2)]
    public async Task EmailEncryptionDecryptionAttachmentDeleteTest()
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
        Assert.That(publicKey!.PublicKey, Has.Length.GreaterThanOrEqualTo(100), "Public key exists but length does not match expected. Check if public key creation is working correctly.");

        // Email the SMTP server which will save the email in encrypted form in the database..
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Test Sender", "sender@example.com"));
        message.To.Add(new MailboxAddress("Test Recipient", email));
        const string textSubject = "Encrypted Email Subject";
        const string textBody = "This is a test email plain.";
        const string htmlBody = @"
        <html>
        <body>
            <h1>Test Email</h1>
            <p>This is a test email with HTML content.</p>
            <p>Sample anchor tag: <a href=""https://example.com"">Example Link</a></p>
        </body>
        </html>";
        message.Subject = textSubject;
        var bodyBuilder = new BodyBuilder
        {
            TextBody = textBody,
            HtmlBody = htmlBody,
        };
        var attachment = new MimePart("text", "plain")
        {
            Content = new MimeContent(new MemoryStream(Encoding.UTF8.GetBytes("This is an attachment."))),
            ContentDisposition = new ContentDisposition(ContentDisposition.Attachment),
            ContentTransferEncoding = ContentEncoding.Base64,
            FileName = "attachment.txt",
        };
        bodyBuilder.Attachments.Add(attachment);
        message.Body = bodyBuilder.ToMessageBody();

        await SendMessageToSmtpServer(message);

        // Assert that email was received by the server.
        var emailReceived = await ApiDbContext.Emails.FirstOrDefaultAsync(x => x.To == email);
        Assert.That(emailReceived, Is.Not.Null, "Email not received by server. Check SMTP server and email encryption/decryption logic.");

        // Assert that the attachment is stored in the database.
        var attachmentReceived = await ApiDbContext.EmailAttachments.FirstOrDefaultAsync(x => x.EmailId == emailReceived.Id);
        Assert.That(attachmentReceived, Is.Not.Null, "Attachment not found in database. Check email attachment encryption logic.");

        // Assert that the attachment content is encrypted
        var attachmentContent = Encoding.UTF8.GetString(attachmentReceived!.Bytes);
        Assert.Multiple(() =>
        {
            Assert.That(attachmentContent, Does.Not.Contain("This is an attachment."), "Attachment content stored as plain text in database. Check attachment encryption logic.");
            Assert.That(attachmentContent, Is.Not.Empty, "Attachment content is empty. Check attachment encryption logic.");
        });

        // Assert that subject is not stored as plain text in the database.
        Assert.That(emailReceived!.Subject, Does.Not.Contain(textSubject), "Email subject stored as plain text in database. Check email encryption logic.");

        // Attempt to click on email refresh button to get new emails.
        await Page.Locator("id=recent-email-refresh").First.ClickAsync();
        await WaitForUrlAsync("credentials/**", "Subject");

        // Check if the email is visible on the page now.
        var emailContent = await Page.TextContentAsync("body");
        Assert.That(emailContent, Does.Contain(textSubject), "Email not (correctly) decrypted and displayed on the credential page. Check email decryption logic.");

        // Navigate to the email index page and ensure that the decrypted email is also readable there.
        await NavigateUsingBlazorRouter("emails");
        await WaitForUrlAsync("emails", "Inbox");

        // Check if the email is visible on the page now.
        emailContent = await Page.TextContentAsync("body");
        Assert.That(emailContent, Does.Contain(textSubject), "Email not (correctly) decrypted and displayed on the emails page. Check email decryption logic.");

        // Assert that the attachment indicator is visible on the page.
        var attachmentIndicator = await Page.Locator(".attachment-indicator").First.GetAttributeAsync("class");
        Assert.That(attachmentIndicator, Is.Not.Null, "Attachment indicator not visible on email page. Check email attachment decryption logic.");

        // Attempt to click on the email subject to open the modal.
        await Page.Locator("text=" + textSubject).First.ClickAsync();
        await WaitForUrlAsync("emails**", "Delete");

        // Assert that the anchor tag in the email iframe has target="_blank" attribute.
        var anchorTag = await Page.Locator("iframe").First.GetAttributeAsync("srcdoc");
        Assert.That(anchorTag, Does.Contain("target=\"_blank\""), "Anchor tag in email iframe does not have target=\"_blank\" attribute. Check email decryption logic.");

        // Assert that email attachment metadata is visible in the modal.
        var body = await Page.TextContentAsync("body");
        Assert.That(body, Does.Contain("attachment.txt"), "Attachment metadata not visible in email modal. Check email attachment parse logic.");

        // Assert that clicking on the attachment link downloads it.
        await Page.Locator(".attachment-link").First.ClickAsync();
        var download = await Page.WaitForDownloadAsync();

        // Get the path of the downloaded file
        var downloadedFilePath = await download.PathAsync();

        // Read the content of the downloaded file
        var downloadedContent = await File.ReadAllBytesAsync(downloadedFilePath);

        // Compare with the original attachment content
        var originalContent = Encoding.UTF8.GetBytes("This is an attachment.");
        Assert.That(downloadedContent, Is.EqualTo(originalContent), "Downloaded attachment content does not match the original content.");

        // Clean up: delete the downloaded file
        File.Delete(downloadedFilePath);

        // Click the delete button to delete the email.
        await Page.Locator("id=delete-email").First.ClickAsync();

        // Wait for the email delete confirm message to show up.
        await WaitForUrlAsync("emails**", "Email deleted successfully");

        // Assert that the email is no longer visible on the page.
        body = await Page.TextContentAsync("body");
        Assert.That(body, Does.Not.Contain(textSubject), "Email not deleted from page after deletion. Check email deletion logic.");
    }

    /// <summary>
    /// Test that adding a credential with email domain that is not in the known list to not get added as claim.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    [Order(3)]
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
    /// Test that a user cannot claim an email address that is already claimed by another user.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    [Order(4)]
    public async Task EmailDuplicateClaimTest()
    {
        // Create credential which should automatically create claim on server during database sync.
        const string serviceName = "Test Service";
        const string email = "testclaimduplicate@example.tld";
        await CreateCredentialEntry(new Dictionary<string, string>
        {
            { "service-name", serviceName },
            { "email", email },
        });

        // Assert that the claim was created on the server.
        var claim = await ApiDbContext.UserEmailClaims.FirstOrDefaultAsync(x => x.Address == email);
        Assert.That(claim, Is.Not.Null, "Claim for email address not found in database. Check if credential creation and claim creation are working correctly.");

        // Login as new user.
        await LogoutAndLoginAsNewUser();

        // Try to claim the same email address again.
        await CreateCredentialEntry(new Dictionary<string, string>
        {
            { "service-name", serviceName },
            { "email", email },
        });

        // Assert that still only one claim exists for the email address.
        var claimCount = await ApiDbContext.UserEmailClaims.CountAsync(x => x.Address == email);
        Assert.That(
            claimCount,
            Is.LessThanOrEqualTo(1),
            "More than one claim for email address found in database while only one should exist. Check if claim creation domain check is working correctly.");

        // Assert that error is displayed on the page.
        var pageContent = await Page.TextContentAsync("body");
        Assert.That(pageContent, Does.Contain("The current chosen email address is already in use"), "Error message not displayed on page when trying to claim email address already claimed by another user.");
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
