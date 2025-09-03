//-----------------------------------------------------------------------
// <copyright file="ApiResponseUtility.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Utilities;

using AliasVault.Shared.Models.WebApi;
using Microsoft.Extensions.Localization;

/// <summary>
/// Helper methods for parsing API responses.
/// </summary>
public static class ApiResponseUtility
{
    private const string GenericErrorMessage = "An error occurred. Please try again.";

    /// <summary>
    /// Parses the response content and returns localized error messages.
    /// </summary>
    /// <param name="responseContent">Response content.</param>
    /// <param name="localizer">String localizer for API errors.</param>
    /// <returns>List of localized error messages.</returns>
    public static List<string> ParseErrorResponse(string responseContent, IStringLocalizer localizer)
    {
        var returnErrors = new List<string>();

        try
        {
            var errorResponse = System.Text.Json.JsonSerializer.Deserialize<ServerValidationErrorResponse>(responseContent);
            if (errorResponse is not null)
            {
                foreach (var error in errorResponse.Errors)
                {
                    foreach (var errorCode in error.Value)
                    {
                        // Try to get localized message for the error code
                        var localizedMessage = localizer[errorCode];

                        // If localization returns the key itself, it means no translation was found
                        // In this case, use the error code as fallback or a generic message
                        if (localizedMessage.ResourceNotFound)
                        {
                            // Try to get a generic error message
                            var genericError = localizer["UnknownError"];
                            returnErrors.Add(genericError.ResourceNotFound ? GenericErrorMessage : genericError.Value);
                        }
                        else
                        {
                            returnErrors.Add(localizedMessage.Value);
                        }
                    }
                }
            }
        }
        catch
        {
            // If parsing fails, return a generic error message
            var genericError = localizer["UnknownError"];
            returnErrors.Add(genericError.ResourceNotFound ? GenericErrorMessage : genericError.Value);
        }

        return returnErrors;
    }

    /// <summary>
    /// Parses the response content for non-validation errors (like ApiErrorResponse).
    /// </summary>
    /// <param name="responseContent">Response content.</param>
    /// <param name="localizer">String localizer for API errors.</param>
    /// <returns>Localized error message.</returns>
    public static string ParseSingleErrorResponse(string responseContent, IStringLocalizer localizer)
    {
        try
        {
            // Try to parse as ApiErrorResponse first
            var apiErrorResponse = System.Text.Json.JsonSerializer.Deserialize<ApiErrorResponse>(responseContent);
            if (apiErrorResponse is not null && !string.IsNullOrEmpty(apiErrorResponse.Code))
            {
                var localizedMessage = localizer[apiErrorResponse.Code];
                return localizedMessage.ResourceNotFound ? apiErrorResponse.Code : localizedMessage.Value;
            }

            // Fall back to ServerValidationErrorResponse
            var errors = ParseErrorResponse(responseContent, localizer);
            return errors.Count > 0 ? errors[0] : GenericErrorMessage;
        }
        catch
        {
            var genericError = localizer["UnknownError"];
            return genericError.ResourceNotFound ? GenericErrorMessage : genericError.Value;
        }
    }
}
