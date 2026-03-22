using System.Security.Claims;
using IUSClosedMarketplace.Application.DTOs.Transactions;
using IUSClosedMarketplace.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IUSClosedMarketplace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionService _transactionService;

    public TransactionsController(ITransactionService transactionService)
    {
        _transactionService = transactionService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TransactionDto>>> GetMyTransactions()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var transactions = await _transactionService.GetByUserAsync(userId);
        return Ok(transactions);
    }

    [HttpPost]
    public async Task<ActionResult<TransactionDto>> Create([FromBody] CreateTransactionDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var transaction = await _transactionService.CreateAsync(userId, dto);
        return Ok(transaction);
    }

    [HttpGet("analytics")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<AnalyticsDto>> GetAnalytics()
    {
        var analytics = await _transactionService.GetAnalyticsAsync();
        return Ok(analytics);
    }
}
