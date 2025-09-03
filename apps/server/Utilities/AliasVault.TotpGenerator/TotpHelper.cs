//-----------------------------------------------------------------------
// <copyright file="TotpHelper.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.TotpGenerator;

/// <summary>
/// Helper class to verify and sanitize TOTP codes.
/// </summary>
public static class TotpHelper
{
    /// <summary>
    /// Sanitizes a TOTP secret if its provided as a URI.
    /// </summary>
    /// <param name="secretKey">The secret key in Base32 encoding.</param>
    /// <param name="name">The name of the TOTP code.</param>
    /// <returns>The sanitized secret key and name.</returns>
    public static (string SecretKey, string? Name) SanitizeSecretKey(string secretKey, string? name = null)
    {
        // Check if the input is a TOTP URI
        if (secretKey.StartsWith("otpauth://totp/"))
        {
            try
            {
                var uri = new Uri(secretKey);
                var queryParams = System.Web.HttpUtility.ParseQueryString(uri.Query);

                // Extract the secret from query parameters
                secretKey = queryParams["secret"] ?? throw new ArgumentException("Secret not found in URI");

                // If no name was provided, try to get it from the URI
                if (string.IsNullOrWhiteSpace(name))
                {
                    // The label is everything after 'totp/' and before '?'
                    var label = uri.AbsolutePath.TrimStart('/');

                    // If the label contains ':', take the part after it
                    name = label.Contains(':') ? label.Split(':')[1] : label;

                    // If there's an issuer in the query params, use it as a prefix
                    var issuer = queryParams["issuer"];
                    if (!string.IsNullOrWhiteSpace(issuer))
                    {
                        name = $"{issuer}: {name}";
                    }
                }
            }
            catch (Exception)
            {
                throw new ArgumentException("Invalid TOTP URI format. Please check and try again.");
            }
        }

        try
        {
            // Validate the secret key by trying to generate a code
            TotpGenerator.GenerateTotpCode(secretKey);
        }
        catch (Exception)
        {
            throw new ArgumentException("Invalid secret key. Please check and try again.");
        }

        return (secretKey, name);
    }
}
