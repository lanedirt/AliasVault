//-----------------------------------------------------------------------
// <copyright file="LastPassImporter.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.ImportExport.Importers;

using AliasVault.ImportExport.Models;
using AliasVault.ImportExport.Models.Imports;

/// <summary>
/// Imports credentials from LastPass.
/// </summary>
public static class LastPassImporter
{
    /// <summary>
    /// Imports LastPass CSV file and converts contents to list of ImportedCredential model objects.
    /// </summary>
    /// <param name="fileContent">The content of the CSV file.</param>
    /// <returns>The imported list of ImportedCredential objects.</returns>
    public static async Task<List<ImportedCredential>> ImportFromCsvAsync(string fileContent)
    {
        var records = await BaseImporter.ImportCsvDataAsync<LastPassCsvRecord>(fileContent);

        var credentials = new List<ImportedCredential>();
        foreach (var record in records)
        {
            // Skip empty records (records with no name/title)
            if (string.IsNullOrWhiteSpace(record.Title))
            {
                continue;
            }

            var credential = new ImportedCredential
            {
                ServiceName = record.Title,
                ServiceUrl = NormalizeUrl(record.URL),
                Username = record.Username,
                Password = record.Password,
                TwoFactorSecret = record.TwoFactorSecret,
                Notes = record.Extra
            };

            credentials.Add(credential);
        }

        return credentials;
    }

    /// <summary>
    /// Normalizes URL values from LastPass CSV format.
    /// LastPass uses "http://sn" for secure notes and "http://" for entries without URLs.
    /// </summary>
    /// <param name="url">The URL from the CSV record.</param>
    /// <returns>The normalized URL or null if it's a special LastPass placeholder.</returns>
    private static string? NormalizeUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url) || url == "http://" || url == "http://sn")
        {
            return null;
        }

        return url;
    }
}
