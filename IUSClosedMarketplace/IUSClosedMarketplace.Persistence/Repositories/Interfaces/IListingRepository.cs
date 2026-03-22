using IUSClosedMarketplace.Domain.Entities;

namespace IUSClosedMarketplace.Persistence.Repositories.Interfaces;

public interface IListingRepository
{
    Task<Listing?> GetByIdAsync(int id);
    Task<IEnumerable<Listing>> GetAllActiveAsync();
    Task<IEnumerable<Listing>> GetBySellerIdAsync(int sellerId);
    Task<IEnumerable<Listing>> SearchAsync(string? keyword, int? categoryId, decimal? minPrice, decimal? maxPrice, string? sortBy);
    Task<Listing> CreateAsync(Listing listing);
    Task UpdateAsync(Listing listing);
    Task DeleteAsync(int id);
    Task<int> GetCountByCategoryAsync(int categoryId);
    Task<int> GetActiveCountAsync();
}
