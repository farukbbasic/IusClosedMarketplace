using System.ComponentModel.DataAnnotations;

namespace IUSClosedMarketplace.Application.DTOs.Transactions;

public class TransactionDto
{
    public int Id { get; set; }
    public decimal Amount { get; set; }
    public int BuyerId { get; set; }
    public string BuyerName { get; set; } = string.Empty;
    public int SellerId { get; set; }
    public string SellerName { get; set; } = string.Empty;
    public int ListingId { get; set; }
    public string ListingTitle { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateTransactionDto
{
    [Required]
    public int ListingId { get; set; }
}

public class AnalyticsDto
{
    public int TotalUsers { get; set; }
    public int ActiveListings { get; set; }
    public int TotalTransactions { get; set; }
    public decimal TotalRevenue { get; set; }
    public int PendingReports { get; set; }
    public decimal AverageListingPrice { get; set; }
    public List<CategoryCountDto> ListingsPerCategory { get; set; } = new();
    public List<SellerActivityDto> MostActiveSellers { get; set; } = new();
    public List<MonthlyRevenueDto> MonthlyRevenue { get; set; } = new();
}

public class CategoryCountDto
{
    public string CategoryName { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class SellerActivityDto
{
    public string SellerName { get; set; } = string.Empty;
    public int ListingCount { get; set; }
}

public class MonthlyRevenueDto
{
    public string Month { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
}
