using AutoMapper;
using IUSClosedMarketplace.Application.DTOs.Messages;
using IUSClosedMarketplace.Application.Interfaces.Services;
using IUSClosedMarketplace.Domain.Entities;
using IUSClosedMarketplace.Persistence.Repositories.Interfaces;

namespace IUSClosedMarketplace.Application.Services;

public class MessageService : IMessageService
{
    private readonly IMessageRepository _messageRepository;
    private readonly IMapper _mapper;

    public MessageService(IMessageRepository messageRepository, IMapper mapper)
    {
        _messageRepository = messageRepository;
        _mapper = mapper;
    }

    public async Task<IEnumerable<MessageDto>> GetConversationAsync(int userId, int otherUserId, int listingId)
    {
        var messages = await _messageRepository.GetConversationAsync(userId, otherUserId, listingId);
        return _mapper.Map<IEnumerable<MessageDto>>(messages);
    }

    public async Task<IEnumerable<ConversationThreadDto>> GetThreadsAsync(int userId)
    {
        var messages = await _messageRepository.GetUserThreadsAsync(userId);

        var threads = messages
            .GroupBy(m => new
            {
                OtherUserId = m.SenderId == userId ? m.ReceiverId : m.SenderId,
                m.ListingId
            })
            .Select(g =>
            {
                var lastMsg = g.OrderByDescending(m => m.CreatedAt).First();
                var otherUser = lastMsg.SenderId == userId ? lastMsg.Receiver : lastMsg.Sender;
                return new ConversationThreadDto
                {
                    OtherUserId = g.Key.OtherUserId,
                    OtherUserName = otherUser?.Name ?? "Unknown",
                    ListingId = g.Key.ListingId,
                    ListingTitle = lastMsg.Listing?.Title ?? "Unknown",
                    LastMessage = lastMsg.Content,
                    LastMessageTime = lastMsg.CreatedAt
                };
            })
            .OrderByDescending(t => t.LastMessageTime)
            .ToList();

        return threads;
    }

    public async Task<MessageDto> SendMessageAsync(int senderId, SendMessageDto dto)
    {
        var message = new Message
        {
            SenderId = senderId,
            ReceiverId = dto.ReceiverId,
            ListingId = dto.ListingId,
            Content = dto.Content
        };

        var created = await _messageRepository.CreateAsync(message);

        // Re-fetch to get navigation properties
        var conversation = await _messageRepository.GetConversationAsync(senderId, dto.ReceiverId, dto.ListingId);
        var latest = conversation.OrderByDescending(m => m.CreatedAt).First();

        return _mapper.Map<MessageDto>(latest);
    }
}
