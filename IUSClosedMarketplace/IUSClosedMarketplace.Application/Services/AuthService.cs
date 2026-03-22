using IUSClosedMarketplace.Application.DTOs.Auth;
using IUSClosedMarketplace.Application.Interfaces.Services;
using IUSClosedMarketplace.Domain.Entities;
using IUSClosedMarketplace.Domain.Enums;
using IUSClosedMarketplace.Infrastructure.Services;
using IUSClosedMarketplace.Persistence.Repositories.Interfaces;

namespace IUSClosedMarketplace.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtService _jwtService;

    public AuthService(IUserRepository userRepository, IJwtService jwtService)
    {
        _userRepository = userRepository;
        _jwtService = jwtService;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        // Validate IUS email
        if (!dto.Email.EndsWith("@ius.edu.ba", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Only IUS email addresses are allowed.");

        // Check if email exists
        var existing = await _userRepository.GetByEmailAsync(dto.Email);
        if (existing != null)
            throw new InvalidOperationException("An account with this email already exists.");

        // Parse role
        if (!Enum.TryParse<UserRole>(dto.Role, true, out var role) || role == UserRole.Admin)
            role = UserRole.Buyer;

        var user = new User
        {
            Name = dto.Name,
            Email = dto.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = role
        };

        await _userRepository.CreateAsync(user);

        var token = _jwtService.GenerateToken(user);

        return new AuthResponseDto
        {
            UserId = user.Id,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role.ToString(),
            Token = token
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await _userRepository.GetByEmailAsync(dto.Email.ToLower());
        if (user == null)
            throw new UnauthorizedAccessException("Invalid email or password.");

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        if (user.IsBanned)
            throw new UnauthorizedAccessException("Your account has been suspended.");

        var token = _jwtService.GenerateToken(user);

        return new AuthResponseDto
        {
            UserId = user.Id,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role.ToString(),
            Token = token
        };
    }
}
