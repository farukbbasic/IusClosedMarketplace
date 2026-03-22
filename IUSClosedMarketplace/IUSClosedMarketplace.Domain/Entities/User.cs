using IUSClosedMarketplace.Domain.Common;
using IUSClosedMarketplace.Domain.Enums;

namespace IUSClosedMarketplace.Domain.Entities;

public class User : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Buyer;
    public bool IsBanned { get; set; } = false;

    // Navigation properties
    public ICollection<Listing> Listings { get; set; } = new List<Listing>();
    public ICollection<Message> SentMessages { get; set; } = new List<Message>();
    public ICollection<Message> ReceivedMessages { get; set; } = new List<Message>();
    public ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();
    public ICollection<Report> Reports { get; set; } = new List<Report>();
    public ICollection<Transaction> Purchases { get; set; } = new List<Transaction>();
    public ICollection<Transaction> Sales { get; set; } = new List<Transaction>();
}
