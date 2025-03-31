//-----------------------------------------------------------------------
// <copyright file="ChromeImporter.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.ImportExport.Importers;

using AliasVault.ImportExport.Models;
using AliasVault.ImportExport.Models.Imports;
using CsvHelper;
using CsvHelper.Configuration;
using System.Globalization;

/// <summary>
/// Imports credentials from Chrome Password Manager.
/// </summary>
public static class ChromeImporter
{
    /// <summary>
    /// Imports Chrome CSV file and converts contents to list of ImportedCredential model objects.
    /// </summary>
    /// <param name="fileContent">The content of the CSV file.</param>
    /// <returns>The imported list of ImportedCredential objects.</returns>
    public static async Task<List<ImportedCredential>> ImportFromCsvAsync(string fileContent)
    {
        using var reader = new StringReader(fileContent);
        using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture));

        var credentials = new List<ImportedCredential>();
        await foreach (var record in csv.GetRecordsAsync<ChromeCsvRecord>())
        {
            var credential = new ImportedCredential
            {
                ServiceName = record.Name,
                ServiceUrl = record.Url,
                Username = record.Username,
                Password = record.Password,
                Notes = record.Note
            };

            credentials.Add(credential);
        }

        if (credentials.Count == 0)
        {
            throw new InvalidOperationException("No records found in the CSV file.");
        }

        return credentials;
    }
}