//-----------------------------------------------------------------------
// <copyright file="ValidateLoginRequest.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.WebApi.Auth
{
    /// <summary>
    /// Represents a request to validate a login.
    /// </summary>
    public class ValidateLoginRequest
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="ValidateLoginRequest"/> class.
        /// </summary>
        /// <param name="username">Username.</param>
        /// <param name="clientPublicEphemeral">Client public ephemeral.</param>
        /// <param name="clientSessionProof">Client session proof.</param>
        public ValidateLoginRequest(string username, string clientPublicEphemeral, string clientSessionProof)
        {
            Username = username.ToLowerInvariant().Trim();
            ClientPublicEphemeral = clientPublicEphemeral;
            ClientSessionProof = clientSessionProof;
        }

        /// <summary>
        /// Gets the username.
        /// </summary>
        public string Username { get; }

        /// <summary>
        /// Gets the client's public ephemeral value.
        /// </summary>
        public string ClientPublicEphemeral { get; }

        /// <summary>
        /// Gets the client's session proof.
        /// </summary>
        public string ClientSessionProof { get; }
    }
}
