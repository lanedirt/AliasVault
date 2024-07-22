//-----------------------------------------------------------------------
// <copyright file="Program.cs" company="lanedirt">
// Copyright (c) lanedirt. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

using AliasServerDb;
using Microsoft.AspNetCore.Identity;

if (args.Length == 0)
{
    Console.WriteLine("Please provide a password as an argument.");
    return;
}

var password = args[0];
var hasher = new PasswordHasher<IdentityUser>();
var user = new AdminUser();
var hashedPassword = hasher.HashPassword(user, password);

Console.WriteLine($"{hashedPassword}");
