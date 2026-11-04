# Level 2: Intermediate

MongoDB, authentication with roles, and a React frontend.

## What it covers

- **Database:** Mongoose models (User, Ticket, Comment), relationships, indexes, validation, cascade delete
- **Authentication and authorization:** bcrypt, JWT in an `httpOnly` cookie, role-based routes (customer, agent, admin)
- **Frontend:** React (Vite) with Tailwind CSS, routing, protected routes, reusable components

## Requirements

Node.js 20+ and a running MongoDB.

## Run it

```bash
# API
cd api
npm install
cp .env.example .env      # then fill in the values
npm run seed:admin        # creates the first admin from .env
npm run dev               # http://localhost:3000

# React client (second terminal)
cd client
npm install
npm run dev               # http://localhost:5173
```

In development the client calls `/api/...` and Vite forwards it to Express, so the browser only talks to one origin and the cookie works without CORS.

## Environment variables

See `api/.env.example`: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Roles

Signup always creates a customer. The seed script creates the first admin, and admins promote other users from the Users page. See the root README for the full permissions table.
