//-----------------------------------------------------------------------
// <copyright file="CredentialCsvService.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.ImportExport;

using AliasClientDb;
using AliasVault.ImportExport.Models;
using CsvHelper;
using CsvHelper.Configuration;
using System.Globalization;

/// <summary>
/// Exports and imports Credential objects to and from CSV files.
/// </summary>
public static class CredentialCsvService
{
    private const string CsvVersionIdentifier = "1.5.0";

    /// <summary>
    /// Export list of credentials to CSV file.
    /// </summary>
    /// <param name="credentials">List of credentials to export.</param>
    /// <returns>CSV file as byte array.</returns>
    public static byte[] ExportCredentialsToCsv(List<Credential> credentials)
    {
        var records = new List<CredentialCsvRecord>();

        foreach (var credential in credentials)
        {
            var record = new CredentialCsvRecord
            {
                Version = CsvVersionIdentifier,
                Username = credential.Username ?? string.Empty,
                Notes = credential.Notes ?? string.Empty,
                CreatedAt = credential.CreatedAt,
                UpdatedAt = credential.UpdatedAt,
                AliasGender = credential.Alias?.Gender ?? string.Empty,
                AliasFirstName = credential.Alias?.FirstName ?? string.Empty,
                AliasLastName = credential.Alias?.LastName ?? string.Empty,
                AliasNickName = credential.Alias?.NickName ?? string.Empty,
                AliasBirthDate = credential.Alias?.BirthDate,
                AliasEmail = credential.Alias?.Email ?? string.Empty,
                ServiceName = credential.Service?.Name ?? string.Empty,
                ServiceUrl = credential.Service?.Url ?? string.Empty,
                CurrentPassword = credential.Passwords.OrderByDescending(p => p.CreatedAt).FirstOrDefault()?.Value ?? string.Empty,
                TwoFactorSecret = credential.TotpCodes.FirstOrDefault()?.SecretKey ?? string.Empty
            };

            records.Add(record);
        }

        using var memoryStream = new MemoryStream();
        using var writer = new StreamWriter(memoryStream);
        using var csv = new CsvWriter(writer, new CsvConfiguration(CultureInfo.InvariantCulture));

        csv.WriteRecords(records);
        writer.Flush();
        return memoryStream.ToArray();
    }

    /// <summary>
    /// Imports Credential objects from a CSV file.
    /// </summary>
    /// <param name="fileContent">The content of the CSV file.</param>
    /// <returns>The imported list of ImportedCredential objects.</returns>
    public static async Task<List<ImportedCredential>> ImportCredentialsFromCsv(string fileContent)
    {
        using var reader = new StringReader(fileContent);
        using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture));

        var records = new List<CredentialCsvRecord>();
        await foreach (var record in csv.GetRecordsAsync<CredentialCsvRecord>())
        {
            records.Add(record);
        }

        if (records.Count == 0)
        {
            throw new InvalidOperationException("No records found in the CSV file.");
        }

        if (records[0].Version != CsvVersionIdentifier)
        {
            throw new InvalidOperationException("Invalid CSV file version.");
        }

        var credentials = new List<ImportedCredential>();

        foreach (var record in records)
        {
            var credential = new ImportedCredential
            {
                ServiceName = record.ServiceName,
                ServiceUrl = record.ServiceUrl,
                Username = record.Username,
                Password = record.CurrentPassword,
                Email = record.AliasEmail,
                Notes = record.Notes,
                Alias = new ImportedAlias
                {
                    Gender = record.AliasGender,
                    FirstName = record.AliasFirstName,
                    LastName = record.AliasLastName,
                    NickName = record.AliasNickName,
                    BirthDate = record.AliasBirthDate,
                    CreatedAt = record.CreatedAt,
                    UpdatedAt = record.UpdatedAt
                },
                TwoFactorSecret = record.TwoFactorSecret,
                CreatedAt = record.CreatedAt,
                UpdatedAt = record.UpdatedAt,
            };

            credentials.Add(credential);
        }

        return credentials;
    }
}

/// <summary>
/// CSV record for Credential objects.
/// </summary>
public class CredentialCsvRecord
{
    public string Version { get; set; } = "1.5.0";
    public string Username { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.MinValue;
    public DateTime UpdatedAt { get; set; } = DateTime.MinValue;
    public string AliasGender { get; set; } = string.Empty;
    public string AliasFirstName { get; set; } = string.Empty;
    public string AliasLastName { get; set; } = string.Empty;
    public string AliasNickName { get; set; } = string.Empty;
    public DateTime? AliasBirthDate { get; set; } = null;
    public string AliasEmail { get; set; } = string.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public string ServiceUrl { get; set; } = string.Empty;
    public string CurrentPassword { get; set; } = string.Empty;
    public string TwoFactorSecret { get; set; } = string.Empty;
}
