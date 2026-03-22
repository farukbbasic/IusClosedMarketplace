using IUSClosedMarketplace.Domain.Entities;
using IUSClosedMarketplace.Persistence.Context;
using IUSClosedMarketplace.Persistence.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace IUSClosedMarketplace.Persistence.Repositories.Implementations;

public class MessageRepository : IMessageRepository
{
    private readonly ApplicationDbContext _context;

    public MessageRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Message>> GetConversationAsync(int userId1, int userId2, int listingId)
    {
        return await _context.Messages
            .Where(m => m.ListingId == listingId &&
                ((m.SenderId == userId1 && m.ReceiverId == userId2) ||
                 (m.SenderId == userId2 && m.ReceiverId == userId1)))
            .Include(m => m.Sender)
            .Include(m => m.Receiver)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Message>> GetUserThreadsAsync(int userId)
    {
        return await _context.Messages
            .Where(m => m.SenderId == userId || m.ReceiverId == userId)
            .Include(m => m.Sender)
            .Include(m => m.Receiver)
            .Include(m => m.Listing)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();
    }

    public async Task<Message> CreateAsync(Message message)
    {
        _context.Messages.Add(message);
        await _context.SaveChangesAsync();
        return message;
    }
}
