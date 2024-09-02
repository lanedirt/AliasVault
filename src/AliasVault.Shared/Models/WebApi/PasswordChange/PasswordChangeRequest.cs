//-----------------------------------------------------------------------
// <copyright file="PasswordChangeRequest.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.WebApi.PasswordChange;

/// <summary>
/// Represents a request to initiate a password change.
/// </summary>
public class PasswordChangeRequest
{
    /// <summary>
    /// Initializes a new instance of the <see cref="PasswordChangeRequest"/> class.
    /// </summary>
    /// <param name="currentClientPublicEphemeral">Client public ephemeral.</param>
    /// <param name="currentClientSessionProof">Client session proof.</param>
    /// <param name="newPasswordSalt">New password salt.</param>
    /// <param name="newPasswordVerifier">New password verifier.</param>
    public PasswordChangeRequest(string currentClientPublicEphemeral, string currentClientSessionProof, string newPasswordSalt, string newPasswordVerifier)
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
