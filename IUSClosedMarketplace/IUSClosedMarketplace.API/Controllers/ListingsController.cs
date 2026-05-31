using System.Security.Claims;
using IUSClosedMarketplace.Application.DTOs.Listings;
using IUSClosedMarketplace.Application.Interfaces.Services;
using IUSClosedMarketplace.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IUSClosedMarketplace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ListingsController : ControllerBase
{
    private readonly IListingService _listingService;
    private readonly IFileStorageService _fileStorage;

    public ListingsController(IListingService listingService, IFileStorageService fileStorage)
    {
        _listingService = listingService;
        _fileStorage = fileStorage;
    }

    [HttpPost("upload-images")]
    [Authorize]
    public async Task<ActionResult<string[]>> UploadImages([FromForm] IFormFileCollection files)
    {
        if (files == null || files.Count == 0)
            return BadRequest("No files provided.");
        if (files.Count > 5)
            return BadRequest("Maximum 5 images per listing.");

        var allowed = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp" };
        const long maxBytes = 5 * 1024 * 1024;

        var urls = new List<string>();
        foreach (var file in files)
        {
            if (!allowed.Contains(file.ContentType.ToLower()))
                return BadRequest($"File type '{file.ContentType}' is not allowed. Use JPEG, PNG, GIF or WebP.");
            if (file.Length > maxBytes)
                return BadRequest($"'{file.FileName}' exceeds the 5 MB limit.");

            using var stream = file.OpenReadStream();
            var url = await _fileStorage.SaveFileAsync(stream, file.FileName, "listings");
            urls.Add(url);
        }

        return Ok(urls);
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
    [Authorize]
    public async Task<ActionResult<IEnumerable<ListingDto>>> GetMyListings()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var listings = await _listingService.GetBySellerIdAsync(userId);
        return Ok(listings);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ListingDto>> Create([FromBody] CreateListingDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var listing = await _listingService.CreateAsync(userId, dto);
        return CreatedAtAction(nameof(GetById), new { id = listing.Id }, listing);
    }

    [HttpPut("{id}")]
    [Authorize]
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
