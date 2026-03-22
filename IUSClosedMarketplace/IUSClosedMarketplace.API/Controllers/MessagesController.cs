using System.Security.Claims;
using IUSClosedMarketplace.Application.DTOs.Messages;
using IUSClosedMarketplace.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IUSClosedMarketplace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly IMessageService _messageService;

    public MessagesController(IMessageService messageService)
    {
        _messageService = messageService;
    }

    [HttpGet("threads")]
    public async Task<ActionResult<IEnumerable<ConversationThreadDto>>> GetThreads()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var threads = await _messageService.GetThreadsAsync(userId);
        return Ok(threads);
    }

    [HttpGet("conversation")]
    public async Task<ActionResult<IEnumerable<MessageDto>>> GetConversation(
        [FromQuery] int otherUserId, [FromQuery] int listingId)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var messages = await _messageService.GetConversationAsync(userId, otherUserId, listingId);
        return Ok(messages);
    }

    [HttpPost]
    public async Task<ActionResult<MessageDto>> Send([FromBody] SendMessageDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var message = await _messageService.SendMessageAsync(userId, dto);
        return Ok(message);
    }
}
