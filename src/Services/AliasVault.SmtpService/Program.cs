//-----------------------------------------------------------------------
// <copyright file="Program.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

using AliasVault.SmtpService;
using SmtpServer;
using System.Security.Cryptography.X509Certificates;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.AddHostedService<Worker>();

// Read settings from appsettings.json.
ConfigurationManager configuration = builder.Configuration;
Config config = configuration.GetSection("Config").Get<Config>()!;
builder.Services.AddSingleton(config);

builder.Services.AddSingleton(
    provider =>
    {
        var options = new SmtpServerOptionsBuilder()
            .ServerName("aliasvault");

        if (config.SmtpTlsEnabled == "true")
        {
            // With TLS and certificate support.
            options.Endpoint(builder =>
                    builder
                        .Port(25, false)
                        .AllowUnsecureAuthentication(true)
                        .Certificate(CreateCertificate())
                        .SupportedSslProtocols(System.Security.Authentication.SslProtocols.Tls12))
                .Endpoint(builder =>
                    builder
                        .Port(587, false)
                        .AllowUnsecureAuthentication(true)
                        .Certificate(CreateCertificate())
                        .SupportedSslProtocols(System.Security.Authentication.SslProtocols.Tls12)
                );
        }
        else
        {
            // No TLS
            options.Endpoint(builder =>
                    builder
                        .Port(25, false))
                .Endpoint(builder =>
                    builder
                        .Port(587, false)
                );
        }

        /// <summary>
        /// Helper method to create an X509Certificate2 object from a PEM file.
        /// </summary>
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

        return new SmtpServer.SmtpServer(options.Build(), provider.GetRequiredService<IServiceProvider>());
    }
);

var host = builder.Build();
await host.RunAsync();
