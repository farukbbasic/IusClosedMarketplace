using System.Security.Claims;
using IUSClosedMarketplace.Application.DTOs.Listings;
using IUSClosedMarketplace.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IUSClosedMarketplace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ListingsController : ControllerBase
{
    private readonly IListingService _listingService;

    public ListingsController(IListingService listingService)
    {
        _listingService = listingService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ListingDto>>> GetAll()
    {
        var listings = await _listingService.GetAllActiveAsync();
        return Ok(listings);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ListingDto>> GetById(int id)
    {
        var listing = await _listingService.GetByIdAsync(id);
        if (listing == null) return NotFound();
        return Ok(listing);
    }

    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<ListingDto>>> Search([FromQuery] ListingSearchDto dto)
    {
        var listings = await _listingService.SearchAsync(dto);
        return Ok(listings);
    }

    [HttpGet("seller/{sellerId}")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<ListingDto>>> GetBySeller(int sellerId)
    {
        var listings = await _listingService.GetBySellerIdAsync(sellerId);
        return Ok(listings);
    }

    [HttpGet("my-listings")]
    [Authorize(Roles = "Seller,Admin")]
    public async Task<ActionResult<IEnumerable<ListingDto>>> GetMyListings()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var listings = await _listingService.GetBySellerIdAsync(userId);
        return Ok(listings);
    }

    [HttpPost]
    [Authorize(Roles = "Seller,Admin")]
    public async Task<ActionResult<ListingDto>> Create([FromBody] CreateListingDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var listing = await _listingService.CreateAsync(userId, dto);
        return CreatedAtAction(nameof(GetById), new { id = listing.Id }, listing);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Seller,Admin")]
    public async Task<ActionResult<ListingDto>> Update(int id, [FromBody] UpdateListingDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var listing = await _listingService.UpdateAsync(id, userId, dto);
        return Ok(listing);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<ActionResult> Delete(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _listingService.DeleteAsync(id, userId);
        return NoContent();
    }

    [HttpPost("{listingId}/favorite")]
    [Authorize]
    public async Task<ActionResult> ToggleFavorite(int listingId)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isFavorited = await _listingService.ToggleFavoriteAsync(userId, listingId);
        return Ok(new { isFavorited });
    }

    [HttpGet("favorites")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<ListingDto>>> GetFavorites()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var listings = await _listingService.GetFavoritesAsync(userId);
        return Ok(listings);
    }
}
