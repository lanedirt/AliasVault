//-----------------------------------------------------------------------
// <copyright file="PasswordChangeResponse.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.WebApi.PasswordChange
{
    /// <summary>
    /// Represents a response to initiate a password change.
    /// </summary>
    public class PasswordChangeResponse
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="PasswordChangeResponse"/> class.
        /// </summary>
        /// <param name="newSalt">New salt.</param>
        /// <param name="currentPasswordServerProof">Current password server proof.</param>
        public PasswordChangeResponse(string newSalt, string currentPasswordServerProof)
        {
            NewSalt = newSalt;
            CurrentPasswordServerProof = currentPasswordServerProof;
        }

        /// <summary>
        /// Gets or sets the new salt for the new password.
        /// </summary>
        public string NewSalt { get; set; }

        /// <summary>
        /// Gets or sets the server's proof for the current password verification.
        /// </summary>
        public string CurrentPasswordServerProof { get; set; }
    }
}
