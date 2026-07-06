# Vista Hotel Management — Backend

REST API for a full-featured hotel management system. Handles authentication, room inventory, guest records, reservations, check-in/check-out workflows, invoicing, analytics, and staff administration.

Pairs with the [React frontend](https://github.com/AbbasSk2004/react-vista-hotel-management).

---

## Overview

The API is built with Express and MongoDB (via Mongoose). Every protected route requires a valid JWT. Role-based middleware separates admin-only operations (room CRUD, reports, staff management) from day-to-day receptionist tasks.

The data layer uses repository-style model wrappers around Mongoose schemas, with backward-compatible support for legacy PostgreSQL integer IDs (`postgreSQL_id` fields) from an earlier migration.

---

## Features

- **JWT authentication** — Secure login with bcrypt-hashed passwords
- **Room management** — CRUD with status tracking (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`)
- **Guest profiles** — Create and search guests
- **Reservations** — Booking lifecycle from `PENDING` through `CHECKED_OUT`
- **Check-in / Check-out** — Status updates; checkout generates invoices
- **Invoicing** — Linked to reservations with payment tracking
- **Reports** — Occupancy, revenue by month, room status breakdown (admin)
- **Staff management** — Admin-only CRUD for hotel staff accounts

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 18+ |
| Framework | Express.js 4 |
| Database | MongoDB (Mongoose 8) |
| Auth | JSON Web Tokens + bcryptjs |
| Config | dotenv |

---

## Prerequisites

- **Node.js 18+** and npm
- **MongoDB 6+** running locally or via [MongoDB Atlas](https://www.mongodb.com/atlas)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/AbbasSk2004/vista-hotel-backend.git
cd vista-hotel-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: `5000`) |
| `MONGODB_URL` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret key for signing tokens — use a long random string |
| `JWT_EXPIRES_IN` | No | Token lifetime (default: `24h`) |

**Example `.env` for local development:**

```env
PORT=5000
MONGODB_URL=mongodb://localhost:27017/hotel_management
JWT_SECRET=change-this-to-a-long-random-string
JWT_EXPIRES_IN=24h
```

### 4. Seed the database

Populate demo staff accounts and sample rooms:

```bash
npm run seed
```

### 5. Start the server

```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

The API will be available at **http://localhost:5000**.

Verify it's running:

```bash
curl http://localhost:5000/api/health
# {"status":"ok"}
```

---

## Demo Accounts

After seeding:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@hotel.com` | `admin123` |
| Receptionist | `reception@hotel.com` | `recept123` |

---

## API Reference

Base URL: `http://localhost:5000/api`

All routes except `/auth/login` and `/health` require:

```
Authorization: Bearer <jwt_token>
```

### Authentication

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/auth/login` | Public | Login with email and password |
| `GET` | `/auth/me` | Authenticated | Get current staff profile |

**Login request:**

```json
{
  "email": "admin@hotel.com",
  "password": "admin123"
}
```

**Login response:**

```json
{
  "token": "eyJhbG...",
  "user": {
    "staff_id": "...",
    "full_name": "System Admin",
    "email": "admin@hotel.com",
    "role": "ADMIN"
  }
}
```

### Rooms

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/rooms` | All staff | List rooms (`?status=`, `?type=`) |
| `POST` | `/rooms` | Admin | Create a room |
| `PUT` | `/rooms/:id` | Admin | Update a room |
| `DELETE` | `/rooms/:id` | Admin | Delete a room |

**Room types:** `SINGLE`, `DOUBLE`, `SUITE`  
**Room statuses:** `AVAILABLE`, `OCCUPIED`, `MAINTENANCE`

### Guests

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/guests` | All staff | List guests (`?search=`) |
| `GET` | `/guests/:id` | All staff | Get guest by ID |
| `POST` | `/guests` | All staff | Register a new guest |

### Reservations

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/reservations` | All staff | List reservations (`?search=`, `?status=`, `?date=`) |
| `POST` | `/reservations` | All staff | Create a reservation |
| `PUT` | `/reservations/:id/checkin` | All staff | Check in a guest |
| `PUT` | `/reservations/:id/checkout` | All staff | Check out and generate invoice |

**Reservation statuses:** `PENDING`, `CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `CANCELLED`

### Invoices

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/invoices/:reservationId` | All staff | Get invoice for a reservation |

### Reports

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/reports/summary` | Admin | Dashboard metrics and revenue data |

### Staff

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/staff` | Admin | List all staff |
| `POST` | `/staff` | Admin | Create staff account |
| `PUT` | `/staff/:id` | Admin | Update staff member |
| `DELETE` | `/staff/:id` | Admin | Delete staff member |

> Admins cannot delete their own account. Passwords are always bcrypt-hashed before storage.

### Health Check

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/health` | Public | Server health status |

---

## Project Structure

```
backend/
├── server.js                 # App entry point
├── src/
│   ├── config/
│   │   └── db.js             # MongoDB connection
│   ├── controllers/          # Request handlers
│   ├── middleware/
│   │   ├── authMiddleware.js # JWT verification
│   │   └── roleMiddleware.js # Role-based access
│   ├── models/               # Mongoose schemas + data access
│   │   ├── Staff.js
│   │   ├── Room.js
│   │   ├── Guest.js
│   │   ├── Reservation.js
│   │   └── Invoice.js
│   ├── routes/               # Express routers
│   └── utils/
│       └── helpers.js
└── scripts/
    ├── seed-mongodb.js       # Database seeder
    └── migration-workflow.js # Legacy PostgreSQL → MongoDB migration
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the API server |
| `npm run dev` | Start with file-watch (Node `--watch`) |
| `npm run seed` | Seed demo staff and sample rooms |

---

## Database Collections

| Collection | Purpose |
|------------|---------|
| `staff` | Hotel employees with roles and hashed passwords |
| `rooms` | Room inventory with pricing and status |
| `guests` | Guest contact information |
| `reservations` | Bookings linking guests to rooms |
| `invoices` | Billing records generated at checkout |

---

## Security Notes

- Never commit `.env` — it contains secrets
- Use a strong, unique `JWT_SECRET` in production
- Change default demo passwords before deploying
- CORS is enabled for all origins in development; restrict it in production

---

## Related Repository

| Repo | Purpose |
|------|---------|
| [react-vista-hotel-management](https://github.com/AbbasSk2004/react-vista-hotel-management) | React dashboard (frontend) |

---

## License

Built as part of a university software engineering project. Free to use for learning and reference.
