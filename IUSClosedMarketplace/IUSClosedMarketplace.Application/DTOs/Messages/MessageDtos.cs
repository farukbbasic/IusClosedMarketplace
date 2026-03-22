using System.ComponentModel.DataAnnotations;

namespace IUSClosedMarketplace.Application.DTOs.Messages;

public class MessageDto
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public int SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public int ReceiverId { get; set; }
    public string ReceiverName { get; set; } = string.Empty;
    public int ListingId { get; set; }
    public string ListingTitle { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class SendMessageDto
{
    [Required]
    public int ReceiverId { get; set; }

    [Required]
    public int ListingId { get; set; }

    [Required]
    [MaxLength(2000)]
    public string Content { get; set; } = string.Empty;
}

public class ConversationThreadDto
{
    public int OtherUserId { get; set; }
    public string OtherUserName { get; set; } = string.Empty;
    public int ListingId { get; set; }
    public string ListingTitle { get; set; } = string.Empty;
    public string LastMessage { get; set; } = string.Empty;
    public DateTime LastMessageTime { get; set; }
}
