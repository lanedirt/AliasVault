//-----------------------------------------------------------------------
// <copyright file="ValidateLoginResponse.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

using System.Text.Json.Serialization;

namespace AliasVault.Shared.Models.WebApi.Auth
{
    /// <summary>
    /// Represents a request to validate a login.
    /// </summary>
    public class ValidateLoginResponse
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="ValidateLoginResponse"/> class.
        /// </summary>
        /// <param name="serverSessionProof">Client session proof.</param>
        /// <param name="token">Token model.</param>
        public ValidateLoginResponse(string serverSessionProof, TokenModel token)
        {
            ServerSessionProof = serverSessionProof;
            Token = token;
        }

        /// <summary>
        /// Gets or sets the server's session proof.
        /// </summary>
        [JsonPropertyName("serverSessionProof")]
        public string ServerSessionProof { get; set; }

        /// <summary>
        /// Gets or sets the JWT and refresh token.
        /// </summary>
        [JsonPropertyName("token")]
        public TokenModel Token { get; set; }
    }
}
