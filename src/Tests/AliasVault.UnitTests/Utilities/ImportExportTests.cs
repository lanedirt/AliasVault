//-----------------------------------------------------------------------
// <copyright file="ImportExportTests.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.UnitTests.Utilities;

using AliasClientDb;
using AliasVault.ImportExport;
using AliasVault.ImportExport.Importers;
using AliasVault.UnitTests.Common;

/// <summary>
/// Tests for the AliasVault.ImportExport class.
/// </summary>
public class ImportExportTests
{
    /// <summary>
    /// Test case for importing credentials from CSV and ensuring all values are present.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    public async Task ImportCredentialsFromCsv()
    {
        // Arrange
        var credential = new Credential
        {
            Id = new Guid("00000000-0000-0000-0000-000000000001"),
            Username = "testuser",
            Notes = "Test notes",
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now,
            AliasId = new Guid("00000000-0000-0000-0000-000000000002"),
            Alias = new Alias
            {
                Id = new Guid("00000000-0000-0000-0000-000000000002"),
                Gender = "Male",
                FirstName = "John",
                LastName = "Doe",
                NickName = "JD",
                BirthDate = new DateTime(1990, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                Email = "johndoe",
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
            },
            ServiceId = new Guid("00000000-0000-0000-0000-000000000003"),
            Service = new Service
            {
                Id = new Guid("00000000-0000-0000-0000-000000000003"),
                Name = "Test Service",
                Url = "https://testservice.com",
            },
            Passwords =
            [
                new Password
                {
                    Value = "password123",
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now,
                },
            ],
        };

        var csvContent = CredentialCsvService.ExportCredentialsToCsv([credential]);
        var csvString = System.Text.Encoding.Default.GetString(csvContent);

        // Act
        var importedCredentials = await CredentialCsvService.ImportCredentialsFromCsv(csvString);

        // Assert
        Assert.That(importedCredentials, Has.Count.EqualTo(1));

        var importedCredential = importedCredentials[0];

        Assert.Multiple(() =>
        {
            Assert.That(importedCredential.ServiceName, Is.EqualTo(credential.Service.Name));
            Assert.That(importedCredential.ServiceUrl, Is.EqualTo(credential.Service.Url));
            Assert.That(importedCredential.Username, Is.EqualTo(credential.Username));
            Assert.That(importedCredential.Notes, Is.EqualTo(credential.Notes));
            Assert.That(importedCredential.CreatedAt?.Date, Is.EqualTo(credential.CreatedAt.Date));
            Assert.That(importedCredential.UpdatedAt?.Date, Is.EqualTo(credential.UpdatedAt.Date));
            Assert.That(importedCredential.Alias!.Gender, Is.EqualTo(credential.Alias!.Gender));
            Assert.That(importedCredential.Alias!.FirstName, Is.EqualTo(credential.Alias!.FirstName));
            Assert.That(importedCredential.Alias!.LastName, Is.EqualTo(credential.Alias!.LastName));
            Assert.That(importedCredential.Alias!.NickName, Is.EqualTo(credential.Alias!.NickName));
            Assert.That(importedCredential.Alias!.BirthDate, Is.EqualTo(credential.Alias!.BirthDate));
            Assert.That(importedCredential.Alias!.CreatedAt?.Date, Is.EqualTo(credential.Alias!.CreatedAt.Date));
            Assert.That(importedCredential.Alias!.UpdatedAt?.Date, Is.EqualTo(credential.Alias!.UpdatedAt.Date));
            Assert.That(importedCredential.Password, Is.EqualTo(credential.Passwords.First().Value));
        });
    }

    /// <summary>
    /// Test case for importing credentials from Bitwarden CSV and ensuring all values are present.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    public async Task ImportCredentialsFromBitwardenCsv()
    {
        // Arrange
        var fileContent = await ResourceReaderUtility.ReadEmbeddedResourceStringAsync("AliasVault.UnitTests.TestData.Exports.bitwarden.csv");

        // Act
        var importedCredentials = await BitwardenImporter.ImportFromCsvAsync(fileContent);

        // Assert
        Assert.That(importedCredentials, Has.Count.EqualTo(5));

        // Test specific entries
        var tutaNotaCredential = importedCredentials.First(c => c.ServiceName == "TutaNota");
        Assert.Multiple(() =>
        {
            Assert.That(tutaNotaCredential.ServiceName, Is.EqualTo("TutaNota"));
            Assert.That(tutaNotaCredential.Username, Is.EqualTo("avtest2@tutamail.com"));
            Assert.That(tutaNotaCredential.Password, Is.EqualTo("blabla"));
            Assert.That(tutaNotaCredential.TwoFactorSecret, Is.EqualTo("otpauth://totp/Strongbox?secret=PLW4SB3PQ7MKVXY2MXF4NEXS6Y&algorithm=SHA1&digits=6&period=30"));
        });

        var aliasVaultCredential = importedCredentials.First(c => c.ServiceName == "Aliasvault.net");
        Assert.Multiple(() =>
        {
            Assert.That(aliasVaultCredential.ServiceName, Is.EqualTo("Aliasvault.net"));
            Assert.That(aliasVaultCredential.ServiceUrl, Is.EqualTo("https://www.aliasvault.net"));
            Assert.That(aliasVaultCredential.Username, Is.EqualTo("root"));
            Assert.That(aliasVaultCredential.Password, Is.EqualTo("toor"));
        });
    }

    /// <summary>
    /// Test case for importing credentials from KeePass CSV and ensuring all values are present.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    public async Task ImportCredentialsFromKeePassCsv()
    {
        // Arrange
        var fileContent = await ResourceReaderUtility.ReadEmbeddedResourceStringAsync("AliasVault.UnitTests.TestData.Exports.keepass.kdbx.csv");

        // Act
        var importedCredentials = await KeePassImporter.ImportFromCsvAsync(fileContent);

        // Assert
        Assert.That(importedCredentials, Has.Count.EqualTo(6));

        // Test specific entries
        var tutaNotaCredential = importedCredentials.First(c => c.ServiceName == "TutaNota");
        Assert.Multiple(() =>
        {
            Assert.That(tutaNotaCredential.ServiceName, Is.EqualTo("TutaNota"));
            Assert.That(tutaNotaCredential.Username, Is.EqualTo("avtest2@tutamail.com"));
            Assert.That(tutaNotaCredential.Password, Is.EqualTo("blabla"));
            Assert.That(tutaNotaCredential.TwoFactorSecret, Is.EqualTo("otpauth://totp/Strongbox?secret=PLW4SB3PQ7MKVXY2MXF4NEXS6Y&algorithm=SHA1&digits=6&period=30"));
            Assert.That(tutaNotaCredential.Notes, Does.Contain("Recovery code for main account"));
        });

        var sampleCredential = importedCredentials.First(c => c.ServiceName == "Sample");
        Assert.Multiple(() =>
        {
            Assert.That(sampleCredential.ServiceName, Is.EqualTo("Sample"));
            Assert.That(sampleCredential.ServiceUrl, Is.EqualTo("https://strongboxsafe.com"));
            Assert.That(sampleCredential.Username, Is.EqualTo("username"));
            Assert.That(sampleCredential.Password, Is.EqualTo("&3V_$z?Aiw-_x+nbYj"));
        });
    }

    /// <summary>
    /// Test case for importing credentials from 1Password CSV and ensuring all values are present.
    /// </summary>
    /// <returns>Async task.</returns>
    [Test]
    public async Task ImportCredentialsFrom1PasswordCsv()
    {
        // Arrange
        var fileContent = await ResourceReaderUtility.ReadEmbeddedResourceStringAsync("AliasVault.UnitTests.TestData.Exports.1password_8.csv");

        // Act
        var importedCredentials = await OnePasswordImporter.ImportFromCsvAsync(fileContent);

        // Assert
        Assert.That(importedCredentials, Has.Count.EqualTo(4));

        // Test specific entries
        var twoFactorCredential = importedCredentials.First(c => c.Username == "username2fa");
        Assert.Multiple(() =>
        {
            Assert.That(twoFactorCredential.ServiceName, Is.EqualTo("Test record 2 with 2FA"));
            Assert.That(twoFactorCredential.Username, Is.EqualTo("username2fa"));
            Assert.That(twoFactorCredential.Password, Is.EqualTo("password2fa"));
            Assert.That(twoFactorCredential.TwoFactorSecret, Is.EqualTo("otpauth://totp/Strongbox?secret=PLW4SB3PQ7MKVXY2MXF4NEXS6Y&period=30&algorithm=SHA1&digits=6"));
            Assert.That(twoFactorCredential.Notes, Is.EqualTo("Notes about 2FA record"));
        });

        var onePasswordAccount = importedCredentials.First(c => c.ServiceName == "1Password Account (dpatel)");
        Assert.Multiple(() =>
        {
            Assert.That(onePasswordAccount.ServiceName, Is.EqualTo("1Password Account (dpatel)"));
            Assert.That(onePasswordAccount.ServiceUrl, Is.EqualTo("https://my.1password.com"));
            Assert.That(onePasswordAccount.Username, Is.EqualTo("derekpatel@aliasvault.net"));
            Assert.That(onePasswordAccount.Password, Is.EqualTo("passwordexample"));
            Assert.That(onePasswordAccount.Notes, Is.EqualTo("You can use this login to sign in to your account on 1password.com."));
        });
    }
}
