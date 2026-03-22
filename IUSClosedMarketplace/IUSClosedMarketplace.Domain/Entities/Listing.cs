using IUSClosedMarketplace.Domain.Common;

namespace IUSClosedMarketplace.Domain.Entities;

public class Listing : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Condition { get; set; } = string.Empty;
    public string ImageUrls { get; set; } = string.Empty; // JSON array of image paths
    public bool IsActive { get; set; } = true;

    // Foreign keys
    public int CategoryId { get; set; }
    public int SellerId { get; set; }

    // Navigation properties
    public Category Category { get; set; } = null!;
    public User Seller { get; set; } = null!;
    public ICollection<Message> Messages { get; set; } = new List<Message>();
    public ICollection<Report> Reports { get; set; } = new List<Report>();
    public ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
