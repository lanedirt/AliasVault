//-----------------------------------------------------------------------
// <copyright file="StatisticsService.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Admin.Services;

using AliasServerDb;
using AliasVault.Admin.Main.Models;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// Service for gathering comprehensive server statistics and metrics.
/// </summary>
public class StatisticsService
{
    private readonly IAliasServerDbContextFactory _contextFactory;

    /// <summary>
    /// Initializes a new instance of the <see cref="StatisticsService"/> class.
    /// </summary>
    /// <param name="contextFactory">Database context factory.</param>
    public StatisticsService(IAliasServerDbContextFactory contextFactory)
    {
        _contextFactory = contextFactory;
    }

    /// <summary>
    /// Gets comprehensive server statistics including counts, storage metrics, and top users.
    /// </summary>
    /// <returns>Server statistics object.</returns>
    public async Task<ServerStatistics> GetServerStatisticsAsync()
    {
        var stats = new ServerStatistics();

        // Get basic counts in parallel
        var tasks = new[]
        {
            GetTotalUsersAsync(),
            GetTotalAliasesAsync(),
            GetTotalEmailsAsync(),
            GetTotalEmailAttachmentsAsync(),
        };

        var results = await Task.WhenAll(tasks);

        stats.TotalUsers = results[0];
        stats.TotalAliases = results[1];
        stats.TotalEmails = results[2];
        stats.TotalEmailAttachments = results[3];

        // Get top users data
        stats.TopUsersByStorage = await GetTopUsersByStorageAsync();
        stats.TopUsersByAliases = await GetTopUsersByAliasesAsync();
        stats.TopIpAddresses = await GetTopIpAddressesAsync();

        return stats;
    }

    /// <summary>
    /// Formats kilobytes into human-readable format.
    /// </summary>
    /// <param name="kilobytes">Number of kilobytes.</param>
    /// <returns>Formatted string (e.g., "1.5 MB").</returns>
    private static string FormatKilobytes(long kilobytes)
    {
        string[] suffixes = { "KB", "MB", "GB", "TB" };
        int counter = 0;
        decimal number = kilobytes;
        while (Math.Round(number / 1024) >= 1)
        {
            number /= 1024;
            counter++;
        }

        return $"{number:n1} {suffixes[counter]}";
    }

    /// <summary>
    /// Anonymizes the last octet of an IP address for privacy.
    /// </summary>
    /// <param name="ipAddress">The IP address to anonymize.</param>
    /// <returns>Anonymized IP address.</returns>
    private static string AnonymizeIpAddress(string ipAddress)
    {
        if (ipAddress == "x.x.x.x")
        {
            return ipAddress;
        }

        var parts = ipAddress.Split('.');
        if (parts.Length == 4)
        {
            return $"{parts[0]}.{parts[1]}.{parts[2]}.xxx";
        }

        // Handle IPv6 or other formats by masking the last segment
        var lastColonIndex = ipAddress.LastIndexOf(':');
        if (lastColonIndex > 0)
        {
            return ipAddress[..lastColonIndex] + ":xxx";
        }

        return "xxx.xxx.xxx.xxx";
    }

    /// <summary>
    /// Gets the total number of users.
    /// </summary>
    /// <returns>Total user count.</returns>
    private async Task<int> GetTotalUsersAsync()
    {
        await using var context = await _contextFactory.CreateDbContextAsync();
        return await context.AliasVaultUsers.CountAsync();
    }

    /// <summary>
    /// Gets the total number of email aliases created.
    /// </summary>
    /// <returns>Total alias count.</returns>
    private async Task<int> GetTotalAliasesAsync()
    {
        await using var context = await _contextFactory.CreateDbContextAsync();
        return await context.UserEmailClaims.CountAsync();
    }

    /// <summary>
    /// Gets the total number of emails stored.
    /// </summary>
    /// <returns>Total email count.</returns>
    private async Task<int> GetTotalEmailsAsync()
    {
        await using var context = await _contextFactory.CreateDbContextAsync();
        return await context.Emails.CountAsync();
    }

    /// <summary>
    /// Gets the total number of email attachments.
    /// </summary>
    /// <returns>Total email attachment count.</returns>
    private async Task<int> GetTotalEmailAttachmentsAsync()
    {
        await using var context = await _contextFactory.CreateDbContextAsync();
        return await context.EmailAttachments.CountAsync();
    }

    /// <summary>
    /// Gets the top 10 users by vault storage size.
    /// </summary>
    /// <returns>List of top users by storage.</returns>
    private async Task<List<TopUserByStorage>> GetTopUsersByStorageAsync()
    {
        await using var context = await _contextFactory.CreateDbContextAsync();

        // Get the latest vault for each user with their total storage
        var topUsers = await context.Vaults
            .GroupBy(v => v.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                Username = g.First().User.UserName,
                TotalStorageBytes = g.OrderByDescending(v => v.Version).First().FileSize,
            })
            .OrderByDescending(u => u.TotalStorageBytes)
            .Take(10)
            .ToListAsync();

        return topUsers.Select(u => new TopUserByStorage
        {
            UserId = u.UserId,
            Username = u.Username ?? "Unknown",
            StorageBytes = u.TotalStorageBytes,
            StorageDisplaySize = FormatKilobytes(u.TotalStorageBytes),
        }).ToList();
    }

    /// <summary>
    /// Gets the top 10 users by number of email aliases.
    /// </summary>
    /// <returns>List of top users by aliases.</returns>
    private async Task<List<TopUserByAliases>> GetTopUsersByAliasesAsync()
    {
        await using var context = await _contextFactory.CreateDbContextAsync();
        var topUsers = await context.UserEmailClaims
            .Where(uec => uec.UserId != null)
            .GroupBy(uec => uec.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                Username = g.First().User!.UserName,
                AliasCount = g.Count(),
            })
            .OrderByDescending(u => u.AliasCount)
            .Take(10)
            .ToListAsync();

        return topUsers.Select(u => new TopUserByAliases
        {
            UserId = u.UserId!,
            Username = u.Username ?? "Unknown",
            AliasCount = u.AliasCount,
        }).ToList();
    }

    /// <summary>
    /// Gets the top 10 IP address ranges by number of associated user accounts.
    /// Only includes non-anonymized IPs (not "xxx.xxx.xxx.xxx").
    /// </summary>
    /// <returns>List of top IP addresses.</returns>
    private async Task<List<TopIpAddress>> GetTopIpAddressesAsync()
    {
        await using var context = await _contextFactory.CreateDbContextAsync();

        // Get distinct IP addresses from successful auth logs only, excluding fully anonymized ones
        var ipStats = await context.AuthLogs
            .Where(al => al.IpAddress != null && al.IpAddress != "xxx.xxx.xxx.xxx" && al.IsSuccess)
            .GroupBy(al => al.IpAddress)
            .Select(g => new
            {
                IpAddress = g.Key,
                UniqueUsernames = g.Where(al => al.IsSuccess).Select(al => al.Username).Distinct().Count(),
                LastActivity = g.Max(al => al.Timestamp),
            })
            .OrderByDescending(ip => ip.UniqueUsernames)
            .Take(10)
            .ToListAsync();

        return ipStats.Select(ip => new TopIpAddress
        {
            OriginalIpAddress = ip.IpAddress!,
            IpAddress = AnonymizeIpAddress(ip.IpAddress!),
            UniqueUserCount = ip.UniqueUsernames,
            LastActivity = ip.LastActivity,
        }).ToList();
    }
}
