//-----------------------------------------------------------------------
// <copyright file="ApiErrorCodeHelper.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Shared.Models.WebApi;

using AliasVault.Shared.Models.Enums;

/// <summary>
/// Helper class for working with API error codes.
/// </summary>
public static class ApiErrorCodeHelper
{
    /// <summary>
    /// Converts an ApiErrorCode enum value to its string representation.
    /// </summary>
    /// <param name="errorCode">The error code to convert.</param>
    /// <returns>String representation of the error code.</returns>
    public static string ToCode(this ApiErrorCode errorCode)
    {
        return errorCode.ToString();
    }

    /// <summary>
    /// Creates an ApiErrorResponse with the specified error code and status.
    /// </summary>
    /// <param name="errorCode">The error code.</param>
    /// <param name="statusCode">The HTTP status code.</param>
    /// <param name="details">Optional additional details.</param>
    /// <returns>ApiErrorResponse object.</returns>
    public static ApiErrorResponse CreateErrorResponse(ApiErrorCode errorCode, int statusCode, object? details = null)
    {
        return new ApiErrorResponse
        {
            Code = errorCode.ToCode(),
            Message = errorCode.ToCode(), // Clients will replace this with localized message
            StatusCode = statusCode,
            Details = details ?? new { },
            Timestamp = DateTime.UtcNow,
        };
    }

    /// <summary>
    /// Creates a ServerValidationErrorResponse with error codes instead of plain text.
    /// </summary>
    /// <param name="errorCode">The error code.</param>
    /// <param name="status">The HTTP status code.</param>
    /// <returns>ServerValidationErrorResponse object.</returns>
    public static ServerValidationErrorResponse CreateValidationErrorResponse(ApiErrorCode errorCode, int status)
    {
        var code = errorCode.ToCode();
        var errors = new Dictionary<string, string[]>
        {
            { code, [code] },
        };

        return new ServerValidationErrorResponse
        {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
            Title = code,
            Errors = errors,
            Status = status,
            TraceId = Guid.NewGuid().ToString(),
        };
    }

    /// <summary>
    /// Creates a ServerValidationErrorResponse with multiple error codes.
    /// </summary>
    /// <param name="errorCodes">Array of error codes.</param>
    /// <param name="status">The HTTP status code.</param>
    /// <returns>ServerValidationErrorResponse object.</returns>
    public static ServerValidationErrorResponse CreateValidationErrorResponse(ApiErrorCode[] errorCodes, int status)
    {
        var errors = new Dictionary<string, string[]>();
        foreach (var errorCode in errorCodes)
        {
            var code = errorCode.ToCode();
            errors.Add(code, new[] { code });
        }

        var firstCode = errorCodes.Length > 0 ? errorCodes[0].ToCode() : ApiErrorCode.UNKNOWN_ERROR.ToCode();

        return new ServerValidationErrorResponse
        {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
            Title = firstCode,
            Errors = errors,
            Status = status,
            TraceId = Guid.NewGuid().ToString(),
        };
    }
}
