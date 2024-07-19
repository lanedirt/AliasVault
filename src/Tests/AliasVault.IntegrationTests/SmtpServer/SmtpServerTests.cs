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
    [SetUp]
    public async Task Setup()
    {
        _testHostBuilder = new TestHostBuilder();
        _testHost = _testHostBuilder.Build();

        await _testHost.StartAsync();
    }

    /// <summary>
    /// Tear down logic for every test.
    /// </summary>
    [TearDown]
    public async Task TearDown()
    {
        if (_testHost != null)
        {
            await _testHost.StopAsync();
            _testHost.Dispose();
        }
    }

    /// <summary>
    /// Tests sending a single email in plain format to the SMTP server to check if it is processed correctly.
    /// </summary>
    [Test]
    public async Task SingleEmailPlain()
    {
        // Send an email to the SMTP server.
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Test Sender", "sender@example.com"));
        message.To.Add(new MailboxAddress("Test Recipient", "recipient@example.tld"));
        message.Subject = "Test Email";
        const string textBody = "This is a test email plain.";
        message.Body = new BodyBuilder { TextBody = textBody}.ToMessageBody();
        await SendMessageToSmtpServer(message);

        // Check if the email is in the database.
        var processedEmail = await _testHostBuilder.GetDbContext().Emails.FirstAsync();
        Assert.That(processedEmail, Is.Not.Null);
        Assert.That(processedEmail.From, Is.EqualTo("\"Test Sender\" <sender@example.com>"));
        Assert.That(processedEmail.FromLocal, Is.EqualTo("sender"));
        Assert.That(processedEmail.FromDomain, Is.EqualTo("example.com"));
        Assert.That(processedEmail.To, Is.EqualTo("\"Test Recipient\" <recipient@example.tld>"));
        Assert.That(processedEmail.MessagePreview, Is.EqualTo("This is a test email plain."));
        Assert.That(processedEmail.MessagePlain, Is.EqualTo("This is a test email plain."));
        Assert.That(processedEmail.MessageHtml, Is.Null);
    }

    /// <summary>
    /// Tests sending a single email in html format to the SMTP server to check if it is processed correctly.
    /// </summary>
    [Test]
    public async Task SingleEmailHtml()
    {
        // Arrange
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Test Sender", "sender@example.com"));
        message.To.Add(new MailboxAddress("Test Recipient", "recipient@example.tld"));
        message.Subject = "Test Email with HTML body.";
        const string htmlBody = "<html><body><h1>This is a test email html.</h1></body></html>";
        message.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();
        await SendMessageToSmtpServer(message);

        // Check if the email is in the database.
        var processedEmail = await _testHostBuilder.GetDbContext().Emails.FirstAsync();
        Assert.That(processedEmail, Is.Not.Null);
        Assert.That(processedEmail.To, Is.EqualTo("\"Test Recipient\" <recipient@example.tld>"));
        Assert.That(processedEmail.MessagePreview, Is.EqualTo("This is a test email html."));
        Assert.That(processedEmail.MessagePlain, Is.Null);
        Assert.That(processedEmail.MessageHtml, Is.EqualTo(htmlBody));
    }

    /// <summary>
    /// Tests sending a single email in multipart format to the SMTP server to check if it is processed correctly.
    /// </summary>
    [Test]
    public async Task SingleEmailMultipart()
    {
        // Arrange
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Test Sender", "sender@example.com"));
        message.To.Add(new MailboxAddress("Test Recipient", "recipient@example.tld"));
        message.Subject = "Test Email with multipart body.";
        const string textBody = "This is a test email multipart.";
        const string htmlBody = "<html><body><h1>This is a test email multipart.</h1></body></html>";
        message.Body = new BodyBuilder { TextBody = textBody, HtmlBody = htmlBody}.ToMessageBody();
        await SendMessageToSmtpServer(message);

        // Check if the email is in the database.
        var processedEmail = await _testHostBuilder.GetDbContext().Emails.FirstAsync();
        Assert.That(processedEmail, Is.Not.Null);
        Assert.That(processedEmail.To, Is.EqualTo("\"Test Recipient\" <recipient@example.tld>"));
        Assert.That(processedEmail.MessagePreview, Is.EqualTo("This is a test email multipart."));
        Assert.That(processedEmail.MessagePlain, Is.EqualTo("This is a test email multipart."));
        Assert.That(processedEmail.MessageHtml, Is.EqualTo(htmlBody));
    }

    /// <summary>
    /// Tests sending a single email in plain format to the SMTP server to check if it is processed correctly.
    /// </summary>
    [Test]
    public async Task MultipleRecipientsEmail()
    {
        // Send an email to the SMTP server.
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Test Sender", "sender@example.com"));
        message.To.Add(new MailboxAddress("Test Recipient", "recipient.to@example.tld"));
        message.Cc.Add(new MailboxAddress("Test Recipient 2", "recipient.cc@example.tld"));
        message.Cc.Add(new MailboxAddress("Test Recipient 3 unknown domain", "recipient@unknowndomain.tld"));

        message.Subject = "Test Email";
        const string textBody = "This is a test email plain.";
        message.Body = new BodyBuilder { TextBody = textBody}.ToMessageBody();
        await SendMessageToSmtpServer(message);

        // Check that two emails are in the database, one for each allowed recipient.
        Assert.That(await _testHostBuilder.GetDbContext().Emails.CountAsync(), Is.EqualTo(2));
    }

    /// <summary>
    /// Tests sending a single email in plain format to the SMTP server to check if it is processed correctly.
    /// </summary>
    [Test]
    public void SingleEmailUnknownRecipient()
    {
        // Send an email to the SMTP server.
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Test Sender", "sender@example.com"));
        message.To.Add(new MailboxAddress("Test Recipient", "recipient@unknowndomain.tld"));
        message.Subject = "Test Email";
        const string textBody = "This is a test email plain.";
        message.Body = new BodyBuilder { TextBody = textBody}.ToMessageBody();

        // Expect error from SmtpClient when sending email to unknown domain.
        Assert.ThrowsAsync<SmtpCommandException>(async () => await SendMessageToSmtpServer(message));
    }

    /// <summary>
    /// Sends a message to the SMTP server.
    /// </summary>
    /// <param name="message"></param>
    private async Task SendMessageToSmtpServer(MimeMessage message)
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
