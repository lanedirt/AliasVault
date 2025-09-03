//-----------------------------------------------------------------------
// <copyright file="EmailHelper.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Api.Helpers;

/// <summary>
/// EmailHelper class which contains helper methods for email.
/// </summary>
public static class EmailHelper
{
    /// <summary>
    /// Sanitize email address by trimming and converting to lowercase.
    /// </summary>
    /// <param name="email">Email address to sanitize.</param>
    /// <returns>Sanitized email address.</returns>
    public static string SanitizeEmail(string email)
    {
        return email.Trim().ToLower();
    }
}
