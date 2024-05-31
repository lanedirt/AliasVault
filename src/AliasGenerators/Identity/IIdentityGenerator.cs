namespace AliasGenerators.Identity;

public interface IIdentityGenerator
{
    Task<Models.Identity> GenerateRandomIdentityAsync();
}
