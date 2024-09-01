//-----------------------------------------------------------------------
// <copyright file="DataProtectionExtensions.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace Cryptography.Server;

using System.Security.Cryptography.X509Certificates;
using AliasServerDb;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Configuration;
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
        string certPassword = Environment.GetEnvironmentVariable("DATA_PROTECTION_CERT_PASS")
                              ?? throw new KeyNotFoundException("DATA_PROTECTION_CERT_PASS is not set in configuration or environment variables.");

        string certPath = "../../certificates/AliasVault.DataProtection.pfx";
        if (certPassword == "Development")
        {
            certPath = Path.Combine(AppContext.BaseDirectory, "AliasVault.DataProtection.Development.pfx");
        }

        X509Certificate2 cert;
        if (!File.Exists(certPath))
        {
            cert = CertificateGenerator.GeneratePfx("AliasVault.DataProtection", certPassword);
            CertificateGenerator.SaveCertificateToFile(cert, certPassword, certPath);
        }
        else
        {
            cert = new X509Certificate2(certPath, certPassword);
        }

        services.AddDataProtection()
            .ProtectKeysWithCertificate(cert)
            .PersistKeysToDbContext<AliasServerDbContext>()
            .SetApplicationName(applicationName);

        return services;
    }
}
