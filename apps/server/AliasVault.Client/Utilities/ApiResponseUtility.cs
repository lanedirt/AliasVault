//-----------------------------------------------------------------------
// <copyright file="ApiResponseUtility.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Utilities;

using AliasVault.Shared.Models.WebApi;

/// <summary>
/// Helper methods for parsing API responses.
/// </summary>
public static class ApiResponseUtility
{
    /// <summary>
    /// Parses the response content and displays the server validation errors.
    /// </summary>
    /// <param name="responseContent">Response content.</param>
    /// <returns>List of errors if something went wrong.</returns>
    public static List<string> ParseErrorResponse(string responseContent)
    {
        var returnErrors = new List<string>();

        var errorResponse = System.Text.Json.JsonSerializer.Deserialize<ServerValidationErrorResponse>(responseContent);
        if (errorResponse is not null)
        {
            foreach (var error in errorResponse.Errors)
            {
                returnErrors.AddRange(error.Value);
            }
        }

        return returnErrors;
    }
}
