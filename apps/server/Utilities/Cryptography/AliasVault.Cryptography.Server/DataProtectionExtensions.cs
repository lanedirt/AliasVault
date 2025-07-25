//-----------------------------------------------------------------------
// <copyright file="DataProtectionExtensions.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Cryptography.Server;

using System.Security.Cryptography.X509Certificates;
using AliasServerDb;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.DependencyInjection;

/// <summary>
/// Helper utility to configure DataProtection for web projects.
/// </summary>
public static class DataProtectionExtensions
{
    /// <summary>
    /// Setup .NET DataProtection to use common AliasVault settings.
    /// </summary>
    /// <param name="services">Services.</param>
    /// <param name="applicationName">Application name.</param>
    /// <returns>IServiceCollection.</returns>
    /// <exception cref="KeyNotFoundException">Thrown if environment variable is not set.</exception>
    public static IServiceCollection AddAliasVaultDataProtection(
        this IServiceCollection services,
        string applicationName)
    {
        var certPassword = Environment.GetEnvironmentVariable("DATA_PROTECTION_CERT_PASS")
                              ?? throw new KeyNotFoundException("DATA_PROTECTION_CERT_PASS is not set in configuration or environment variables.");
        var certPath = $"../../certificates/app/{applicationName}.DataProtection.pfx";
        if (certPassword == "Development")
        {
            certPath = Path.Combine(AppContext.BaseDirectory, $"{applicationName}.DataProtection.Development.pfx");
        }

        // Use different protection methods for containerized environments
        var isContainer = Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true" ||
                         Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Production";

        var dataProtectionBuilder = services.AddDataProtection()
            .PersistKeysToDbContext<AliasServerDbContext>()
            .SetApplicationName(applicationName);

        if (isContainer)
        {
            // When running in containers, don't use certificate-based key protection due to Linux keystore limitations
            // Keys are protected by database access controls, TLS, and container isolation
            dataProtectionBuilder
                .UseCryptographicAlgorithms(new Microsoft.AspNetCore.DataProtection.AuthenticatedEncryption.ConfigurationModel.AuthenticatedEncryptorConfiguration()
                {
                    EncryptionAlgorithm = Microsoft.AspNetCore.DataProtection.AuthenticatedEncryption.EncryptionAlgorithm.AES_256_CBC,
                    ValidationAlgorithm = Microsoft.AspNetCore.DataProtection.AuthenticatedEncryption.ValidationAlgorithm.HMACSHA256,
                })
                .SetDefaultKeyLifetime(TimeSpan.FromDays(90));
        }
        else
        {
            // Use certificate-based protection for development
            var certificateFlags = X509KeyStorageFlags.MachineKeySet | X509KeyStorageFlags.PersistKeySet | X509KeyStorageFlags.Exportable;

            X509Certificate2 cert;
            if (!File.Exists(certPath))
            {
                cert = CertificateGenerator.GeneratePfx($"{applicationName}.DataProtection", certPassword);
                CertificateGenerator.SaveCertificateToFile(cert, certPassword, certPath);
            }
            else
            {
                cert = X509CertificateLoader.LoadPkcs12FromFile(certPath, certPassword, certificateFlags);
            }

            dataProtectionBuilder.ProtectKeysWithCertificate(cert);
        }

        return services;
    }
}
