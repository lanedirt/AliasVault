//-----------------------------------------------------------------------
// <copyright file="ApiErrorResponse.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.WebApi;

using System.Text.Json.Serialization;

/// <summary>
/// Represents the error response returned by the API.
/// </summary>
public class ApiErrorResponse
{
    /// <summary>
    /// Gets or sets the main error message.
    /// </summary>
    /// <value>A string containing a brief description of the error.</value>
    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the error code associated with this error.
    /// </summary>
    /// <value>A string representing a unique identifier for this type of error.</value>
    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets additional details about the error.
    /// </summary>
    /// <value>An object containing any additional information about the error.</value>
    [JsonPropertyName("details")]
    public object Details { get; set; } = new { };

    /// <summary>
    /// Gets or sets the HTTP status code associated with this error.
    /// </summary>
    /// <value>An integer representing the HTTP status code.</value>
    [JsonPropertyName("statusCode")]
    public int StatusCode { get; set; } = 500;

    /// <summary>
    /// Gets or sets the timestamp when the error occurred.
    /// </summary>
    /// <value>A DateTime representing when the error was generated.</value>
    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
