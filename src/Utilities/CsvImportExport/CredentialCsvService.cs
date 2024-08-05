//-----------------------------------------------------------------------
// <copyright file="CredentialCsvService.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace CsvImportExport;

using AliasClientDb;
using CsvHelper;
using CsvHelper.Configuration;
using System.Globalization;

/// <summary>
/// Exports and imports Credential objects to and from CSV files.
/// </summary>
public static class CredentialCsvService
{
    private const string CsvVersionIdentifier = "1.0.0";

    /// <param name="filePath">The file path of the CSV file.</param>
    public static byte[] ExportCredentialsToCsv(List<Credential> credentials)
    {
        var records = new List<CredentialCsvRecord>();

        foreach (var credential in credentials)
        {
            var record = new CredentialCsvRecord
            {
                Version = CsvVersionIdentifier,
                Id = credential.Id,
                Username = credential.Username,
                Notes = credential.Notes ?? string.Empty,
                CreatedAt = credential.CreatedAt,
                UpdatedAt = credential.UpdatedAt,
                AliasId = credential.AliasId,
                AliasGender = credential.Alias?.Gender ?? string.Empty,
                AliasFirstName = credential.Alias?.FirstName ?? string.Empty,
                AliasLastName = credential.Alias?.LastName ?? string.Empty,
                AliasNickName = credential.Alias?.NickName ?? string.Empty,
                AliasBirthDate = credential.Alias?.BirthDate,
                AliasEmail = credential.Alias?.Email ?? string.Empty,
                AliasCreatedAt = credential.Alias?.CreatedAt,
                AliasUpdatedAt = credential.Alias?.UpdatedAt,
                ServiceId = credential.ServiceId,
                ServiceName = credential.Service?.Name ?? string.Empty,
                ServiceUrl = credential.Service?.Url ?? string.Empty,
                CurrentPassword = credential.Passwords.OrderByDescending(p => p.CreatedAt).FirstOrDefault()?.Value ?? string.Empty
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
    /// <returns>The imported list of Credential objects.</returns>
    public static List<Credential> ImportCredentialsFromCsv(string fileContent)
    {
        using var reader = new StringReader(fileContent);
        using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture));

        var records = csv.GetRecords<CredentialCsvRecord>().ToList();

        if (records.Count == 0)
        {
            throw new InvalidOperationException("No records found in the CSV file.");
        }

        if (records[0].Version != CsvVersionIdentifier)
        {
            throw new InvalidOperationException("Invalid CSV file version.");
        }

        var credentials = new List<Credential>();

        foreach (var record in records)
        {
            var credential = new Credential
            {
                Id = record.Id,
                Username = record.Username,
                Notes = record.Notes,
                CreatedAt = record.CreatedAt,
                UpdatedAt = record.UpdatedAt,
                AliasId = record.AliasId,
                Alias = new Alias
                {
                    Id = record.AliasId,
                    Gender = record.AliasGender,
                    FirstName = record.AliasFirstName,
                    LastName = record.AliasLastName,
                    NickName = record.AliasNickName,
                    BirthDate = record.AliasBirthDate ?? DateTime.MinValue,
                    Email = record.AliasEmail,
                    CreatedAt = record.AliasCreatedAt ?? DateTime.UtcNow,
                    UpdatedAt = record.AliasUpdatedAt ?? DateTime.UtcNow
                },
                ServiceId = record.ServiceId,
                Service = new Service
                {
                    Id = record.ServiceId,
                    Name = record.ServiceName,
                    Url = record.ServiceUrl
                },
                Passwords = [
                    new Password
                    {
                        Value = record.CurrentPassword,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                ]
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
    public string Version { get; set; } = "1.0.0";
    public Guid Id { get; set; } = Guid.Empty;
    public string Username { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.MinValue;
    public DateTime UpdatedAt { get; set; } = DateTime.MinValue;
    public Guid AliasId { get; set; } = Guid.Empty;
    public string AliasGender { get; set; } = string.Empty;
    public string AliasFirstName { get; set; } = string.Empty;
    public string AliasLastName { get; set; } = string.Empty;
    public string AliasNickName { get; set; } = string.Empty;
    public DateTime? AliasBirthDate { get; set; } = null;
    public string AliasEmail { get; set; } = string.Empty;
    public DateTime? AliasCreatedAt { get; set; } = null;
    public DateTime? AliasUpdatedAt { get; set; } = null;
    public Guid ServiceId { get; set; } = Guid.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public string ServiceUrl { get; set; } = string.Empty;
    public string CurrentPassword { get; set; } = string.Empty;
}
