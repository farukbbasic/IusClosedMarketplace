using IUSClosedMarketplace.Domain.Entities;
using IUSClosedMarketplace.Persistence.Context;
using IUSClosedMarketplace.Persistence.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace IUSClosedMarketplace.Persistence.Repositories.Implementations;

public class ListingRepository : IListingRepository
{
    private readonly ApplicationDbContext _context;

    public ListingRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Listing?> GetByIdAsync(int id)
    {
        return await _context.Listings
            .Include(l => l.Seller)
            .Include(l => l.Category)
            .FirstOrDefaultAsync(l => l.Id == id);
    }

    public async Task<IEnumerable<Listing>> GetAllActiveAsync()
    {
        return await _context.Listings
            .Where(l => l.IsActive)
            .Include(l => l.Seller)
            .Include(l => l.Category)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Listing>> GetBySellerIdAsync(int sellerId)
    {
        return await _context.Listings
            .Where(l => l.SellerId == sellerId)
            .Include(l => l.Category)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Listing>> SearchAsync(string? keyword, int? categoryId, decimal? minPrice, decimal? maxPrice, string? sortBy)
    {
        var query = _context.Listings
            .Where(l => l.IsActive)
            .Include(l => l.Seller)
            .Include(l => l.Category)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var lower = keyword.ToLower();
            query = query.Where(l => l.Title.ToLower().Contains(lower) || l.Description.ToLower().Contains(lower));
        }

        if (categoryId.HasValue && categoryId.Value > 0)
            query = query.Where(l => l.CategoryId == categoryId.Value);

        if (minPrice.HasValue)
            query = query.Where(l => l.Price >= minPrice.Value);

        if (maxPrice.HasValue)
            query = query.Where(l => l.Price <= maxPrice.Value);

        query = sortBy switch
        {
            "price-low" => query.OrderBy(l => l.Price),
            "price-high" => query.OrderByDescending(l => l.Price),
            _ => query.OrderByDescending(l => l.CreatedAt)
        };

        return await query.ToListAsync();
    }

    public async Task<Listing> CreateAsync(Listing listing)
    {
        _context.Listings.Add(listing);
        await _context.SaveChangesAsync();
        return listing;
    }

    public async Task UpdateAsync(Listing listing)
    {
        _context.Listings.Update(listing);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var listing = await _context.Listings.FindAsync(id);
        if (listing != null)
        {
            listing.IsActive = false;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<int> GetCountByCategoryAsync(int categoryId)
    {
        return await _context.Listings.CountAsync(l => l.CategoryId == categoryId && l.IsActive);
    }

    public async Task<int> GetActiveCountAsync()
    {
        return await _context.Listings.CountAsync(l => l.IsActive);
    }
}
