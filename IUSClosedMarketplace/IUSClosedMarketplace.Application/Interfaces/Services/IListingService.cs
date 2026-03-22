using IUSClosedMarketplace.Application.DTOs.Listings;

namespace IUSClosedMarketplace.Application.Interfaces.Services;

public interface IListingService
{
    Task<ListingDto?> GetByIdAsync(int id);
    Task<IEnumerable<ListingDto>> GetAllActiveAsync();
    Task<IEnumerable<ListingDto>> GetBySellerIdAsync(int sellerId);
    Task<IEnumerable<ListingDto>> SearchAsync(ListingSearchDto dto);
    Task<ListingDto> CreateAsync(int sellerId, CreateListingDto dto);
    Task<ListingDto> UpdateAsync(int id, int sellerId, UpdateListingDto dto);
    Task DeleteAsync(int id, int userId);
    Task<bool> ToggleFavoriteAsync(int userId, int listingId);
    Task<IEnumerable<ListingDto>> GetFavoritesAsync(int userId);
}
