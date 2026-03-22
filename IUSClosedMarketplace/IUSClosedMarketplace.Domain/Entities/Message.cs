using IUSClosedMarketplace.Domain.Common;

namespace IUSClosedMarketplace.Domain.Entities;

public class Message : BaseEntity
{
    public string Content { get; set; } = string.Empty;

    // Foreign keys
    public int SenderId { get; set; }
    public int ReceiverId { get; set; }
    public int ListingId { get; set; }

    // Navigation properties
    public User Sender { get; set; } = null!;
    public User Receiver { get; set; } = null!;
    public Listing Listing { get; set; } = null!;
}
