using IUSClosedMarketplace.Domain.Common;

namespace IUSClosedMarketplace.Domain.Entities;

public class Category : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    // Navigation properties
    public ICollection<Listing> Listings { get; set; } = new List<Listing>();
}
