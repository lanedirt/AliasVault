//-----------------------------------------------------------------------
// <copyright file="IpAddressUtility.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Auth;

using Microsoft.AspNetCore.Http;

/// <summary>
/// Ip address utility class to extract IP address from HttpContext.
/// </summary>
public static class IpAddressUtility
{
    /// <summary>
    /// Extract IP address from HttpContext.
    /// </summary>
    /// <param name="httpContext">HttpContext to extract the IP address from.</param>
    /// <returns>Ip address.</returns>
    public static string GetIpFromContext(HttpContext? httpContext)
    {
        string ipAddress = string.Empty;

        if (httpContext == null)
        {
            return ipAddress;
        }

        if (string.IsNullOrEmpty(ipAddress))
        {
            // Check if X-Forwarded-For header exists, if so, extract first IP address from comma separated list.
            if (httpContext.Request.Headers.TryGetValue("X-Forwarded-For", out var xForwardedFor))
            {
                ipAddress = xForwardedFor.ToString().Split(',')[0];
            }
            else
            {
                ipAddress = httpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0";
            }
        }

        // Anonymize the last octet of the IP address.
        if (ipAddress.Contains('.'))
        {
            try
            {
                ipAddress = ipAddress.Split('.')[0] + "." + ipAddress.Split('.')[1] + "." + ipAddress.Split('.')[2] + ".xxx";
            }
            catch
            {
                // If an exception occurs, continue execution with original IP address.
            }
        }

        return ipAddress;
    }
}
