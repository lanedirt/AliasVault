//-----------------------------------------------------------------------
// <copyright file="MailboxEmailApiModel.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.WebApp.Main.Models.Spamok;

using AliasVault.WebApp.Main.Models.Spamok.Base;

/// <summary>
/// Represents a mailbox email API model.
/// </summary>
public class MailboxEmailApiModel : EmailApiModelBase
{
    /// <summary>
    /// Gets or sets the preview of the email message.
    /// </summary>
    public string MessagePreview { get; set; } = string.Empty;
}
