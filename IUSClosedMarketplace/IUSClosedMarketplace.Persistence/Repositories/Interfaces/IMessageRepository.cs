using IUSClosedMarketplace.Domain.Entities;

namespace IUSClosedMarketplace.Persistence.Repositories.Interfaces;

public interface IMessageRepository
{
    Task<IEnumerable<Message>> GetConversationAsync(int userId1, int userId2, int listingId);
    Task<IEnumerable<Message>> GetUserThreadsAsync(int userId);
    Task<Message> CreateAsync(Message message);
}
