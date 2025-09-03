//-----------------------------------------------------------------------
// <copyright file="EmailAttachment.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasServerDb;

using Microsoft.EntityFrameworkCore;

/// <summary>
/// Represents an email attachment.
/// </summary>
[Index(nameof(EmailId))]
public class EmailAttachment
{
    /// <summary>
    /// Gets or sets the ID of the attachment.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets the bytes of the attachment.
    /// </summary>
    public byte[] Bytes { get; set; } = null!;

    /// <summary>
    /// Gets or sets the filename of the attachment.
    /// </summary>
    public string Filename { get; set; } = null!;

    /// <summary>
    /// Gets or sets the MIME type of the attachment.
    /// </summary>
    public string MimeType { get; set; } = null!;

    /// <summary>
    /// Gets or sets the filesize of the attachment.
    /// </summary>
    public int Filesize { get; set; }

    /// <summary>
    /// Gets or sets the date of the attachment.
    /// </summary>
    public DateTime Date { get; set; }

    /// <summary>
    /// Gets or sets the ID of the email that the attachment belongs to.
    /// </summary>
    public int EmailId { get; set; }

    /// <summary>
    /// Gets or sets the email that the attachment belongs to.
    /// </summary>
    public virtual Email Email { get; set; } = null!;
}
