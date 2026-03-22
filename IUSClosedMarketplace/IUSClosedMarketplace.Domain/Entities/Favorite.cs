using IUSClosedMarketplace.Domain.Common;

namespace IUSClosedMarketplace.Domain.Entities;

public class Favorite : BaseEntity
{
    // Foreign keys
    public int UserId { get; set; }
    public int ListingId { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public Listing Listing { get; set; } = null!;
}
