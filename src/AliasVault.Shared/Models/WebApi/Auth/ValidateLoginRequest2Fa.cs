//-----------------------------------------------------------------------
// <copyright file="ValidateLoginRequest2Fa.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.WebApi.Auth
{
    /// <summary>
    /// Represents a request to validate a login with added 2-factor authentication code.
    /// </summary>
    public class ValidateLoginRequest2Fa : ValidateLoginRequest
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="ValidateLoginRequest2Fa"/> class.
        /// </summary>
        /// <param name="username">Username.</param>
        /// <param name="clientPublicEphemeral">Client public ephemeral.</param>
        /// <param name="clientSessionProof">Client session proof.</param>
        /// <param name="code2Fa">2-factor authentication code.</param>
        public ValidateLoginRequest2Fa(string username, string clientPublicEphemeral, string clientSessionProof, string code2Fa)
            : base(username, clientPublicEphemeral, clientSessionProof)
        {
            Code2Fa = code2Fa;
        }

        /// <summary>
        /// Gets the 2-factor authentication code.
        /// </summary>
        public string Code2Fa { get; }
    }
}
