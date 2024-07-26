//-----------------------------------------------------------------------
// <copyright file="DatabaseMessageStore.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.SmtpService.Handlers;

using System.Buffers;
using System.Net.Mail;
using System.Text.RegularExpressions;
using AliasServerDb;
using Microsoft.EntityFrameworkCore;
using MimeKit;
using NUglify;
using SmtpServer;
using SmtpServer.Protocol;
using SmtpServer.Storage;

/// <summary>
/// Custom exception for when the email parsing fails to find the "to" address in the email.
/// </summary>
public class EmailParseMissingToException(string message) : Exception(message);

/// <summary>
/// Database message store.
/// </summary>
/// <param name="logger">ILogger instance.</param>
/// <param name="config">Config instance.</param>
public class DatabaseMessageStore(ILogger<DatabaseMessageStore> logger, Config config, IDbContextFactory<AliasServerDbContext> dbContextFactory) : MessageStore
{
    /// <summary>
    /// Override the SaveAsync method to save the email into the database.
    /// </summary>
    /// <param name="context">ISessionContext instance.</param>
    /// <param name="transaction">IMessageTransaction instance.</param>
    /// <param name="buffer">Buffer which contains the email contents.</param>
    /// <param name="cancellationToken">CancellationToken instance.</param>
    /// <returns>SmtpResponse.</returns>
    public override async Task<SmtpResponse> SaveAsync(ISessionContext context, IMessageTransaction transaction, ReadOnlySequence<byte> buffer, CancellationToken cancellationToken)
    {
        await using var stream = new MemoryStream();

        var position = buffer.GetPosition(0);
        while (buffer.TryGet(ref position, out var memory))
        {
            stream.Write(memory.Span);
        }

        // Max email filesize limit: 10MB. If the mail is larger in size, reject it.
        // Because of base64 encoding which has approx 33% increase in binary size
        // we multiply the limit by 1.4 to be safe.
        var maxEmailSizeInMegabytes = 10;
        if (stream.Length > ((maxEmailSizeInMegabytes * 1024 * 1024) * 1.4))
        {
            return SmtpResponse.SizeLimitExceeded;
        }

        stream.Position = 0;
        var message = await MimeMessage.LoadAsync(stream, cancellationToken);
        // Retrieve all addresses from the SMTP transaction which should contain all recipients for this mail instance.
        var allAddresses =  transaction.To
            .Distinct()
            .ToList();
        // Limit list to 15 addresses max. (to prevent mailbomb spam abuse)
        var toAddresses = allAddresses.Take(15).ToList();
        // For every toAddress
        foreach (var toAddress in toAddresses)
        {
            if (toAddress == null)
            {
                // No toAddress, skip.
                logger.LogWarning("Skip email, no toAddress available.");
                return SmtpResponse.NoValidRecipientsGiven;
            }
            if (!config.AllowedToDomains.Contains(toAddress.Host.ToLowerInvariant()))
            {
                // ToAddress domain is not allowed.
                if (toAddresses.Count > 1)
                {
                    // If more recipients, silently skip this one.
                    continue;
                }

                // If only one recipient, return error.
                logger.LogWarning("Rejected email: email for {ToAddress} is not allowed.", toAddress.User + "@" + toAddress.Host);
                return SmtpResponse.NoValidRecipientsGiven;
            }

            var insertedId = await InsertEmailIntoDatabase(message);
            logger.LogInformation("Email for {ToAddress} successfully saved into database with ID {insertedId}.", toAddress.User + "@" + toAddress.Host, insertedId);
        }

        return SmtpResponse.Ok;
    }

    /// <summary>
    /// Insert email into database.
    /// </summary>
    /// <param name="message">MimeMessage to save into database.</param>
    private async Task<int> InsertEmailIntoDatabase(MimeMessage message)
    {
        var dbContext = await dbContextFactory.CreateDbContextAsync();

        var newEmail = ConvertMimeMessageToEmail(message);

        await dbContext.Emails.AddAsync(newEmail);
        await dbContext.SaveChangesAsync();

        return newEmail.Id;
    }

    /// <summary>
    /// Convert MimeMessage to Email database object.
    /// </summary>
    /// <param name="message">MimeMessage object.</param>
    /// <returns>Email object.</returns>
    /// <exception cref="EmailParseMissingToException"></exception>
    private static Email ConvertMimeMessageToEmail(MimeMessage message)
    {
        string from = "";

        try
        {
            from = message.From.FirstOrDefault()?.ToString() ?? string.Empty;
        }
        catch
        {
            // Do nothing.
        }

        string fromLocal;
        string fromDomain;
        // Try to extract from address firstly from "from" in the mail.
        try
        {
            MailAddress fromAddress = new MailAddress(message.From.FirstOrDefault()?.ToString() ?? string.Empty);
            fromLocal = fromAddress.User;
            fromDomain = fromAddress.Host;

        }
        catch
        {
            // If the above fails, try to find the x-sender in the mail
            try
            {
                MailAddress fromAddress = new MailAddress(message.Headers.First(x => x.Field == "x-sender").Value.ToString());
                fromLocal = fromAddress.User;
                fromDomain = fromAddress.Host;
            }
            catch
            {
                // If this fails as well, then simply use a blank value
                fromLocal = "";
                fromDomain = "";
            }
        }

        MailAddress toAddress;
        string to;

        // Try to extract to address firstly from x-receiver address..
        try
        {
            to = message.Headers.First(x => x.Field == "x-receiver").Value.ToString();
            toAddress = new MailAddress(to);
        }
        catch
        {
            // If the above fails, try to find the "to" in the mail
            try
            {
                to = message.To.FirstOrDefault()?.ToString() ?? "";
                toAddress = new MailAddress(to);
            }
            catch
            {
                // If this fails as well, then simply let it throw an error to the caller.
                throw new EmailParseMissingToException("Could not find x-receiver or to address in email.");
            }
        }

        // Create email object
        var email = new Email();
        email.From = from;
        email.FromLocal = fromLocal;
        email.FromDomain = fromDomain;

        email.To = to;
        // Local part to lowercase, as mailboxes are always lowercase
        email.ToLocal = toAddress.User.ToLower();
        email.ToDomain = toAddress.Host;

        email.Subject = message.Subject ?? "";
        email.MessageHtml = message.HtmlBody;
        email.MessagePlain = message.TextBody;
        email.MessageSource = message.ToString();

        // Extract message preview text based on body contents.
        email.MessagePreview = ExtractMessagePreview(email);

        email.Date = message.Date.DateTime;
        email.DateSystem = DateTime.UtcNow;
        email.Visible = true;

        // Parse attachments from email, and create separate attachment records in database for each attachment
        foreach (var attachment in message.Attachments)
        {
            var emailAttachment = CreateEmailAttachment(attachment);
            email.Attachments.Add(emailAttachment);
        }

        return email;
    }

    /// <summary>
    /// Extracts a preview of the email message body to be used in the email listing preview in the UI.
    /// This so the client does not need to load the full email body.
    /// </summary>
    /// <param name="email"></param>
    /// <returns></returns>
    private static string ExtractMessagePreview(Email email)
    {
        var messagePreview = string.Empty;
        const int maxPreviewLength = 180;

        try
        {
            if (email.MessagePlain != null && !String.IsNullOrEmpty(email.MessagePlain) && email.MessagePlain.Length > 3)
            {
                // Replace any newline characters with a space
                string plainToPlainText = Regex.Replace(email.MessagePlain, @"\t|\n|\r", " ", RegexOptions.NonBacktracking);

                // Remove all "-" or "=" characters if there are 3 or more in a row
                plainToPlainText = Regex.Replace(plainToPlainText, @"-{3,}|\={3,}", "", RegexOptions.NonBacktracking);

                // Remove any non-printable characters
                plainToPlainText = Regex.Replace(plainToPlainText, @"[^\u0020-\u007E]", "", RegexOptions.NonBacktracking);

                // Replace multiple spaces with a single space
                plainToPlainText = Regex.Replace(plainToPlainText, @"\s+", " ", RegexOptions.NonBacktracking);

                // Trim start and end of string
                plainToPlainText = plainToPlainText.Trim();

                messagePreview = plainToPlainText.Length > maxPreviewLength
                    ? plainToPlainText.Substring(0, maxPreviewLength)
                    : plainToPlainText;
            }
            else if (email.MessageHtml != null)
            {
                string htmlToPlainText = Uglify.HtmlToText(email.MessageHtml).ToString();

                // Replace any newline characters with a space
                htmlToPlainText = Regex.Replace(htmlToPlainText, @"\t|\n|\r", " ", RegexOptions.NonBacktracking);

                // Remove all "-" or "=" characters if there are 3 or more in a row
                htmlToPlainText = Regex.Replace(htmlToPlainText, @"-{3,}|\={3,}", "", RegexOptions.NonBacktracking);

                // Remove any non-printable characters
                htmlToPlainText = Regex.Replace(htmlToPlainText, @"[^\u0020-\u007E]", "", RegexOptions.NonBacktracking);

                // Replace multiple spaces with a single space
                htmlToPlainText = Regex.Replace(htmlToPlainText, @"\s+", " ", RegexOptions.NonBacktracking);

                // Trim start and end of string
                htmlToPlainText = htmlToPlainText.Trim();

                messagePreview =
                    htmlToPlainText.Length > maxPreviewLength ? htmlToPlainText.Substring(0, maxPreviewLength) : htmlToPlainText;
            }
        }
        catch
        {
            // Extracting useful words from email failed.. Skip the step, do nothing..
        }

        return messagePreview;
    }

    /// <summary>
    /// Create an EmailAttachment object from a MimeEntity attachment.
    /// </summary>
    /// <param name="attachment"></param>
    /// <returns></returns>
    private static EmailAttachment CreateEmailAttachment(MimeEntity attachment)
    {
        byte[] fileBytes = GetAttachmentBytes(attachment);

        return new EmailAttachment
        {
            Bytes = fileBytes,
            Filename = attachment.ContentDisposition?.FileName ?? "",
            MimeType = attachment.ContentType.MimeType,
            Filesize = fileBytes.Length,
            Date = DateTime.Now
        };
    }

    /// <summary>
    /// Get the attachment bytes from a MimeEntity attachment.
    /// </summary>
    /// <param name="attachment"></param>
    /// <returns></returns>
    private static byte[] GetAttachmentBytes(MimeEntity attachment)
    {
        using (var memory = new MemoryStream())
        {
            if (attachment is MimePart mimePartAttachment)
            {
                mimePartAttachment.Content.DecodeTo(memory);
            }
            else
            {
                ((MessagePart)attachment).Message.WriteTo(memory);
            }

            return memory.ToArray();
        }
    }
}
