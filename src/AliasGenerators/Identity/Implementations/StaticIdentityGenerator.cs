using AliasGenerators.Identity;

namespace AliasGenerators.Identity.Implementations;

/// <summary>
/// Static identity generator which implements IIdentityGenerator but always returns
/// the same static identity for testing purposes.
/// </summary>
public class StaticIdentityGenerator : IIdentityGenerator
{
    public async Task<Identity.Models.Identity> GenerateRandomIdentityAsync()
    {
        await Task.Delay(1); // Simulate async operation

        return new Identity.Models.Identity
        {
            FirstName = "John",
            LastName = "Doe",
        };
    }
}
