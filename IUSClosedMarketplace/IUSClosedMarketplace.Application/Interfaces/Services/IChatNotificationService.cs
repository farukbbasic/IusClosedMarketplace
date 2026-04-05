using IUSClosedMarketplace.Application.DTOs.Messages;

namespace IUSClosedMarketplace.Application.Interfaces.Services;

public interface IChatNotificationService
{
    Task NotifyNewMessage(int threadId, MessageDto message);
}