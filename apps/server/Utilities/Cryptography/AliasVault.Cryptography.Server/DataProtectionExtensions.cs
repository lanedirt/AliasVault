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
    /// Setup .NET DataProtection to use common AliasVault settings with self-signed certificate.
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

        var certificateFlags = X509KeyStorageFlags.MachineKeySet |
                              X509KeyStorageFlags.PersistKeySet |
                              X509KeyStorageFlags.Exportable;

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

        services.AddDataProtection()
            .PersistKeysToDbContext<AliasServerDbContext>()
            .ProtectKeysWithCertificate(cert)
            .SetApplicationName(applicationName);

        return services;
    }
}
