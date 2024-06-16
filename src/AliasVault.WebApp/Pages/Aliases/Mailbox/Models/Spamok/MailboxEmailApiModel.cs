﻿//-----------------------------------------------------------------------
// <copyright file="MailboxEmailApiModel.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.WebApp.Pages.Aliases.Models.Spamok;

/// <summary>
/// Represents a mailbox email API model.
/// </summary>
public class MailboxEmailApiModel
{
    /// <summary>
    /// Gets or sets the ID of the email.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets the subject of the email.
    /// </summary>
    public string Subject { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the display name of the sender.
    /// </summary>
    public string FromDisplay { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the domain of the sender's email address.
    /// </summary>
    public string FromDomain { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the local part of the sender's email address.
    /// </summary>
    public string FromLocal { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the domain of the recipient's email address.
    /// </summary>
    public string ToDomain { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the local part of the recipient's email address.
    /// </summary>
    public string ToLocal { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the date of the email.
    /// </summary>
    public DateTime Date { get; set; }

    /// <summary>
    /// Gets or sets the system date of the email.
    /// </summary>
    public DateTime DateSystem { get; set; }

    /// <summary>
    /// Gets or sets the preview of the email message.
    /// </summary>
    public string MessagePreview { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the number of seconds ago the email was received.
    /// </summary>
    public double SecondsAgo { get; set; }
}
