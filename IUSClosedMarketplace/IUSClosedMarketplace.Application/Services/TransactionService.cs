using AutoMapper;
using IUSClosedMarketplace.Application.DTOs.Transactions;
using IUSClosedMarketplace.Application.Interfaces.Services;
using IUSClosedMarketplace.Domain.Entities;
using IUSClosedMarketplace.Domain.Enums;
using IUSClosedMarketplace.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace IUSClosedMarketplace.Application.Services;

public class TransactionService : ITransactionService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public TransactionService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<IEnumerable<TransactionDto>> GetByUserAsync(int userId)
    {
        var transactions = await _context.Transactions
            .Where(t => t.BuyerId == userId || t.SellerId == userId)
            .Include(t => t.Buyer)
            .Include(t => t.Seller)
            .Include(t => t.Listing)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<TransactionDto>>(transactions);
    }

    public async Task<TransactionDto> CreateAsync(int buyerId, CreateTransactionDto dto)
    {
        var listing = await _context.Listings.FindAsync(dto.ListingId)
            ?? throw new KeyNotFoundException("Listing not found.");

        if (listing.SellerId == buyerId)
            throw new InvalidOperationException("You cannot buy your own listing.");

        if (!listing.IsActive)
            throw new InvalidOperationException("This listing is no longer active.");

        var transaction = new Transaction
        {
            BuyerId = buyerId,
            SellerId = listing.SellerId,
            ListingId = dto.ListingId,
            Amount = listing.Price
        };

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        // Reload with includes
        var created = await _context.Transactions
            .Include(t => t.Buyer)
            .Include(t => t.Seller)
            .Include(t => t.Listing)
            .FirstAsync(t => t.Id == transaction.Id);

        return _mapper.Map<TransactionDto>(created);
    }

    public async Task<AnalyticsDto> GetAnalyticsAsync()
    {
        var analytics = new AnalyticsDto
        {
            TotalUsers = await _context.Users.CountAsync(),
            ActiveListings = await _context.Listings.CountAsync(l => l.IsActive),
            TotalTransactions = await _context.Transactions.CountAsync(),
            TotalRevenue = await _context.Transactions.SumAsync(t => t.Amount),
            PendingReports = await _context.Reports.CountAsync(r => r.Status == ReportStatus.Pending)
        };

        var allListings = await _context.Listings.Where(l => l.IsActive).ToListAsync();
        analytics.AverageListingPrice = allListings.Count > 0
            ? allListings.Average(l => l.Price)
            : 0;

        // Listings per category
        analytics.ListingsPerCategory = await _context.Categories
            .Select(c => new CategoryCountDto
            {
                CategoryName = c.Name,
                Count = c.Listings.Count(l => l.IsActive)
            })
            .ToListAsync();

        // Most active sellers
        analytics.MostActiveSellers = await _context.Users
            .Where(u => u.Role == UserRole.Seller || u.Role == UserRole.Admin)
            .Select(u => new SellerActivityDto
            {
                SellerName = u.Name,
                ListingCount = u.Listings.Count
            })
            .OrderByDescending(s => s.ListingCount)
            .Take(10)
            .ToListAsync();

        // Monthly revenue
        analytics.MonthlyRevenue = await _context.Transactions
            .GroupBy(t => new { t.CreatedAt.Year, t.CreatedAt.Month })
            .Select(g => new MonthlyRevenueDto
            {
                Month = $"{g.Key.Year}-{g.Key.Month:D2}",
                Revenue = g.Sum(t => t.Amount)
            })
            .OrderBy(m => m.Month)
            .ToListAsync();

        return analytics;
    }
}
