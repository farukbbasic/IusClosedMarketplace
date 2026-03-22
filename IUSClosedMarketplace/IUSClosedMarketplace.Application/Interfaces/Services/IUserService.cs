using IUSClosedMarketplace.Application.DTOs.Users;

namespace IUSClosedMarketplace.Application.Interfaces.Services;

public interface IUserService
{
    Task<UserDto?> GetByIdAsync(int id);
    Task<IEnumerable<UserDto>> GetAllAsync();
    Task<UserDto> UpdateAsync(int id, UpdateUserDto dto);
    Task ToggleBanAsync(int id);
    Task DeleteAsync(int id);
}
