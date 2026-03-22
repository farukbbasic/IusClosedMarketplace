# IUS Closed Marketplace

A private web-based marketplace for International University of Sarajevo (IUS) students and staff.

**Stack:** ASP.NET Core 8 Web API · React 18 · SQL Server · Docker

---

## Quick Start (Docker — recommended)

> This is all you need. One command, everything runs.

### Prerequisites

- **Docker Desktop** — [Download here](https://www.docker.com/products/docker-desktop/)

### Run

```bash
git clone <your-repo-url>
cd IUSClosedMarketplace

docker compose up --build
```

Wait 30–60 seconds for SQL Server to initialize, then open:

- **Frontend:** http://localhost:3000
- **API Swagger:** http://localhost:5000/swagger

### First-time setup

1. Open http://localhost:3000
2. Click **Register** and create an account (use any `@ius.edu.ba` email)
3. To make yourself an admin, run this command:

```bash
docker exec -it ius-db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "IusMarket@2025!" -d IUSClosedMarketplace -C -Q "UPDATE Users SET Role = 'Admin' WHERE Email = 'youremail@ius.edu.ba'"
```

### Stop / Restart

```bash
docker compose down          # Stop everything
docker compose up -d         # Start in background
docker compose down -v       # Stop and DELETE all data (fresh start)
```

---

## Architecture

```
IUSClosedMarketplace/
├── IUSClosedMarketplace.API/           → Controllers, Middleware, Program.cs
├── IUSClosedMarketplace.Application/   → Services, DTOs, Interfaces, AutoMapper
├── IUSClosedMarketplace.Domain/        → Entities, Enums, Base classes
├── IUSClosedMarketplace.Persistence/   → DbContext, EF Configs, Repositories
├── IUSClosedMarketplace.Infrastructure/→ JWT, Email, File Storage services
├── frontend/                           → React app (Vite + React Router)
├── docker-compose.yml                  → Orchestrates DB + API + Frontend
├── Dockerfile.api                      → Multi-stage .NET build
└── frontend/Dockerfile                 → Multi-stage React build + nginx
```

### Docker Services

| Service | Container | Port | Description |
|---------|-----------|------|-------------|
| db | ius-db | 1433 | SQL Server 2022 Express |
| api | ius-api | 5000 | ASP.NET Core Web API |
| frontend | ius-frontend | 3000 | React app served by nginx |

Nginx in the frontend container proxies /api/* requests to the .NET backend, so everything works through port 3000.

---

## Manual Setup (without Docker)

If you prefer running things locally:

### Prerequisites
- .NET 8 SDK
- Node.js 18+
- SQL Server (LocalDB, Express, or Docker)

### Backend
```bash
# Update connection string in IUSClosedMarketplace.API/appsettings.json
dotnet restore
dotnet ef migrations add InitialCreate --project IUSClosedMarketplace.Persistence --startup-project IUSClosedMarketplace.API
dotnet ef database update --project IUSClosedMarketplace.Persistence --startup-project IUSClosedMarketplace.API
cd IUSClosedMarketplace.API
set ASPNETCORE_ENVIRONMENT=Development
dotnet run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:3000, API at http://localhost:5000.

---

## API Endpoints

### Auth
- POST /api/auth/register — Register (IUS emails only)
- POST /api/auth/login — Login, returns JWT

### Listings
- GET /api/listings — All active listings
- GET /api/listings/{id} — Listing details
- GET /api/listings/search — Search and filter
- POST /api/listings — Create (Seller/Admin)
- PUT /api/listings/{id} — Update
- DELETE /api/listings/{id} — Soft-delete
- POST /api/listings/{id}/favorite — Toggle favorite
- GET /api/listings/favorites — User favorites

### Messages
- GET /api/messages/threads — Conversation threads
- GET /api/messages/conversation — Get messages
- POST /api/messages — Send message

### Reports
- GET /api/reports — All reports (Admin)
- POST /api/reports — Create report
- PUT /api/reports/{id}/resolve — Resolve (Admin)

### Transactions
- GET /api/transactions — User transactions
- POST /api/transactions — Complete purchase
- GET /api/transactions/analytics — Analytics (Admin)

### Users
- GET /api/users — All users (Admin)
- GET /api/users/me — Current user
- PUT /api/users/{id}/toggle-ban — Ban/unban (Admin)

---

## Features

- JWT authentication with role-based access (Admin, Seller, Buyer)
- IUS email restriction on registration
- Full CRUD listings with search, filter, sort
- Private messaging with conversation threads
- Favorites system
- Reporting and moderation workflow
- Simulated transaction history
- Admin dashboard with analytics
- Clean architecture with proper separation of concerns
- Fully Dockerized — one command to run
