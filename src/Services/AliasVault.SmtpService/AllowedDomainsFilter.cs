//-----------------------------------------------------------------------
// <copyright file="AllowedDomainsFilter.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.SmtpService;

using SmtpServer;
using SmtpServer.Mail;
using SmtpServer.Storage;

/// <summary>
/// Filter to allow only emails from configured domains.
/// </summary>
public class AllowedDomainsFilter(Config config, ILogger<AllowedDomainsFilter> logger) : IMailboxFilter, IMailboxFilterFactory
{
    private readonly TimeSpan _delay = TimeSpan.Zero;

    public async Task<bool> CanAcceptFromAsync(ISessionContext context, IMailbox from, int size, CancellationToken cancellationToken)
    {
        await Task.Delay(_delay, cancellationToken);
        return true;
    }

    public async Task<bool> CanDeliverToAsync(ISessionContext context, IMailbox to, IMailbox from, CancellationToken cancellationToken)
    {
        await Task.Delay(_delay, cancellationToken);

        if (!config.AllowedToDomains.Contains(to.Host.ToLowerInvariant()))
        {
            // ToAddress host is not allowed, return error to sender.
            logger.LogWarning("Email to {ToAddress} is not allowed", to);
            return false;
        }

        return true;
    }

    public IMailboxFilter CreateInstance(ISessionContext context)
    {
        return new AllowedDomainsFilter(context.ServiceProvider.GetRequiredService<Config>(), context.ServiceProvider.GetRequiredService<ILogger<AllowedDomainsFilter>>());
    }
}
