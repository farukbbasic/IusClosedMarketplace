using System.Security.Claims;
using IUSClosedMarketplace.Application.DTOs.Reports;
using IUSClosedMarketplace.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IUSClosedMarketplace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<ReportDto>>> GetAll()
    {
        var reports = await _reportService.GetAllAsync();
        return Ok(reports);
    }

    [HttpGet("pending")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<ReportDto>>> GetPending()
    {
        var reports = await _reportService.GetPendingAsync();
        return Ok(reports);
    }

    [HttpPost]
    public async Task<ActionResult<ReportDto>> Create([FromBody] CreateReportDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var report = await _reportService.CreateAsync(userId, dto);
        return Ok(report);
    }

    [HttpPut("{id}/resolve")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ReportDto>> Resolve(int id, [FromBody] ResolveReportDto dto)
    {
        var report = await _reportService.ResolveAsync(id, dto);
        return Ok(report);
    }
}
