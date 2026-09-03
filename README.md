# auth12

A CLI that generates a ready-to-use authentication project with **React, TypeScript, Express, and MongoDB**.

## Features

* Email & password authentication
* 6-digit email OTP verification
* OTP expiration and attempt limits
* OTP resend support
* Google OAuth 2.0
* Forgot & reset password
* JWT authentication with HTTP-only cookies
* Protected routes
* Session validation
* Logout
* Responsive authentication UI
* MongoDB & Mongoose

## Usage

Create a new authentication-ready project:

```bash
npx auth12
```

Or provide the project name directly:

```bash
npx auth12 my-auth-project
```

The CLI creates:

```text
my-auth-project/
├── frontend/
├── backend/
├── .env.example
├── .gitignore
└── README.md
```

## Setup

After generation, configure your environment variables:

```bash
cd my-auth-project
```

Copy `.env.example` to `.env` and add your own credentials.

### Backend

```bash
cd backend
npm run dev
```

### Frontend

Open another terminal:

```bash
cd frontend
npm run dev
```

The default development URLs are:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:5000
```

## Authentication Flow

```text
Signup / Login
      ↓
Email OTP Verification
      ↓
Authenticated Session
      ↓
Protected Success Page
```

Google OAuth is also available as an alternative authentication method.

## Security

* Passwords hashed using bcrypt
* OTPs securely hashed and time-limited
* JWT stored in HTTP-only cookies
* Protected authentication routes
* Rate limiting
* Helmet security headers
* Environment-based configuration

> Never commit `.env` files or private credentials to your repository.

## Tech Stack

**Frontend**

React · TypeScript · Tailwind CSS · React Router · Axios · Motion

**Backend**

Node.js · Express · TypeScript · MongoDB · Mongoose · JWT · Nodemailer

## Local Development

To work on the CLI from the repository:

```bash
cd cli
npm link
auth12
```

For a quick generation test without installing dependencies:

```bash
auth12 test-project --no-install
```

## License

MIT

---

**auth12**
*Secure. Reusable. Ready to build.*
