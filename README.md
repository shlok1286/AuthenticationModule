# auth12

A production-ready authentication generator and framework for **React, TypeScript, Express**, supporting both **MongoDB** (Mongoose) and **PostgreSQL** (Prisma ORM) via a database-agnostic repository layer.

## Architecture

```
                    ┌──────────────────────────────┐
                    │      Auth Controller /       │
                    │   Routes & Auth Middleware   │
                    └──────────────┬───────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │      Auth Service Layer      │
                    │   (Business Logic & Crypto)  │
                    └──────────────┬───────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │  Repository Interfaces / DTO │
                    │  IUserRepository, IOTPRepo   │
                    └──────────────┬───────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                         ▼
 ┌────────────────────────┐                ┌────────────────────────┐
 │  MongoDB Adapter       │                │  PostgreSQL Adapter    │
 │  (Mongoose Models)     │                │  (Prisma ORM)          │
 └────────────────────────┘                └────────────────────────┘
```

Authentication business logic is completely decoupled from database mechanics. Applications can switch between MongoDB and PostgreSQL at any time purely via environment variables.

---

## Features

* **Multi-Database Support**: MongoDB (Mongoose) and PostgreSQL (Prisma)
* **Email & Password Authentication**: Secure bcrypt hashing
* **6-digit Email OTP Verification**: Cryptographic hashing, expiration (5 mins), attempt limits (5 max), and resend cooldowns (45s)
* **Google OAuth 2.0**: ID Token verification and profile reconciliation
* **Forgot & Reset Password**: Secure tokenized OTP workflow
* **JWT Authentication**: Encrypted session cookies with HTTP-only, secure, sameSite flags
* **Protected Routes & Session Validation**: Database-agnostic `authenticateJwt` middleware
* **Logout & Session Invalidation**: Secure cookie clearing
* **Responsive UI**: React, TypeScript, Tailwind CSS, Motion animations
* **Database Agnostic Repositories**: Clean interface abstractions (`IUserRepository`, `IOTPRepository`, `IDatabaseAdapter`)

---

## Usage

Create a new authentication project:

```bash
npx auth12
```

Or specify the project name and database directly:

```bash
# Interactive selection
npx auth12 my-auth-project

# Or direct flags
npx auth12 my-auth-project --db=postgresql
npx auth12 my-auth-project --db=mongodb
```

The CLI creates:

```text
my-auth-project/
├── frontend/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── controllers/
│       ├── db/
│       │   ├── mongodb/
│       │   └── postgres/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── services/
│       └── utils/
├── .env.example
├── .gitignore
└── README.md
```

---

## Database Configuration & Setup

### 1. MongoDB Setup

Set in your `backend/.env`:

```env
DATABASE_PROVIDER=mongodb
MONGODB_URI=mongodb://localhost:27017/authentication
```

Start the backend:
```bash
cd backend
npm run dev
```

### 2. PostgreSQL Setup (via Prisma)

Set in your `backend/.env`:

```env
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://postgres:password@localhost:5432/authentication?schema=public
```

Generate Prisma client & sync schema:
```bash
cd backend
npx prisma generate
npx prisma db push
npm run dev
```

### How to Switch Providers

To change database providers, simply update `DATABASE_PROVIDER` in `backend/.env`:
* For MongoDB: `DATABASE_PROVIDER=mongodb`
* For PostgreSQL: `DATABASE_PROVIDER=postgresql`

Only the configured database adapter is initialized at startup.

---

## Environment Variables

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Backend server port | `5000` |
| `DATABASE_PROVIDER` | Database engine (`mongodb` or `postgresql`) | `mongodb` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/authentication` |
| `DATABASE_URL` | PostgreSQL connection string for Prisma | `postgresql://user:pass@localhost:5432/auth` |
| `JWT_SECRET` | Secret key for signing JWT tokens | 32+ character random string |
| `GOOGLE_CLIENT_ID` | Google Cloud OAuth Client ID | `...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google Cloud OAuth Client Secret | Secret from Google Console |
| `EMAIL_USER` | Gmail address for sending OTP emails | `your-email@gmail.com` |
| `EMAIL_APP_PASSWORD` | Google 16-character App Password | App password |
| `FRONTEND_URL` | URL of the frontend application | `http://localhost:5173` |
| `BACKEND_URL` | URL of the backend application | `http://localhost:5000` |

---

## Testing

Run the automated multi-database test suite validating both MongoDB and PostgreSQL repositories and shared business logic:

```bash
cd backend
npm run test:auth
```

---

## Local CLI Development

```bash
cd cli
npm link
auth12 test-project --no-install
```

## License

MIT
