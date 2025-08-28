//-----------------------------------------------------------------------
// <copyright file="ValidationMessages.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasVault.Client.Resources;

using System.Globalization;
using System.Resources;

/// <summary>
/// Provides access to validation message resources.
/// </summary>
public static class ValidationMessages
{
    /// <summary>
    /// The resource manager for accessing validation messages.
    /// </summary>
    private static readonly ResourceManager ResourceManager = new("AliasVault.Client.Resources.ValidationMessages", typeof(ValidationMessages).Assembly);

    /// <summary>
    /// Gets the error message for password minimum length validation.
    /// </summary>
    public static string PasswordMinLength => GetResourceValue("PasswordMinLength");

    /// <summary>
    /// Gets the error message when password confirmation doesn't match.
    /// </summary>
    public static string PasswordsDoNotMatch => GetResourceValue("PasswordsDoNotMatch");

    /// <summary>
    /// Gets the generic error message for password minimum length validation.
    /// </summary>
    public static string PasswordMinLengthGeneric => GetResourceValue("PasswordMinLengthGeneric");

    /// <summary>
    /// Gets the generic error message when passwords don't match.
    /// </summary>
    public static string PasswordsDoNotMatchGeneric => GetResourceValue("PasswordsDoNotMatchGeneric");

    /// <summary>
    /// Gets the error message when username is required.
    /// </summary>
    public static string UsernameRequired => GetResourceValue("UsernameRequired");

    /// <summary>
    /// Gets the error message when password is required.
    /// </summary>
    public static string PasswordRequired => GetResourceValue("PasswordRequired");

    /// <summary>
    /// Gets the error message when secret key is required.
    /// </summary>
    public static string SecretKeyRequired => GetResourceValue("SecretKeyRequired");

    /// <summary>
    /// Gets the error message for terms and conditions acceptance.
    /// </summary>
    public static string MustAcceptTerms => GetResourceValue("MustAcceptTerms");

    /// <summary>
    /// Gets the error message when service name is required.
    /// </summary>
    public static string ServiceNameRequired => GetResourceValue("ServiceNameRequired");

    /// <summary>
    /// Gets the generic error message when a field is required.
    /// </summary>
    public static string FieldRequired => GetResourceValue("FieldRequired");

    /// <summary>
    /// Gets the resource value for the specified key.
    /// </summary>
    /// <param name="key">The resource key.</param>
    /// <returns>The localized resource value.</returns>
    private static string GetResourceValue(string key)
    {
        try
        {
            return ResourceManager.GetString(key, CultureInfo.CurrentUICulture) ?? key;
        }
        catch
        {
            // Return the key as fallback if resource loading fails
            return key;
        }
    }
}
