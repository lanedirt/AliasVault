//-----------------------------------------------------------------------
// <copyright file="WebApplicationAdminFactoryFixture.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Infrastructure;

using AliasVault.Admin.Services;
using AliasVault.E2ETests.Infrastructure.Abstracts;
using Microsoft.Extensions.DependencyInjection;

/// <summary>
/// Admin web application factory fixture for integration tests.
/// </summary>
/// <typeparam name="TEntryPoint">The entry point.</typeparam>
public class WebApplicationAdminFactoryFixture<TEntryPoint> : WebApplicationFactoryFixture<TEntryPoint>
    where TEntryPoint : class
{
    /// <summary>
    /// Gets or sets the port the web application kestrel host will listen on.
    /// </summary>
    public override int Port { get; set; } = 5003;

    /// <summary>
    /// Removes existing service registrations.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection"/> to modify.</param>
    protected override void RemoveExistingRegistrations(IServiceCollection services)
    {
        var descriptorsToRemove = services.Where(d =>
            d.ServiceType == typeof(VersionedContentService)).ToList();

        foreach (var descriptor in descriptorsToRemove)
        {
            services.Remove(descriptor);
        }
    }

    /// <summary>
    /// Adds new service registrations.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection"/> to modify.</param>
    protected override void AddNewRegistrations(IServiceCollection services)
    {
        // Add the VersionedContentService
        services.AddSingleton(new VersionedContentService("../../../../../AliasVault.Admin/wwwroot"));

        // Configure ServerSideBlazor with detailed errors
        services.AddServerSideBlazor()
            .AddCircuitOptions(options => options.DetailedErrors = true);
    }
}
