using IUSClosedMarketplace.Application.DTOs.Messages;

namespace IUSClosedMarketplace.Application.Interfaces.Services;

public interface IMessageService
{
    Task<IEnumerable<MessageDto>> GetConversationAsync(int userId, int otherUserId, int listingId);
    Task<IEnumerable<ConversationThreadDto>> GetThreadsAsync(int userId);
    Task<MessageDto> SendMessageAsync(int senderId, SendMessageDto dto);
}
