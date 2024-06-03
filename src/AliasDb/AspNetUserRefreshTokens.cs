namespace AliasDb;

using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

/// <summary>
/// Refresh tokens for users.
/// </summary>
public class AspNetUserRefreshTokens
{
    /// <summary>
    /// Gets or sets Refresh Token ID.
    /// </summary>
    [Key]
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets user ID foreign key.
    /// </summary>
    [StringLength(255)]
    public string UserId { get; set; } = null!;

    /// <summary>
    /// Gets or sets foreign key to the IdentityUser object.
    /// </summary>
    [ForeignKey("UserId")]
    public virtual IdentityUser User { get; set; } = null!;

    /// <summary>
    /// Gets or sets the device identifier (one token per device).
    /// </summary>
    [StringLength(255)]
    public string DeviceIdentifier { get; set; } = null!;

    /// <summary>
    /// Gets or sets the token value.
    /// </summary>
    [StringLength(255)]
    public string Value { get; set; } = null!;

    /// <summary>
    /// Gets or sets the expiration date.
    /// </summary>
    [StringLength(255)]
    public DateTime ExpireDate { get; set; }

    /// <summary>
    /// Gets or sets created timestamp.
    /// </summary>
    public DateTime CreatedAt { get; set; }
}
