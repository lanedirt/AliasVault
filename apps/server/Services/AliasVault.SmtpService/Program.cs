//-----------------------------------------------------------------------
// <copyright file="Program.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

using System.Globalization;
using System.Reflection;
using System.Security.Cryptography.X509Certificates;
using AliasServerDb;
using AliasServerDb.Configuration;
using AliasVault.Logging;
using AliasVault.SmtpService;
using AliasVault.SmtpService.Handlers;
using AliasVault.SmtpService.Workers;
using AliasVault.WorkerStatus.ServiceExtensions;
using Microsoft.EntityFrameworkCore;
using SmtpServer;
using SmtpServer.Storage;

var builder = Host.CreateApplicationBuilder(args);

// Force invariant culture to prevent regional date formatting issues
// (e.g., times should be formatted as "09:03:09" instead of alternate region formats like "09.03.09").
CultureInfo.DefaultThreadCurrentCulture = CultureInfo.InvariantCulture;
CultureInfo.DefaultThreadCurrentUICulture = CultureInfo.InvariantCulture;

builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
builder.Configuration.AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true);
builder.Services.ConfigureLogging(builder.Configuration, Assembly.GetExecutingAssembly().GetName().Name!, "../../../logs");

// Create global config object, get values from environment variables.
Config config = new Config();
var emailDomains = Environment.GetEnvironmentVariable("PRIVATE_EMAIL_DOMAINS") ?? string.Empty;
config.AllowedToDomains = emailDomains.Split(',').ToList();

var tlsEnabled = Environment.GetEnvironmentVariable("SMTP_TLS_ENABLED") ?? "false";
config.SmtpTlsEnabled = tlsEnabled;
builder.Services.AddSingleton(config);

builder.Services.AddAliasVaultDatabaseConfiguration(builder.Configuration);
builder.Services.AddTransient<IMessageStore, DatabaseMessageStore>();
builder.Services.AddSingleton(
    provider =>
    {
        var options = new SmtpServerOptionsBuilder()
            .ServerName("aliasvault");

        if (config.SmtpTlsEnabled == "true")
        {
            // With TLS and certificate support.
            options.Endpoint(serverBuilder =>
                    serverBuilder
                        .Port(25, false)
                        .AllowUnsecureAuthentication()
                        .Certificate(CreateCertificate())
                        .SupportedSslProtocols(System.Security.Authentication.SslProtocols.Tls12))
                .Endpoint(serverBuilder =>
                    serverBuilder
                        .Port(587, false)
                        .AllowUnsecureAuthentication()
                        .Certificate(CreateCertificate())
                        .SupportedSslProtocols(System.Security.Authentication.SslProtocols.Tls12));
        }
        else
        {
            // No TLS
            options.Endpoint(serverBuilder =>
                    serverBuilder
                        .Port(25, false))
                .Endpoint(serverBuilder =>
                    serverBuilder
                        .Port(587, false));
        }

        return new SmtpServer.SmtpServer(options.Build(), provider.GetRequiredService<IServiceProvider>());

        static X509Certificate2 CreateCertificate()
        {
            // Specify the directory where PEM files are stored.
            string certificatesDirectory = "Certificates";

            // Get all PEM files in the directory.
            string[] pemFiles = Directory.GetFiles(certificatesDirectory, "*.pem");

            // Check if there are any PEM files found.
            if (pemFiles.Length == 0)
            {
                throw new FileNotFoundException("No PEM files found in the specified directory.");
            }

            // Use the first PEM file found
            string firstPemFile = pemFiles[0];

            // Create an X509Certificate2 object from the PEM file.
            var cert = X509Certificate2.CreateFromPemFile(firstPemFile);

            // Convert the X509Certificate2 object to a PFX file then immediately load it again
            // NOTE: this is important because saving the object to a PFX file to disk for a brief
            // second will allow Windows to correctly load the certificate with the private key.
            // If we don't do this, the certificate will be loaded without the private key and
            // will throw error on Windows:
            // "The TLS server credential's certificate does not have a private key information property attached to it"
            var certBytes = cert.Export(X509ContentType.Pfx, "password");
            return X509CertificateLoader.LoadPkcs12(certBytes, "password", X509KeyStorageFlags.DefaultKeySet);
        }
    });

// -----------------------------------------------------------------------
// Register hosted services via Status library wrapper in order to monitor and control (start/stop) them via the database.
// -----------------------------------------------------------------------
builder.Services.AddStatusHostedService<SmtpServerWorker, AliasServerDbContext>(Assembly.GetExecutingAssembly().GetName().Name!);

var host = builder.Build();

using (var scope = host.Services.CreateScope())
{
    var container = scope.ServiceProvider;
    var factory = container.GetRequiredService<IAliasServerDbContextFactory>();
    await using var context = await factory.CreateDbContextAsync();
    await context.Database.MigrateAsync();
}

await host.RunAsync();
