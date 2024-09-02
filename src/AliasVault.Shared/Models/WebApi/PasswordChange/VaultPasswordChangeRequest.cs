//-----------------------------------------------------------------------
// <copyright file="VaultPasswordChangeRequest.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.WebApi.PasswordChange;

/// <summary>
/// Represents a request to change the users password including a new vault that is encrypted with the new password.
/// </summary>
public class VaultPasswordChangeRequest : Vault
{
    /// <summary>
    /// Initializes a new instance of the <see cref="VaultPasswordChangeRequest"/> class.
    /// </summary>
    /// <param name="blob">Blob.</param>
    /// <param name="version">Version of the vault data model (migration).</param>
    /// <param name="createdAt">CreatedAt.</param>
    /// <param name="updatedAt">UpdatedAt.</param>
    /// <param name="currentClientPublicEphemeral">Client public ephemeral.</param>
    /// <param name="currentClientSessionProof">Client session proof.</param>
    /// <param name="newPasswordSalt">New password salt.</param>
    /// <param name="newPasswordVerifier">New password verifier.</param>
    public VaultPasswordChangeRequest(
        string blob,
        string version,
        DateTime createdAt,
        DateTime updatedAt,
        string currentClientPublicEphemeral,
        string currentClientSessionProof,
        string newPasswordSalt,
        string newPasswordVerifier)
    : base(blob, version, string.Empty, new List<string>(), createdAt, updatedAt)
    {
        CurrentClientPublicEphemeral = currentClientPublicEphemeral;
        CurrentClientSessionProof = currentClientSessionProof;
        NewPasswordSalt = newPasswordSalt;
        NewPasswordVerifier = newPasswordVerifier;
    }

    /// <summary>
    /// Gets or sets the client's public ephemeral for the current password verification.
    /// </summary>
    public string CurrentClientPublicEphemeral { get; set; }

    /// <summary>
    /// Gets or sets the client's session proof for the current password verification.
    /// </summary>
    public string CurrentClientSessionProof { get; set; }

    /// <summary>
    /// Gets or sets the new password salt.
    /// </summary>
    public string NewPasswordSalt { get; set; }

    /// <summary>
    /// Gets or sets the new password verifier.
    /// </summary>
    public string NewPasswordVerifier { get; set; }
}
