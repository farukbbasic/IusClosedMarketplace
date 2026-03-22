using System.ComponentModel.DataAnnotations;

namespace IUSClosedMarketplace.Application.DTOs.Listings;

public class ListingDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Condition { get; set; } = string.Empty;
    public string ImageUrls { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public int SellerId { get; set; }
    public string SellerName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateListingDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [Range(0.01, 999999.99)]
    public decimal Price { get; set; }

    [Required]
    public string Condition { get; set; } = string.Empty;

    [Required]
    public int CategoryId { get; set; }

    public string? ImageUrls { get; set; }
}

public class UpdateListingDto
{
    [MaxLength(200)]
    public string? Title { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Range(0.01, 999999.99)]
    public decimal? Price { get; set; }

    public string? Condition { get; set; }
    public int? CategoryId { get; set; }
    public string? ImageUrls { get; set; }
}

public class ListingSearchDto
{
    public string? Keyword { get; set; }
    public int? CategoryId { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? SortBy { get; set; } // latest, price-low, price-high
}
