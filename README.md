<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# 🎟️ Event & Cinema Booking System

A production-ready, highly scalable, and DRY-compliant backend system for event and cinema bookings built with **NestJS**, **Prisma**, and **PostgreSQL**.

## 🚀 Overview

This system provides a robust architecture for managing events, venues, screens, and a multi-step seat booking flow with temporary locks and transactional consistency.

## 🏗️ Architecture

The project follows a modular and DRY (Don't Repeat Yourself) architecture:

- **Core Framework**: NestJS (v11+)
- **Database ORM**: Prisma (PostgreSQL)
- **Authentication**: JWT-based Auth with Access & Refresh tokens.
- **Validation**: Strict DTO validation using `class-validator` and `class-transformer`.
- **DRY Patterns**:
  - **`PrismaBaseRepository`**: A generic repository abstraction to eliminate standard CRUD boilerplate.
  - **`Auth` Decorator**: A composite decorator bundling JWT guards, Roles, and Swagger documentation.
  - **Centralized Slug Generator**: An asynchronous utility for collision-free, unique URL slug generation across all entities.
- **Reliability**: Transactional booking flow using Prisma `$transaction` to prevent overbooking and double-locking.

---

## 🛠️ Setup & Installation

### Prerequisites

- Node.js (v18+)
- PostgreSQL
- pnpm (Recommended)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/booking-system.git
   cd booking-system
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add your credentials:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/booking_system"
   PORT=3000
   NODE_ENV=development

   # Authentication
   JWT_ACCESS_SECRET="your-access-secret"
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_SECRET="your-refresh-secret"
   JWT_REFRESH_EXPIRES=7d
   ```

4. **Database Setup**:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Start the application**:
   ```bash
   # Development
   pnpm run start:dev

   # Production
   pnpm run build
   pnpm run start:prod
   ```

---

## 📡 API Documentation

Once the server is running, you can access the interactive **Swagger API** documentation at:
`http://localhost:3000/api/docs`

### Core Modules
| Module | Description |
| :--- | :--- |
| **Auth** | User registration, login, and token refreshing. |
| **Events** | Event management with unique slugs and categorization. |
| **Venues** | Venue/Cinema hall details and city-based filtering. |
| **Screens** | Screen configurations within venues. |
| **Seats** | Real-time seat availability and layout management. |
| **Shows** | Scheduling events on specific screens. |
| **Bookings** | The core transactional booking engine. |
| **Payments** | Simulated payment processing and booking confirmation. |

---

## 🔄 Booking Flow

The system implements a reliable seat-locking mechanism to ensure a smooth user experience.

1.  **Selection**: User browses events, selects a show, and picks specific seat IDs.
2.  **Creation (POST `/bookings`)**:
    *   System validates that all selected seats are `AVAILABLE`.
    *   Seats are temporarily `LOCKED` (5-minute expiry) to prevent other users from picking them.
    *   A `Booking` record is created in `PENDING` status.
3.  **Payment Processing (POST `/payments/process`)**:
    *   System verifies the booking is still within the lock time.
    *   **Success**: Seats are updated to `BOOKED`, and the booking is `CONFIRMED`.
    *   **Failure**: Seats are released back to `AVAILABLE`, and the booking is `CANCELLED`.
4.  **Auto-Release**: A scheduled task (Cron) automatically releases any expired `PENDING` bookings to keep inventory fresh.

---

## 🧪 Testing

```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e
```

## 📜 License

This project is [UNLICENSED](LICENSE).
