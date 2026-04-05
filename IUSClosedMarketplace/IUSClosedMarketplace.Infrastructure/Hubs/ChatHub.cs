using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace IUSClosedMarketplace.Infrastructure.Hubs;

[Authorize]
public class ChatHub : Hub
{
    public async Task JoinThread(int threadId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"thread_{threadId}");
    }

    public async Task LeaveThread(int threadId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"thread_{threadId}");
    }
}