// -----------------------------------------------------------------------
// <copyright file="TimeValidationJwtBearerEvents.cs" company="aliasvault">
// Copyright (c) aliasvault. All rights reserved.
// Licensed under the AGPLv3 license. See LICENSE.md file in the project root for full license information.
// </copyright>
// -----------------------------------------------------------------------

namespace AliasVault.Api.Jwt;

using AliasVault.Shared.Providers.Time;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.JsonWebTokens;

/// <summary>
/// JwtBearerEvents implementation that validates the token expiration time based on
/// the current time provided by an ITimeProvider. This is used to be able to
/// test the token expiration logic in unit tests.
/// </summary>
public class TimeValidationJwtBearerEvents(ITimeProvider timeProvider) : JwtBearerEvents
{
    /// <summary>
    /// Validates the token expiration time based on the current time provided by the ITimeProvider.
    /// </summary>
    /// <param name="context">TokenValidatedContext.</param>
    /// <returns>Async task.</returns>
    public override Task TokenValidated(TokenValidatedContext context)
    {
        if (context.SecurityToken is JsonWebToken jwtToken)
        {
            var now = timeProvider.UtcNow;
            if (jwtToken.ValidTo < now)
            {
                context.Fail("Token has expired.");
            }
        }

        return Task.CompletedTask;
    }
}
