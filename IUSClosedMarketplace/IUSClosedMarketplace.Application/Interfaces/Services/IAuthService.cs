using IUSClosedMarketplace.Application.DTOs.Auth;

namespace IUSClosedMarketplace.Application.Interfaces.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
}
