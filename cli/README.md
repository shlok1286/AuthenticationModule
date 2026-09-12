# auth12

`auth12` generates a production-ready React and Express authentication project supporting both **MongoDB** (Mongoose) and **PostgreSQL** (Prisma ORM) via a database-agnostic repository layer.

## Usage

Create a new authentication project:

```bash
npx auth12
```

Or provide the project name and database directly:

```bash
npx auth12 my-auth-project --db=postgresql
# or
npx auth12 my-auth-project --db=mongodb
```

## Features

- Multi-database support: MongoDB & PostgreSQL (Prisma)
- Email & password signup and login
- Email 6-digit OTP verification with expiration and attempt limiting
- Resend OTP with cooldown
- Forgot-password and reset-password flows
- Google OAuth 2.0 authentication
- JWT session management via HTTP-only cookies
- Protected routes and session validation
- Responsive UI (React + Tailwind CSS + Motion)

## Local Development

```bash
cd cli
npm link
auth12 test-project --no-install
```

## License

MIT
