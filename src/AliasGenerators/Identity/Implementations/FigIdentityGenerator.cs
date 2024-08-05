//-----------------------------------------------------------------------
// <copyright file="FigIdentityGenerator.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

namespace AliasGenerators.Identity.Implementations;

using System.Text.Json;

/// <summary>
/// Identity generator which generates random identities using the identiteitgenerator.nl semi-public API.
/// </summary>
public class FigIdentityGenerator : IIdentityGenerator
{
    private static readonly HttpClient HttpClient = new();
    private static readonly string Url = "https://api.identiteitgenerator.nl/generate/identity";
    private static readonly JsonSerializerOptions JsonSerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    /// <inheritdoc/>
    public async Task<Identity.Models.Identity> GenerateRandomIdentityAsync()
    {
        var response = await HttpClient.GetAsync(Url);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        var identity = JsonSerializer.Deserialize<Identity.Models.Identity>(json, JsonSerializerOptions);

        if (identity is null)
        {
            throw new InvalidOperationException("Failed to deserialize the identity from FIG WebApi.");
        }

        return identity;
    }
}
