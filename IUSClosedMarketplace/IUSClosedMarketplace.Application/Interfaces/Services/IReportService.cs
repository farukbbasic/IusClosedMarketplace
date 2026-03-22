using IUSClosedMarketplace.Application.DTOs.Reports;

namespace IUSClosedMarketplace.Application.Interfaces.Services;

public interface IReportService
{
    Task<IEnumerable<ReportDto>> GetAllAsync();
    Task<IEnumerable<ReportDto>> GetPendingAsync();
    Task<ReportDto> CreateAsync(int reporterId, CreateReportDto dto);
    Task<ReportDto> ResolveAsync(int reportId, ResolveReportDto dto);
}
