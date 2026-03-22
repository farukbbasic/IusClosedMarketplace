using IUSClosedMarketplace.Domain.Common;
using IUSClosedMarketplace.Domain.Enums;

namespace IUSClosedMarketplace.Domain.Entities;

public class Report : BaseEntity
{
    public string Reason { get; set; } = string.Empty;
    public ReportStatus Status { get; set; } = ReportStatus.Pending;

    // Foreign keys
    public int ReporterId { get; set; }
    public int ListingId { get; set; }

    // Navigation properties
    public User Reporter { get; set; } = null!;
    public Listing Listing { get; set; } = null!;
}
