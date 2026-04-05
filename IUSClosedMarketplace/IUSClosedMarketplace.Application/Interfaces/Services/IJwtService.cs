using IUSClosedMarketplace.Domain.Entities;

namespace IUSClosedMarketplace.Application.Interfaces.Services;

public interface IJwtService
{
    string GenerateToken(User user);
}
