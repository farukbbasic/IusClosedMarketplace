using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IUSClosedMarketplace.API.Controllers;

/// <summary>
/// With Azure AD as the identity provider, register and login no longer happen
/// in our backend. This controller now only exposes a simple "who am I"
/// endpoint that works against the Azure-issued token, useful for debugging.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    /// <summary>
    /// Returns the claims attached to the current bearer token, after the
    /// AzureAdClaimsTransformation has resolved the internal user id.
    /// </summary>
    [HttpGet("whoami")]
    [Authorize]
    public ActionResult WhoAmI()
    {
        return Ok(new
        {
            internalId = User.FindFirstValue(ClaimTypes.NameIdentifier),
            name = User.FindFirstValue(ClaimTypes.Name),
            email = User.FindFirstValue(ClaimTypes.Email),
            role = User.FindFirstValue(ClaimTypes.Role)
        });
    }
}
