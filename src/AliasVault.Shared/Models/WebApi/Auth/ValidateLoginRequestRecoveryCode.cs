//-----------------------------------------------------------------------
// <copyright file="ValidateLoginRequestRecoveryCode.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.WebApi.Auth
{
    /// <summary>
    /// Represents a request to validate a login with added 2-factor authentication code.
    /// </summary>
    public class ValidateLoginRequestRecoveryCode : ValidateLoginRequest
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="ValidateLoginRequestRecoveryCode"/> class.
        /// </summary>
        /// <param name="username">Username.</param>
        /// <param name="clientPublicEphemeral">Client public ephemeral.</param>
        /// <param name="clientSessionProof">Client session proof.</param>
        /// <param name="recoveryCode">2-factor recovery code.</param>
        public ValidateLoginRequestRecoveryCode(string username, string clientPublicEphemeral, string clientSessionProof, string recoveryCode)
            : base(username, clientPublicEphemeral, clientSessionProof)
        {
            RecoveryCode = recoveryCode;
        }

        /// <summary>
        /// Gets the 2-factor authentication recovery code.
        /// </summary>
        public string RecoveryCode { get; }
    }
}
