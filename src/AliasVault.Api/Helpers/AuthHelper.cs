//-----------------------------------------------------------------------
// <copyright file="AuthHelper.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Api.Helpers;

using AliasServerDb;
using Cryptography.Client;
using Microsoft.Extensions.Caching.Memory;
using SecureRemotePassword;

/// <summary>
/// AuthHelper class.
/// </summary>
public static class AuthHelper
{
    /// <summary>
    /// Cache prefix for storing generated login ephemeral.
    /// </summary>
    public static readonly string CachePrefixEphemeral = "LoginEphemeral_";

    /// <summary>
    /// Helper method that validates the SRP session based on provided username, ephemeral and proof.
    /// </summary>
    /// <param name="cache">IMemoryCache instance.</param>
    /// <param name="user">The user object.</param>
    /// <param name="clientEphemeral">The client ephemeral value.</param>
    /// <param name="clientSessionProof">The client session proof.</param>
    /// <returns>Tuple.</returns>
    public static SrpSession? ValidateSrpSession(IMemoryCache cache, AliasVaultUser user, string clientEphemeral, string clientSessionProof)
    {
        if (!cache.TryGetValue(CachePrefixEphemeral + user.UserName, out var serverSecretEphemeral) || serverSecretEphemeral is not string)
        {
            return null;
        }

        // Retrieve latest vault of user which contains the current salt and verifier.
        var latestVaultEncryptionSettings = GetUserLatestVaultEncryptionSettings(user);

        var serverSession = Srp.DeriveSessionServer(
            serverSecretEphemeral.ToString() ?? string.Empty,
            clientEphemeral,
            latestVaultEncryptionSettings.Salt,
            user.UserName ?? string.Empty,
            latestVaultEncryptionSettings.Verifier,
            clientSessionProof);

        if (serverSession is null)
        {
            return null;
        }

        return serverSession;
    }

    /// <summary>
    /// Get the user's latest vault which contains the current salt and verifier.
    /// </summary>
    /// <param name="user">User object.</param>
    /// <returns>Tuple with salt, verifier, encryption type and encryption settings.</returns>
    public static (string Salt, string Verifier, string EncryptionType, string EncryptionSettings) GetUserLatestVaultEncryptionSettings(AliasVaultUser user)
    {
        // Retrieve latest vault of user which contains the encryption settings.
        var latestVault = user.Vaults.OrderByDescending(x => x.UpdatedAt).Select(x => new { x.Salt, x.Verifier, x.EncryptionType, x.EncryptionSettings }).First();
        return (latestVault.Salt, latestVault.Verifier, latestVault.EncryptionType, latestVault.EncryptionSettings);
    }
}
