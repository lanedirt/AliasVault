//-----------------------------------------------------------------------
// <copyright file="BaseImporter.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.ImportExport.Importers;

using AliasClientDb;
using AliasVault.ImportExport.Models;
using AliasVault.TotpGenerator;

/// <summary>
/// Generic import logic.
/// </summary>
public static class BaseImporter
{
    /// <summary>
    /// Converts a list of imported credentials to a list of AliasVault credentials.
    /// </summary>
    /// <param name="importedCredentials">The list of imported credentials.</param>
    /// <returns>The list of AliasVault credentials.</returns>
    public static List<Credential> ConvertToCredential(List<ImportedCredential> importedCredentials)
    {
        var credentials = new List<Credential>();

        // Convert imported credentials to AliasVault relational DB format.
        foreach (var importedCredential in importedCredentials)
        {
            var credential = new Credential
            {
                Service = new Service { Name = importedCredential.ServiceName, Url = importedCredential.ServiceUrl },
                Username = importedCredential.Username,
                Passwords = [new() { Value = importedCredential.Password }],
                Notes = importedCredential.Notes,
                CreatedAt = importedCredential.CreatedAt ?? DateTime.UtcNow,
                UpdatedAt = importedCredential.UpdatedAt ?? DateTime.UtcNow,
                Alias = new Alias
                {
                    FirstName = importedCredential.Alias?.FirstName,
                    LastName = importedCredential.Alias?.LastName,
                    Gender = importedCredential.Alias?.Gender,
                    // TODO: birth date should be made nullable in client DB as it's not always available.
                    BirthDate = importedCredential.Alias?.BirthDate ?? DateTime.MinValue,
                    Email = importedCredential.Email,
                    NickName = importedCredential.Alias?.NickName,
                    CreatedAt = importedCredential.CreatedAt ?? DateTime.UtcNow,
                    UpdatedAt = importedCredential.UpdatedAt ?? DateTime.UtcNow,
                }
            };

            if (!string.IsNullOrEmpty(importedCredential.TwoFactorSecret))
            {
                // Sanitize the secret key by converting from potential URI to secret key and name.
                try
                {
                    var (secretKey, name) = TotpHelper.SanitizeSecretKey(importedCredential.TwoFactorSecret);

                    credential.TotpCodes = new List<TotpCode>
                    {
                        new()
                        {
                            Name = name ?? "Authenticator",
                            SecretKey = secretKey,
                            CreatedAt = importedCredential.CreatedAt ?? DateTime.UtcNow,
                            UpdatedAt = importedCredential.UpdatedAt ?? DateTime.UtcNow,
                        }
                    };
                }
                catch (Exception ex)
                {
                    // 2FA extraction failed, log the error and continue with the next credential
                    // so the import doesn't fail due to failed 2FA extraction.
                    Console.WriteLine($"Error importing TOTP code: {ex.Message}");
                }
            }

            credentials.Add(credential);
        }

        return credentials;
    }
}
