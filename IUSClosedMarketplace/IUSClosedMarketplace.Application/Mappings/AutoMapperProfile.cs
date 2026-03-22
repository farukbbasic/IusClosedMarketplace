using AutoMapper;
using IUSClosedMarketplace.Application.DTOs.Listings;
using IUSClosedMarketplace.Application.DTOs.Messages;
using IUSClosedMarketplace.Application.DTOs.Reports;
using IUSClosedMarketplace.Application.DTOs.Transactions;
using IUSClosedMarketplace.Application.DTOs.Users;
using IUSClosedMarketplace.Domain.Entities;

namespace IUSClosedMarketplace.Application.Mappings;

public class AutoMapperProfile : Profile
{
    public AutoMapperProfile()
    {
        // User
        CreateMap<User, UserDto>()
            .ForMember(d => d.Role, o => o.MapFrom(s => s.Role.ToString()));

        // Listing
        CreateMap<Listing, ListingDto>()
            .ForMember(d => d.CategoryName, o => o.MapFrom(s => s.Category != null ? s.Category.Name : ""))
            .ForMember(d => d.SellerName, o => o.MapFrom(s => s.Seller != null ? s.Seller.Name : ""));

        CreateMap<CreateListingDto, Listing>();
        CreateMap<UpdateListingDto, Listing>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Message
        CreateMap<Message, MessageDto>()
            .ForMember(d => d.SenderName, o => o.MapFrom(s => s.Sender != null ? s.Sender.Name : ""))
            .ForMember(d => d.ReceiverName, o => o.MapFrom(s => s.Receiver != null ? s.Receiver.Name : ""))
            .ForMember(d => d.ListingTitle, o => o.MapFrom(s => s.Listing != null ? s.Listing.Title : ""));

        // Report
        CreateMap<Report, ReportDto>()
            .ForMember(d => d.Status, o => o.MapFrom(s => s.Status.ToString()))
            .ForMember(d => d.ReporterName, o => o.MapFrom(s => s.Reporter != null ? s.Reporter.Name : ""))
            .ForMember(d => d.ListingTitle, o => o.MapFrom(s => s.Listing != null ? s.Listing.Title : ""));

        // Transaction
        CreateMap<Transaction, TransactionDto>()
            .ForMember(d => d.BuyerName, o => o.MapFrom(s => s.Buyer != null ? s.Buyer.Name : ""))
            .ForMember(d => d.SellerName, o => o.MapFrom(s => s.Seller != null ? s.Seller.Name : ""))
            .ForMember(d => d.ListingTitle, o => o.MapFrom(s => s.Listing != null ? s.Listing.Title : ""));
    }
}
