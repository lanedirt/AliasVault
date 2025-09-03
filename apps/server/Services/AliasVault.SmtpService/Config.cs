//-----------------------------------------------------------------------
// <copyright file="Config.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.SmtpService;

/// <summary>
/// Configuration class for the SMTP service with values loaded from appsettings.json file.
/// </summary>
public class Config
{
    /// <summary>
    /// Gets or sets whether TLS is enabled for the SMTP service.
    /// </summary>
    public string SmtpTlsEnabled { get; set; } = "false";

    /// <summary>
    /// Gets or sets the domains that the SMTP service is listening for.
    /// Domains not in this list will be rejected.
    /// </summary>
    public List<string> AllowedToDomains { get; set; } = [];
}
