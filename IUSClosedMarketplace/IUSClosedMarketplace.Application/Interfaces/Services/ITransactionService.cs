using IUSClosedMarketplace.Application.DTOs.Transactions;

namespace IUSClosedMarketplace.Application.Interfaces.Services;

public interface ITransactionService
{
    Task<IEnumerable<TransactionDto>> GetByUserAsync(int userId);
    Task<TransactionDto> CreateAsync(int buyerId, CreateTransactionDto dto);
    Task<TransactionDto> ConfirmAsync(int transactionId, int sellerId);
    Task RejectAsync(int transactionId, int sellerId);
    Task<AnalyticsDto> GetAnalyticsAsync();
}
