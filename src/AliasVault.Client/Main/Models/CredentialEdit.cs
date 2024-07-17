//-----------------------------------------------------------------------
// <copyright file="CredentialEdit.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Main.Models;

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using AliasClientDb;
using AliasVault.Client.Models.FormValidation;

/// <summary>
/// Credential edit model.
/// </summary>
public class CredentialEdit
{
    /// <summary>
    /// Gets or sets the Id of the login.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets notes field (free text input).
    /// </summary>
    public string Notes { get; set; } = null!;

    /// <summary>
    /// Gets or sets username field.
    /// </summary>
    public string Username { get; set; } = null!;

    /// <summary>
    /// Gets or sets the name of the service.
    /// </summary>
    [Required]
    public string ServiceName { get; set; } = null!;

    /// <summary>
    /// Gets or sets the URL of the service.
    /// </summary>
    public string? ServiceUrl { get; set; }

    /// <summary>
    /// Gets or sets the logo of the service.
    /// </summary>
    public byte[]? ServiceLogo { get; set; } = null;

    /// <summary>
    /// Gets or sets the Alias Identity object.
    /// </summary>
    public Alias Alias { get; set; } = null!;

    /// <summary>
    /// Gets or sets the Alias BirthDate.
    /// </summary>
    [StringDateFormat("yyyy-MM-dd")]
    public string AliasBirthDate { get; set; } = null!;

    /// <summary>
    /// Gets or sets the Alias Password object.
    /// </summary>
    public Password Password { get; set; } = null!;

    /// <summary>
    /// Gets or sets the Alias CreateDate.
    /// </summary>
    public DateTime CreateDate { get; set; }

    /// <summary>
    /// Gets or sets the Alias LastUpdate.
    /// </summary>
    public DateTime LastUpdate { get; set; }

    /// <summary>
    /// Gets or sets the Attachment list.
    /// </summary>
    public List<Attachment> Attachments { get; set; } = [];
}
