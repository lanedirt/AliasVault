//-----------------------------------------------------------------------
// <copyright file="RegisterModel.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.WebApi.Auth;

/// <summary>
/// This class represents the model for registering a new user
/// using SRP (Secure Remote Password) protocol.
/// </summary>
public class RegisterModel
{
    /// <summary>
    /// Initializes a new instance of the <see cref="RegisterModel"/> class.
    /// </summary>
    /// <param name="email">Email.</param>
    /// <param name="salt">Salt.</param>
    /// <param name="verifier">Verifier.</param>
    public RegisterModel(string email, string salt, string verifier)
    {
        Email = email;
        Salt = salt;
        Verifier = verifier;
    }

    /// <summary>
    /// Gets or sets the email.
    /// </summary>
    public string Email { get; set; }

    /// <summary>
    /// Gets or sets the salt.
    /// </summary>
    public string Salt { get; set; }

    /// <summary>
    /// Gets or sets the verifier.
    /// </summary>
    public string Verifier { get; set; }
}
