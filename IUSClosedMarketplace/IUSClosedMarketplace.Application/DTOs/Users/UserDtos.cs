namespace IUSClosedMarketplace.Application.DTOs.Users;

public class UserDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsBanned { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdateUserDto
{
    public string? Name { get; set; }
    public bool? IsBanned { get; set; }
}
