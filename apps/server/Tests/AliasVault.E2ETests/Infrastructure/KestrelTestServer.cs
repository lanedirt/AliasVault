//-----------------------------------------------------------------------
// <copyright file="KestrelTestServer.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.E2ETests.Infrastructure;

using Microsoft.AspNetCore.Connections;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

/// <summary>
/// A <see cref="TestServer"/> that uses Kestrel as the server.
/// </summary>
public class KestrelTestServer : TestServer, IServer
{
    private readonly KestrelServer _server;

    /// <summary>
    /// Initializes a new instance of the <see cref="KestrelTestServer"/> class.
    /// </summary>
    /// <param name="serviceProvider">The <see cref="IServiceProvider"/> to use.</param>
    public KestrelTestServer(IServiceProvider serviceProvider)
        : base(serviceProvider)
    {
        // We get all the transport factories registered, and the first one is the correct one
        // Getting the IConnectionListenerFactory directly from the service provider does not work
        var transportFactory = serviceProvider.GetRequiredService<IEnumerable<IConnectionListenerFactory>>().First();

        var kestrelOptions = serviceProvider.GetRequiredService<IOptions<KestrelServerOptions>>();
        var loggerFactory = serviceProvider.GetRequiredService<ILoggerFactory>();
        _server = new KestrelServer(kestrelOptions, transportFactory, loggerFactory);
    }

    /// <inheritdoc />
    async Task IServer.StartAsync<TContext>(IHttpApplication<TContext> application, CancellationToken cancellationToken)
    {
        // We need to also invoke the TestServer's StartAsync method to ensure that the test server is started
        // Because the TestServer's StartAsync method is implemented explicitly, we need to use reflection to invoke it
        await InvokeExplicitInterfaceMethod(nameof(IServer.StartAsync), typeof(TContext), [application, cancellationToken]);

        // We also start the Kestrel server in order for localhost to work
        await _server.StartAsync(application, cancellationToken);
    }

    /// <inheritdoc />
    async Task IServer.StopAsync(CancellationToken cancellationToken)
    {
        await InvokeExplicitInterfaceMethod(nameof(IServer.StopAsync), null, [cancellationToken]);
        await _server.StopAsync(cancellationToken);
    }

    private Task InvokeExplicitInterfaceMethod(string methodName, Type? genericParameter, object[] args)
    {
        var baseMethod = typeof(TestServer).GetInterfaceMap(typeof(IServer)).TargetMethods.First(m => m.Name.EndsWith(methodName));
        var method = genericParameter == null ? baseMethod : baseMethod.MakeGenericMethod(genericParameter);
        var task = method.Invoke(this, args) as Task ?? throw new InvalidOperationException("Task not returned");
        return task;
    }
}
