using System.Security.Claims;
using IUSClosedMarketplace.Domain.Entities;
using IUSClosedMarketplace.Domain.Enums;
using IUSClosedMarketplace.Persistence.Repositories.Interfaces;
using Microsoft.AspNetCore.Authentication;

namespace IUSClosedMarketplace.API.Auth;

/// <summary>
/// Bridges Azure AD identities to our internal User table.
///
/// Runs on EVERY authenticated request. It:
///   1. Reads the email from the validated Azure AD token.
///   2. Validates that it's an IUS address (@ius.edu.ba for faculty,
///      @student.ius.edu.ba for students). Defense in depth — the tenant
///      should already enforce this, but never trust the client.
///   3. Finds the matching User row by email, or creates one on first sign-in.
///   4. REPLACES the NameIdentifier claim (which Azure sets to the Object ID
///      GUID) with our internal integer Id, so existing controllers that do
///      `int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier))` keep working.
///   5. Refreshes the Role and Name claims from the DB so admin promotions
///      take effect immediately and aren't frozen at first-login values.
/// </summary>
public class AzureAdClaimsTransformation : IClaimsTransformation
{
    private const string TransformedFlagClaim = "ius_transformed";

    private readonly IServiceProvider _services;
    private readonly ILogger<AzureAdClaimsTransformation> _logger;

    public AzureAdClaimsTransformation(
        IServiceProvider services,
        ILogger<AzureAdClaimsTransformation> logger)
    {
        _services = services;
        _logger = logger;
    }

    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        // IClaimsTransformation can be invoked multiple times per request in
        // some pipelines. The flag claim short-circuits subsequent calls so
        // we don't hit the DB more than once.
        var identity = principal.Identity as ClaimsIdentity;
        if (identity == null || !identity.IsAuthenticated)
            return principal;

        if (identity.HasClaim(c => c.Type == TransformedFlagClaim))
            return principal;

        // Azure AD v2 tokens put the email in `preferred_username`. Older
        // v1 tokens use `upn`. Some configurations also include `email`.
        var email = principal.FindFirstValue("preferred_username")
                 ?? principal.FindFirstValue(ClaimTypes.Upn)
                 ?? principal.FindFirstValue("upn")
                 ?? principal.FindFirstValue(ClaimTypes.Email)
                 ?? principal.FindFirstValue("email");

        if (string.IsNullOrWhiteSpace(email))
        {
            _logger.LogWarning("Azure AD token has no email claim — cannot map to internal user.");
            return principal;
        }

        email = email.Trim().ToLowerInvariant();

        // Accept any email under the IUS domain — faculty (@ius.edu.ba) and
        // students (@student.ius.edu.ba). Splitting on '@' and matching the
        // exact domain or a subdomain prevents look-alikes like
        // "fakeius.edu.ba" from passing.
        var atIndex = email.IndexOf('@');
        if (atIndex < 0)
        {
            _logger.LogWarning("Email claim has no '@' — cannot validate domain: {Email}", email);
            return principal;
        }
        var domain = email.Substring(atIndex + 1);
        if (!(domain.Equals("ius.edu.ba", StringComparison.OrdinalIgnoreCase) ||
              domain.EndsWith(".ius.edu.ba", StringComparison.OrdinalIgnoreCase)))
        {
            _logger.LogWarning("Rejected non-IUS email from Azure AD token: {Email}", email);
            // We don't throw here — returning the principal unchanged means
            // controllers that depend on a valid internal id will still 401/403.
            return principal;
        }

        // Resolve a scoped repository. IClaimsTransformation itself is registered
        // as a singleton, so we cannot inject scoped services through the constructor.
        using var scope = _services.CreateScope();
        var userRepo = scope.ServiceProvider.GetRequiredService<IUserRepository>();

        var user = await userRepo.GetByEmailAsync(email);
        if (user == null)
        {
            // First sign-in for this person — provision a Buyer account.
            var displayName = principal.FindFirstValue("name")
                            ?? principal.FindFirstValue(ClaimTypes.Name)
                            ?? email.Split('@')[0];

            user = new User
            {
                Name = displayName,
                Email = email,
                // PasswordHash is required by the schema but unused with Azure AD.
                // We fill it with a placeholder that no BCrypt verify will accept.
                PasswordHash = "AZURE_AD_AUTH_NO_LOCAL_PASSWORD",
                Role = UserRole.User,
                IsBanned = false
            };

            try
            {
                await userRepo.CreateAsync(user);
                _logger.LogInformation("Auto-provisioned new user from Azure AD: {Email} (Id={Id})",
                    email, user.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to auto-provision user {Email}", email);
                return principal;
            }
        }

        // Always replace NameIdentifier with our internal int Id so controllers
        // that do int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)) work
        // for both normal and banned users.
        foreach (var c in identity.FindAll(ClaimTypes.NameIdentifier).ToList())
            identity.RemoveClaim(c);
        identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()));

        // Replace name claim with the DB display name.
        foreach (var c in identity.FindAll(ClaimTypes.Name).ToList())
            identity.RemoveClaim(c);
        identity.AddClaim(new Claim(ClaimTypes.Name, user.Name));

        // Make sure email is on the standard claim type for any code that reads it.
        if (!identity.HasClaim(c => c.Type == ClaimTypes.Email))
            identity.AddClaim(new Claim(ClaimTypes.Email, user.Email));

        // Strip all role claims first.
        foreach (var c in identity.FindAll(ClaimTypes.Role).ToList())
            identity.RemoveClaim(c);

        // If the account is banned, leave it with no role so [Authorize(Roles="...")]
        // gates fail. Controllers can still read NameIdentifier to show a
        // "your account is suspended" message.
        if (user.IsBanned)
        {
            identity.AddClaim(new Claim(TransformedFlagClaim, "true"));
            return principal;
        }

        // Set role from the authoritative DB value so admin promotions take effect
        // immediately without requiring a new token.
        identity.AddClaim(new Claim(ClaimTypes.Role, user.Role.ToString()));

        identity.AddClaim(new Claim(TransformedFlagClaim, "true"));
        return principal;
    }
}