//-----------------------------------------------------------------------
// <copyright file="ServerValidationErrorResponse.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.WebApi;

using System.Text.Json.Serialization;

/// <summary>
/// Represents the structure of a validation error response from the API.
/// </summary>
public class ServerValidationErrorResponse
{
    /// <summary>
    /// Gets or sets the type of the error.
    /// </summary>
    [JsonPropertyName("type")]
    public string Type { get; set; } = null!;

    /// <summary>
    /// Gets or sets the title of the error.
    /// </summary>
    [JsonPropertyName("title")]
    public string Title { get; set; } = null!;

    /// <summary>
    /// Gets or sets the HTTP status code of the response.
    /// </summary>
    [JsonPropertyName("status")]
    public int Status { get; set; }

    /// <summary>
    /// Gets or sets the validation errors. The key is the name of the field that has the error, and the value is an array of error messages for that field.
    /// </summary>
    [JsonPropertyName("errors")]
    public Dictionary<string, string[]> Errors { get; set; } = new();

    /// <summary>
    /// Gets or sets the trace ID of the error.
    /// </summary>
    [JsonPropertyName("traceId")]
    public string TraceId { get; set; } = null!;

    /// <summary>
    /// Creates a new instance of <see cref="ServerValidationErrorResponse"/>.
    /// </summary>
    /// <param name="title">Title of the error.</param>
    /// <param name="status">Status code.</param>
    /// <returns>ServerValidationErrorResponse object.</returns>
    public static ServerValidationErrorResponse Create(string title, int status)
    {
        var errors = new Dictionary<string, string[]>
        {
            { title, [title] },
        };

        return new ServerValidationErrorResponse
        {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
            Title = title,
            Errors = errors,
            Status = status,
            TraceId = Guid.NewGuid().ToString(),
        };
    }

    /// <summary>
    /// Creates a new instance of <see cref="ServerValidationErrorResponse"/>.
    /// </summary>
    /// <param name="errorArray">Array with errors.</param>
    /// <param name="status">Status code.</param>
    /// <returns>ServerValidationErrorResponse object.</returns>
    public static ServerValidationErrorResponse Create(string[] errorArray, int status)
    {
        var errors = new Dictionary<string, string[]>();
        foreach (var t in errorArray)
        {
            errors.Add(t, new[] { t });
        }

        return new ServerValidationErrorResponse
        {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
            Title = errorArray[0],
            Errors = errors,
            Status = status,
            TraceId = Guid.NewGuid().ToString(),
        };
    }
}
