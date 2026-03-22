using System.ComponentModel.DataAnnotations;

namespace IUSClosedMarketplace.Application.DTOs.Reports;

public class ReportDto
{
    public int Id { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int ReporterId { get; set; }
    public string ReporterName { get; set; } = string.Empty;
    public int ListingId { get; set; }
    public string ListingTitle { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateReportDto
{
    [Required]
    public int ListingId { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Reason { get; set; } = string.Empty;
}

public class ResolveReportDto
{
    [Required]
    public string Action { get; set; } = string.Empty; // Resolve, RemoveListing, BanUser
}
