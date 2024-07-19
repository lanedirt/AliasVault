//-----------------------------------------------------------------------
// <copyright file="Program.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

using System.Data.Common;
using AliasVault.SmtpService;
using SmtpServer;
using System.Security.Cryptography.X509Certificates;
using AliasServerDb;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SmtpServer.Storage;

var builder = Host.CreateApplicationBuilder(args);

// Create global config object, get values from environment variables.
Config config = new Config();
var emailDomains = Environment.GetEnvironmentVariable("SMTP_ALLOWED_DOMAINS")
                   ?? throw new KeyNotFoundException("SMTP_ALLOWED_DOMAINS environment variable is not set.");
config.AllowedToDomains = emailDomains.Split(',').ToList();

var tlsEnabled = Environment.GetEnvironmentVariable("SMTP_TLS_ENABLED")
                 ?? throw new KeyNotFoundException("SMTP_TLS_ENABLED environment variable is not set.");
config.SmtpTlsEnabled = tlsEnabled;
builder.Services.AddSingleton(config);

builder.Services.AddSingleton<DbConnection>(container =>
{
    var configFile = new ConfigurationBuilder()
        .SetBasePath(Directory.GetCurrentDirectory())
        .AddJsonFile("appsettings.json")
        .Build();

    var connection = new SqliteConnection(configFile.GetConnectionString("AliasServerDbContext"));
    connection.Open();

    return connection;
});

builder.Services.AddDbContextFactory<AliasServerDbContext>((container, options) =>
{
    var connection = container.GetRequiredService<DbConnection>();
    options.UseSqlite(connection).UseLazyLoadingProxies();
});

builder.Services.AddTransient<IMessageStore, DatabaseMessageStore>();
builder.Services.AddTransient<IMailboxFilter, AllowedDomainsFilter>();

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
                        .SupportedSslProtocols(System.Security.Authentication.SslProtocols.Tls12)
                );
        }
        else
        {
            // No TLS
            options.Endpoint(serverBuilder =>
                    serverBuilder
                        .Port(25, false))
                .Endpoint(serverBuilder =>
                    serverBuilder
                        .Port(587, false)
                );
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
            cert = new X509Certificate2(cert.Export(X509ContentType.Pfx));

            return cert;
        }
    }
);

builder.Services.AddHostedService<Worker>();
var host = builder.Build();

using (var scope = host.Services.CreateScope())
{
    var container = scope.ServiceProvider;
    var db = container.GetRequiredService<AliasServerDbContext>();

    await db.Database.MigrateAsync();
}

await host.RunAsync();
