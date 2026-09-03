# auth12

`auth12` generates a standalone React and Express authentication project backed by MongoDB.

Run locally from this repository:

```bash
cd cli
npm link
auth12
```

For a non-interactive local test:

```bash
auth12 my-auth-project --no-install
```

The generated project includes email/password authentication, email OTP verification, Google OAuth, password recovery, JWT HTTP-only cookies, session checks, logout, and a protected success page. Copy `.env.example` to `.env` and provide your own service credentials before starting it.
