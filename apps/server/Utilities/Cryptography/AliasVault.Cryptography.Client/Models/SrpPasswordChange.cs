//-----------------------------------------------------------------------
// <copyright file="SrpPasswordChange.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Cryptography.Client.Models;

/// <summary>
/// Represents the data required for signing up or changing password with the Secure Remote Password (SRP) protocol.
/// </summary>
public class SrpPasswordChange
{
    /// <summary>
    /// Initializes a new instance of the <see cref="SrpPasswordChange"/> class with the specified salt, private key, and verifier.
    /// </summary>
    /// <param name="username">The username.</param>
    /// <param name="salt">The salt value.</param>
    /// <param name="privateKey">The private key value.</param>
    /// <param name="verifier">The verifier value.</param>
    public SrpPasswordChange(string username, string salt, string privateKey, string verifier)
    {
        Username = username.ToLowerInvariant().Trim();
        Salt = salt;
        PrivateKey = privateKey;
        Verifier = verifier;
    }

    /// <summary>
    /// Gets the username value.
    /// </summary>
    public string Username { get; }

    /// <summary>
    /// Gets the salt value.
    /// </summary>
    public string Salt { get; }

    /// <summary>
    /// Gets the private key value.
    /// </summary>
    public string PrivateKey { get; }

    /// <summary>
    /// Gets the verifier value.
    /// </summary>
    public string Verifier { get; }
}
