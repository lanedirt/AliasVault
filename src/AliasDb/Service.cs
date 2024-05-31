namespace AliasDb;

using System.ComponentModel.DataAnnotations;

/// <summary>
/// The service entity.
/// </summary>
public class Service
{
    /// <summary>
    /// Gets or sets the service primary key.
    /// </summary>
    [Key]
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets the service name.
    /// </summary>
    [StringLength(255)]
    public string? Name { get; set; }

    /// <summary>
    /// Gets or sets the service URL.
    /// </summary>
    [StringLength(255)]
    public string? Url { get; set; }

    /// <summary>
    /// Gets or sets image logo of the service.
    /// </summary>
    public byte[]? Logo { get; set; } = null;

    /// <summary>
    /// Gets or sets the created timestamp.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the updated timestamp.
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}
