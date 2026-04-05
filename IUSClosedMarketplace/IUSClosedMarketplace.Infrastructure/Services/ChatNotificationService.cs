using IUSClosedMarketplace.Application.Interfaces.Services;
using IUSClosedMarketplace.Infrastructure.Hubs;
using IUSClosedMarketplace.Application.DTOs.Messages;
using Microsoft.AspNetCore.SignalR;

namespace IUSClosedMarketplace.Infrastructure.Services;

public class ChatNotificationService : IChatNotificationService
{
    private readonly IHubContext<ChatHub> _hubContext;

    public ChatNotificationService(IHubContext<ChatHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyNewMessage(int threadId, MessageDto message)
    {
        await _hubContext.Clients
            .Group($"thread_{threadId}")
            .SendAsync("ReceiveMessage", message);
    }
}