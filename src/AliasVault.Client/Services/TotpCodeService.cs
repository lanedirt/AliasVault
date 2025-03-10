//-----------------------------------------------------------------------
// <copyright file="TotpCodeService.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Services;

using AliasClientDb;
using AliasVault.Client.Services.Database;
using AliasVault.TotpGenerator;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// Service for managing TOTP codes.
/// </summary>
public class TotpCodeService
{
    private readonly DbService _dbService;
    private readonly ILogger<TotpCodeService> _logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="TotpCodeService"/> class.
    /// </summary>
    /// <param name="dbService">The database service.</param>
    /// <param name="logger">The logger.</param>
    public TotpCodeService(DbService dbService, ILogger<TotpCodeService> logger)
    {
        _dbService = dbService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all TOTP codes for a credential.
    /// </summary>
    /// <param name="credentialId">The credential ID.</param>
    /// <returns>A list of TOTP codes.</returns>
    public async Task<List<TotpCode>> GetTotpCodesAsync(Guid credentialId)
    {
        try
        {
            var dbContext = await _dbService.GetDbContextAsync();
            return await dbContext.TotpCodes
                .Where(t => t.CredentialId == credentialId)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting TOTP codes for credential {CredentialId}", credentialId);
            return new List<TotpCode>();
        }
    }

    /// <summary>
    /// Adds a new TOTP code.
    /// </summary>
    /// <param name="totpCode">The TOTP code to add.</param>
    /// <returns>The added TOTP code.</returns>
    public async Task<TotpCode?> AddTotpCodeAsync(TotpCode totpCode)
    {
        try
        {
            var dbContext = await _dbService.GetDbContextAsync();
            dbContext.TotpCodes.Add(totpCode);
            await dbContext.SaveChangesAsync();
            return totpCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding TOTP code for credential {CredentialId}", totpCode.CredentialId);
            return null;
        }
    }

    /// <summary>
    /// Deletes a TOTP code.
    /// </summary>
    /// <param name="totpCodeId">The TOTP code ID.</param>
    /// <returns>True if the TOTP code was deleted, false otherwise.</returns>
    public async Task<bool> DeleteTotpCodeAsync(Guid totpCodeId)
    {
        try
        {
            var dbContext = await _dbService.GetDbContextAsync();
            var totpCode = await dbContext.TotpCodes.FindAsync(totpCodeId);
            if (totpCode == null)
            {
                return false;
            }

            dbContext.TotpCodes.Remove(totpCode);
            await dbContext.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting TOTP code {TotpCodeId}", totpCodeId);
            return false;
        }
    }

    /// <summary>
    /// Generates a TOTP code for a given secret key.
    /// </summary>
    /// <param name="secretKey">The secret key.</param>
    /// <returns>The generated TOTP code.</returns>
    public string GenerateTotpCode(string secretKey)
    {
        return TotpGenerator.GenerateTotpCode(secretKey);
    }

    /// <summary>
    /// Gets the remaining seconds until the TOTP code expires.
    /// </summary>
    /// <param name="step">The time step in seconds. Default is 30.</param>
    /// <returns>The remaining seconds.</returns>
    public int GetRemainingSeconds(int step = 30)
    {
        var unixTimestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        return step - (int)(unixTimestamp % step);
    }
}
