// See https://aka.ms/new-console-template for more information
using System;
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
