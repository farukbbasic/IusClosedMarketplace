using AutoMapper;
using IUSClosedMarketplace.Application.DTOs.Reports;
using IUSClosedMarketplace.Application.Interfaces.Services;
using IUSClosedMarketplace.Domain.Entities;
using IUSClosedMarketplace.Domain.Enums;
using IUSClosedMarketplace.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace IUSClosedMarketplace.Application.Services;

public class ReportService : IReportService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public ReportService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<IEnumerable<ReportDto>> GetAllAsync()
    {
        var reports = await _context.Reports
            .Include(r => r.Reporter)
            .Include(r => r.Listing)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<ReportDto>>(reports);
    }

    public async Task<IEnumerable<ReportDto>> GetPendingAsync()
    {
        var reports = await _context.Reports
            .Where(r => r.Status == ReportStatus.Pending)
            .Include(r => r.Reporter)
            .Include(r => r.Listing)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<ReportDto>>(reports);
    }

    public async Task<ReportDto> CreateAsync(int reporterId, CreateReportDto dto)
    {
        var listing = await _context.Listings.FindAsync(dto.ListingId)
            ?? throw new KeyNotFoundException("Listing not found.");

        var report = new Report
        {
            ReporterId = reporterId,
            ListingId = dto.ListingId,
            Reason = dto.Reason,
            Status = ReportStatus.Pending
        };

        _context.Reports.Add(report);
        await _context.SaveChangesAsync();

        // Reload with includes
        var created = await _context.Reports
            .Include(r => r.Reporter)
            .Include(r => r.Listing)
            .FirstAsync(r => r.Id == report.Id);

        return _mapper.Map<ReportDto>(created);
    }

    public async Task<ReportDto> ResolveAsync(int reportId, ResolveReportDto dto)
    {
        var report = await _context.Reports
            .Include(r => r.Reporter)
            .Include(r => r.Listing)
            .FirstOrDefaultAsync(r => r.Id == reportId)
            ?? throw new KeyNotFoundException("Report not found.");

        switch (dto.Action.ToLower())
        {
            case "removelisting":
                var listing = await _context.Listings.FindAsync(report.ListingId);
                if (listing != null) listing.IsActive = false;
                report.Status = ReportStatus.Resolved;
                break;

            case "banuser":
                var listingForBan = await _context.Listings.FindAsync(report.ListingId);
                if (listingForBan != null)
                {
                    var seller = await _context.Users.FindAsync(listingForBan.SellerId);
                    if (seller != null) seller.IsBanned = true;
                    listingForBan.IsActive = false;
                }
                report.Status = ReportStatus.Resolved;
                break;

            case "dismiss":
                report.Status = ReportStatus.Dismissed;
                break;

            default: // resolve
                report.Status = ReportStatus.Resolved;
                break;
        }

        await _context.SaveChangesAsync();
        return _mapper.Map<ReportDto>(report);
    }
}
