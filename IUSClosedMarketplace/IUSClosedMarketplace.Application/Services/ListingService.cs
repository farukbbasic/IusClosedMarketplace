using AutoMapper;
using IUSClosedMarketplace.Application.DTOs.Listings;
using IUSClosedMarketplace.Application.Interfaces.Services;
using IUSClosedMarketplace.Domain.Entities;
using IUSClosedMarketplace.Persistence.Context;
using IUSClosedMarketplace.Persistence.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace IUSClosedMarketplace.Application.Services;

public class ListingService : IListingService
{
    private readonly IListingRepository _listingRepository;
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public ListingService(IListingRepository listingRepository, ApplicationDbContext context, IMapper mapper)
    {
        _listingRepository = listingRepository;
        _context = context;
        _mapper = mapper;
    }

    public async Task<ListingDto?> GetByIdAsync(int id)
    {
        var listing = await _listingRepository.GetByIdAsync(id);
        return listing == null ? null : _mapper.Map<ListingDto>(listing);
    }

    public async Task<IEnumerable<ListingDto>> GetAllActiveAsync()
    {
        var listings = await _listingRepository.GetAllActiveAsync();
        return _mapper.Map<IEnumerable<ListingDto>>(listings);
    }

    public async Task<IEnumerable<ListingDto>> GetBySellerIdAsync(int sellerId)
    {
        var listings = await _listingRepository.GetBySellerIdAsync(sellerId);
        return _mapper.Map<IEnumerable<ListingDto>>(listings);
    }

    public async Task<IEnumerable<ListingDto>> SearchAsync(ListingSearchDto dto)
    {
        var listings = await _listingRepository.SearchAsync(
            dto.Keyword, dto.CategoryId, dto.MinPrice, dto.MaxPrice, dto.SortBy);
        return _mapper.Map<IEnumerable<ListingDto>>(listings);
    }

    public async Task<ListingDto> CreateAsync(int sellerId, CreateListingDto dto)
    {
        var listing = new Listing
        {
            Title = dto.Title,
            Description = dto.Description,
            Price = dto.Price,
            Condition = dto.Condition,
            CategoryId = dto.CategoryId,
            SellerId = sellerId,
            ImageUrls = dto.ImageUrls ?? "[]",
            IsActive = true
        };

        await _listingRepository.CreateAsync(listing);

        // Reload with includes
        var created = await _listingRepository.GetByIdAsync(listing.Id);
        return _mapper.Map<ListingDto>(created);
    }

    public async Task<ListingDto> UpdateAsync(int id, int sellerId, UpdateListingDto dto)
    {
        var listing = await _listingRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Listing with id {id} not found.");

        if (listing.SellerId != sellerId)
            throw new UnauthorizedAccessException("You can only edit your own listings.");

        if (dto.Title != null) listing.Title = dto.Title;
        if (dto.Description != null) listing.Description = dto.Description;
        if (dto.Price.HasValue) listing.Price = dto.Price.Value;
        if (dto.Condition != null) listing.Condition = dto.Condition;
        if (dto.CategoryId.HasValue) listing.CategoryId = dto.CategoryId.Value;
        if (dto.ImageUrls != null) listing.ImageUrls = dto.ImageUrls;

        await _listingRepository.UpdateAsync(listing);

        var updated = await _listingRepository.GetByIdAsync(listing.Id);
        return _mapper.Map<ListingDto>(updated);
    }

    public async Task DeleteAsync(int id, int userId)
    {
        var listing = await _listingRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Listing with id {id} not found.");

        // Allow owner or admin
        var user = await _context.Users.FindAsync(userId);
        if (listing.SellerId != userId && user?.Role != Domain.Enums.UserRole.Admin)
            throw new UnauthorizedAccessException("You can only delete your own listings.");

        await _listingRepository.DeleteAsync(id);
    }

    public async Task<bool> ToggleFavoriteAsync(int userId, int listingId)
    {
        var existing = await _context.Favorites
            .FirstOrDefaultAsync(f => f.UserId == userId && f.ListingId == listingId);

        if (existing != null)
        {
            _context.Favorites.Remove(existing);
            await _context.SaveChangesAsync();
            return false; // unfavorited
        }

        _context.Favorites.Add(new Favorite { UserId = userId, ListingId = listingId });
        await _context.SaveChangesAsync();
        return true; // favorited
    }

    public async Task<IEnumerable<ListingDto>> GetFavoritesAsync(int userId)
    {
        var favorites = await _context.Favorites
            .Where(f => f.UserId == userId)
            .Include(f => f.Listing)
                .ThenInclude(l => l.Seller)
            .Include(f => f.Listing)
                .ThenInclude(l => l.Category)
            .Where(f => f.Listing.IsActive)
            .Select(f => f.Listing)
            .ToListAsync();

        return _mapper.Map<IEnumerable<ListingDto>>(favorites);
    }
}
