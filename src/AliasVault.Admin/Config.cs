//-----------------------------------------------------------------------
// <copyright file="Config.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Admin;

/// <summary>
/// Configuration class for the Admin project with values loaded from environment variables.
/// </summary>
public class Config
{
    /// <summary>
    /// Gets or sets the admin password hash which is generated by install.sh and will be set
    /// as the default password for the admin user.
    /// </summary>
    public string AdminPasswordHash { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the last time the password was changed. This is used to check if the
    /// password hash generated by install.sh should replace the current password hash if user already exists.
    /// </summary>
    public DateTime LastPasswordChanged { get; set; } = DateTime.MinValue;
}
