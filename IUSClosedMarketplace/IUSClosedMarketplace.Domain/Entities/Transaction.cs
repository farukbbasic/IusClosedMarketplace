using IUSClosedMarketplace.Domain.Common;

namespace IUSClosedMarketplace.Domain.Entities;

public class Transaction : BaseEntity
{
    public decimal Amount { get; set; }

    // Foreign keys
    public int BuyerId { get; set; }
    public int SellerId { get; set; }
    public int ListingId { get; set; }

    // Navigation properties
    public User Buyer { get; set; } = null!;
    public User Seller { get; set; } = null!;
    public Listing Listing { get; set; } = null!;
}
