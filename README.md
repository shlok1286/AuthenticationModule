# auth12

A CLI that generates a ready-to-use authentication project with **React, TypeScript, Express, and MongoDB**.

## Features

- Email & password authentication
- 6-digit email OTP verification
- OTP expiration and attempt limits
- OTP resend support
- Google OAuth 2.0
- Forgot & reset password
- JWT authentication with HTTP-only cookies
- Protected routes
- Session validation
- Logout
- Responsive authentication UI
- MongoDB & Mongoose

## Requirements

- Node.js 18+
- npm
- MongoDB

## Usage

Create a new authentication-ready project:

    npx auth12

Or provide the project name directly:

    npx auth12 my-auth-project

To generate the project without installing dependencies:

    npx auth12 my-auth-project --no-install

## Generated Project

    my-auth-project/
    ├── frontend/
    ├── backend/
    ├── .env.example
    ├── .gitignore
    └── README.md

## Setup

After generating the project:

    cd my-auth-project

Configure the environment variables using `.env.example`.

You will need your own:

- MongoDB connection
- JWT secret
- Email credentials
- Google OAuth credentials (optional)

Never commit `.env` files or private credentials.

### Backend

    cd backend
    npm run dev

### Frontend

Open another terminal:

    cd frontend
    npm run dev

Default development URLs:

    Frontend: http://localhost:5173
    Backend:  http://localhost:5000

## Authentication Flow

    Signup / Login
          ↓
    Email OTP Verification
          ↓
    JWT Session
          ↓
    Protected Success Page

Google OAuth is also available as an alternative authentication method.

## Security

- Passwords hashed using bcrypt
- OTPs securely hashed and time-limited
- JWT stored in HTTP-only cookies
- Protected authentication routes
- Rate limiting
- Helmet security headers
- Environment-based configuration

> Never commit `.env` files or private credentials to your repository.

## Tech Stack

**Frontend:** React · TypeScript · Vite · Tailwind CSS · React Router · Axios · Motion · Lucide React

**Backend:** Node.js · Express · TypeScript · MongoDB · Mongoose · JWT · bcryptjs · Nodemailer

## Local Development

To work on the CLI from the repository:

    cd cli
    npm install
    npm link
    auth12

For a quick generation test without installing dependencies:

    auth12 test-project --no-install

## npm Package

`auth12` is publicly available on npm.

Current version: **1.0.0**

Run it directly with:

    npx auth12

No GitHub clone or `npm link` is required to use the published package.

## License

MIT

---

**auth12**  
*Generate. Configure. Authenticate.*
