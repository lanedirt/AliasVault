//-----------------------------------------------------------------------
// <copyright file="DropboxImporter.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.ImportExport.Importers;

using AliasVault.ImportExport.Models;
using AliasVault.ImportExport.Models.Imports;
using CsvHelper;
using CsvHelper.Configuration;
using System.Globalization;

/// <summary>
/// Imports credentials from Dropbox Passwords.
/// </summary>
public static class DropboxImporter
{
    /// <summary>
    /// Imports Dropbox CSV file and converts contents to list of ImportedCredential model objects.
    /// </summary>
    /// <param name="fileContent">The content of the CSV file.</param>
    /// <returns>The imported list of ImportedCredential objects.</returns>
    public static async Task<List<ImportedCredential>> ImportFromCsvAsync(string fileContent)
    {
        using var reader = new StringReader(fileContent);
        using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture));

        var credentials = new List<ImportedCredential>();
        await foreach (var record in csv.GetRecordsAsync<DropboxCsvRecord>())
        {
            // Skip empty records (records with no title)
            if (string.IsNullOrWhiteSpace(record.Name))
            {
                continue;
            }

            var credential = new ImportedCredential
            {
                ServiceName = record.Name,
                ServiceUrl = NormalizeUrl(record.Url),
                Username = record.Username,
                Password = record.Password,
                Notes = record.Notes
            };

            credentials.Add(credential);
        }

        if (credentials.Count == 0)
        {
            throw new InvalidOperationException("No records found in the CSV file.");
        }

        return credentials;
    }

    /// <summary>
    /// Normalizes URL values from Dropbox CSV format.
    /// </summary>
    /// <param name="url">The URL from the CSV record.</param>
    /// <returns>The normalized URL or null if it's empty or invalid.</returns>
    private static string? NormalizeUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return null;
        }

        return url;
    }
}
