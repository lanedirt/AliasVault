//-----------------------------------------------------------------------
// <copyright file="EmailService.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Services;

using AliasClientDb;
using AliasVault.Shared.Models.Spamok;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// Email service that contains utility methods for handling email functionality such as client-side decryption.
/// </summary>
public sealed class EmailService(DbService dbService, JsInteropService jsInteropService, GlobalNotificationService globalNotificationService, ILogger<EmailService> logger)
{
    private List<EncryptionKey> _encryptionKeys = [];

    /// <summary>
    /// Decrypts a single email using the private key.
    /// </summary>
    /// <param name="email">The email object with encrypted fields.</param>
    /// <returns>Email with all fields decrypted.</returns>
    public async Task<EmailApiModel> DecryptEmail(EmailApiModel email)
    {
        await EnsureEncryptionKeys();
        return await DecryptSingleEmail(email);
    }

    /// <summary>
    /// Decrypts a list of emails using the private key.
    /// </summary>
    /// <param name="emailList">The email object with encrypted fields.</param>
    /// <returns>List of emails with all fields decrypted.</returns>
    public async Task<List<MailboxEmailApiModel>> DecryptEmailList(List<MailboxEmailApiModel> emailList)
    {
        await EnsureEncryptionKeys();

        foreach (var email in emailList)
        {
            var privateKey = _encryptionKeys.First(x => x.PublicKey == email.EncryptionKey);

            try
            {
                var decryptedSymmetricKey = await jsInteropService.DecryptWithPrivateKey(email.EncryptedSymmetricKey, privateKey.PrivateKey);
                email.Subject = await jsInteropService.SymmetricDecrypt(email.Subject, Convert.ToBase64String(decryptedSymmetricKey));
                email.FromDisplay = await jsInteropService.SymmetricDecrypt(email.FromDisplay, Convert.ToBase64String(decryptedSymmetricKey));
                email.FromLocal = await jsInteropService.SymmetricDecrypt(email.FromLocal, Convert.ToBase64String(decryptedSymmetricKey));
                email.FromDomain = await jsInteropService.SymmetricDecrypt(email.FromDomain, Convert.ToBase64String(decryptedSymmetricKey));
                email.MessagePreview = await jsInteropService.SymmetricDecrypt(email.MessagePreview, Convert.ToBase64String(decryptedSymmetricKey));
            }
            catch (Exception ex)
            {
                globalNotificationService.AddErrorMessage(ex.Message, true);
                logger.LogError(ex, "Error decrypting email list.");
            }
        }

        return emailList;
    }

    /// <summary>
    /// Decrypt the contents of a single email.
    /// </summary>
    /// <param name="email">The email object with encrypted fields.</param>
    /// <returns>Email with all fields decrypted.</returns>
    private async Task<EmailApiModel> DecryptSingleEmail(EmailApiModel email)
    {
        var privateKey = _encryptionKeys.First(x => x.PublicKey == email.EncryptionKey);

        try
        {
            var decryptedSymmetricKey = await jsInteropService.DecryptWithPrivateKey(email.EncryptedSymmetricKey, privateKey.PrivateKey);
            email.Subject = await jsInteropService.SymmetricDecrypt(email.Subject, Convert.ToBase64String(decryptedSymmetricKey));
            if (email.MessageHtml is not null)
            {
                email.MessageHtml = await jsInteropService.SymmetricDecrypt(email.MessageHtml, Convert.ToBase64String(decryptedSymmetricKey));
            }

            if (email.MessagePlain is not null)
            {
                email.MessagePlain = await jsInteropService.SymmetricDecrypt(email.MessagePlain, Convert.ToBase64String(decryptedSymmetricKey));
            }

            email.FromDisplay = await jsInteropService.SymmetricDecrypt(email.FromDisplay, Convert.ToBase64String(decryptedSymmetricKey));
            email.FromLocal = await jsInteropService.SymmetricDecrypt(email.FromLocal, Convert.ToBase64String(decryptedSymmetricKey));
            email.FromDomain = await jsInteropService.SymmetricDecrypt(email.FromDomain, Convert.ToBase64String(decryptedSymmetricKey));
        }
        catch (Exception ex)
        {
            globalNotificationService.AddErrorMessage(ex.Message, true);
            logger.LogError(ex, "Error decrypting email.");
        }

        return email;
    }

    /// <summary>
    /// Ensure the encryption keys are loaded.
    /// </summary>
    private async Task EnsureEncryptionKeys()
    {
        if (_encryptionKeys.Count == 0)
        {
            var context = await dbService.GetDbContextAsync();
            _encryptionKeys = await context.EncryptionKeys.ToListAsync();
        }
    }
}
