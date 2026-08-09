# Gravity Backend

A robust, enterprise-grade backend server for **Gravity**, a booking and scheduling marketplace for construction and renovation services. Built with TypeScript, Node.js, Express, and MongoDB, this backend strictly adheres to Clean Architecture and Domain-Driven Design (DDD) principles.

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express (with ts-node for development execution)
- **Database**: MongoDB (via Mongoose ODM)
- **In-Memory Store**: Redis (for caching, sessions, and background scheduling)
- **Dependency Injection**: InversifyJS (with reflect-metadata)
- **Authentication**: JWT (Access & Refresh tokens with cookie storage), Passport.js (Google OAuth 2.0)
- **Storage**: AWS S3 (via `@aws-sdk/client-s3`)
- **Payments**: Stripe API (checkout sessions & secure webhooks)
- **Real-time**: Socket.IO (for instant chat/conversations and real-time notifications)
- **Validation**: Zod (for type-safe environment variable parsing and DTO verification)
- **Logging**: Winston (configured with Daily Rotate File)

---

## 🏗️ Architecture Design (DDD & Clean Architecture)

The project is structured under Clean Architecture principles to enforce separation of concerns, decoupling from external frameworks, and high testability.

```
src/
├── domain/            # Enterprise Core (Entities, Enums, Interfaces, Value Objects)
│   ├── entities/      # Pure business models (User, Company, Booking, SlotConfig, etc.)
│   ├── enums/         # Domain-level status codes, purposes, payment statuses
│   ├── repositories/  # Repository interfaces (contracts for data access)
│   └── services/      # Service interfaces (contracts for S3, Stripe, Email, Logger, etc.)
│
├── application/       # Application Logic (Use Cases & App Services)
│   ├── use-cases/     # Executable command modules (e.g., BookSlotUseCase, RegisterUseCase)
│   └── services/      # Background services (ReminderService, NotificationService)
│
├── infrastructure/    # Frameworks & Drivers (Implementations of Domain Contracts)
│   ├── config/        # Environment configurations (Redis, Mongo, Environment validation)
│   ├── database/      # Database models (Mongoose schemas)
│   ├── DI/            # Dependency Injection container setup (Inversify config)
│   ├── repositories/  # Concrete repository implementations (accessing Mongo/Redis)
│   ├── services/      # Concrete third-party implementations (Stripe, S3, Email, JWT, OTP)
│   ├── sockets/       # Socket.IO event mapping & connection management
│   └── strategies/    # Passport authentication strategies (Google OAuth)
│
├── presentation/      # Delivery Layer (HTTP Routes, Controllers, & Middleware)
│   ├── controllers/   # Controllers mapping incoming requests to Use Cases
│   ├── middlewares/   # Auth verification, file upload (Multer), Global Error handlers
│   └── routes/        # Express router definitions
│
├── shared/            # Cross-cutting concerns (Constants, Custom AppErrors, shared types)
└── types/             # Custom TypeScript type definitions
```

---

## 🔑 Environment Configuration

Create a `.env` file in the `backend/` root directory and configure the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development # development | test | production

# Client/Frontend URL (comma-separated for CORS whitelist)
FRONTEND_URL=http://localhost:3000,https://www.gravityconstruction.co.in

# Database Config
MONGO_URI=mongodb://localhost:27017/gravity
REDIS_URL=redis://localhost:6379

# JWT Config
JWT_ACCESS_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# AWS S3 Storage Config
AWS_REGION=your_aws_region
AWS_ACCESS_KEY=your_aws_access_key
AWS_SECRET_KEY=your_aws_secret_key
S3_BUCKET=your_s3_bucket_name
S3_URL_EXPIRATION=86400

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id

# Mail Configuration (Nodemailer)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Stripe Config (Payments & Webhooks)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

---

## 🛠️ Setup & Running

### Prerequisites
Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (running locally or cloud cluster)
- [Redis](https://redis.io/) (running locally or cloud instance)

### Installation
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally
To spin up the server in development mode (runs with `ts-node` and `nodemon` for auto-reloading):
```bash
npm run dev
```

### Production Build & Launch
1. Build the TypeScript codebase to the `dist` directory:
   ```bash
   npm run build
   ```
2. Start the compiled production build:
   ```bash
   npm run start
   ```

### Linting
Run ESLint to analyze static code structure:
```bash
npm run lint
```
To automatically fix linting issues:
```bash
npm run lint:fix
```

---

## 📡 API Routing Structure

All API endpoints are prefixed logically based on their domain responsibility:

| Endpoint Prefix | Description |
| :--- | :--- |
| `/auth` | Authentication routes (Register, Login, OTP Verification, Google OAuth, Refresh Tokens) |
| `/user` | User-focused endpoints (Profiles, Favorites, Bookings, Slot searches, Reviews) |
| `/company` | Company-focused endpoints (Profiles, Slot configs, Dashboard metrics, Document uploads) |
| `/admin` | Admin dashboard controls (User/Company blocks, Document verification, Payout triggers) |
| `/payments` | Checkout routes & Stripe Webhook listener |
| `/subscriptions` | Subscription plan viewing and package purchases |
| `/chat` | Messaging, chat history, and conversation lists |
| `/notifications` | Real-time and persistent notification logs |
