//-----------------------------------------------------------------------
// <copyright file="AttachmentApiModel.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace BlazorServer.Models.Spamok;

/// <summary>
/// Represents an attachment for an email.
/// </summary>
public class AttachmentApiModel
{
    /// <summary>
    /// Gets or sets the ID of the attachment.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets the ID of the email the attachment belongs to.
    /// </summary>
    public int Email_Id { get; set; }

    /// <summary>
    /// Gets or sets the filename of the attachment.
    /// </summary>
    public string Filename { get; set; } = null!;

    /// <summary>
    /// Gets or sets the MIME type of the attachment.
    /// </summary>
    public string MimeType { get; set; } = null!;

    /// <summary>
    /// Gets or sets the size of the attachment in bytes.
    /// </summary>
    public int Filesize { get; set; }
}
