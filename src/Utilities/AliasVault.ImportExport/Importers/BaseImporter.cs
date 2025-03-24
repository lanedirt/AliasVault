//-----------------------------------------------------------------------
// <copyright file="BaseImporter.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.ImportExport.Importers;

using AliasClientDb;
using AliasVault.ImportExport.Models;

/// <summary>
/// Base class for all importers.
/// </summary>
public class BaseImporter
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
                Passwords = new List<Password> { new() { Value = importedCredential.Password } },
                Notes = importedCredential.Notes,
                CreatedAt = importedCredential.CreatedAt ?? DateTime.UtcNow,
                UpdatedAt = importedCredential.ModifiedAt ?? DateTime.UtcNow
            };

            credential.Alias = new Alias
            {
                CreatedAt = importedCredential.CreatedAt ?? DateTime.UtcNow,
                UpdatedAt = importedCredential.ModifiedAt ?? DateTime.UtcNow,
            };

            if (!string.IsNullOrEmpty(importedCredential.Email))
            {
                credential.Alias = new Alias { Email = importedCredential.Email };
            }

            if (!string.IsNullOrEmpty(importedCredential.TwoFactorSecret))
            {
                credential.TotpCodes = new List<TotpCode>
                {
                    new() { SecretKey = importedCredential.TwoFactorSecret }
                };
            }

            credentials.Add(credential);
        }

        return credentials;
    }
}