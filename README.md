# HelpDesk: Support Ticket System

A role-based support ticket system built for the Codveda Technology Full-Stack Development internship. Customers raise tickets, agents work on them, and admins manage users and assignments. The project grows level by level, and each level is a self-contained folder.

**Stack:** Node.js, Express, MongoDB (Mongoose), JWT + bcrypt, React (Vite), Tailwind CSS

## Levels

| Level | Folder | Tasks completed | Status |
|---|---|---|---|
| 1 (Basic) | [`level-1`](./level-1) | Environment setup, REST API, vanilla JS frontend | Done |
| 2 (Intermediate) | [`level-2`](./level-2) | Database integration, authentication and authorization, React frontend | Done |
| 3 (Advanced) | `level-3` | Full-stack app, WebSockets | In progress |

## Features

- Customers sign up, create tickets, and comment on their own tickets
- Agents see all tickets and update status and priority
- Admins assign tickets, delete tickets, and manage user roles
- Passwords hashed with bcrypt; sessions use a JWT in an `httpOnly` cookie
- Role checks enforced on the server, not just hidden in the UI

## Permissions

| Action | Customer | Agent | Admin |
|---|---|---|---|
| Create ticket | Yes | Yes | Yes |
| View tickets | Own only | All | All |
| Comment | On own tickets | Any | Any |
| Change status / priority | No | Yes | Yes |
| Assign ticket | No | No | Yes |
| Delete ticket | No | No | Yes |
| List users, change roles | No | No | Yes |

## API (Level 2)

| Method | Endpoint | Access |
|---|---|---|
| POST | `/auth/signup`, `/auth/login`, `/auth/logout` | Public |
| GET | `/auth/me` | Logged in |
| GET, POST | `/tickets` (filters: `?status=`, `?priority=`) | Logged in |
| GET | `/tickets/:id` | Owner, agent, admin |
| PUT | `/tickets/:id` | Agent, admin (assigning: admin) |
| DELETE | `/tickets/:id` | Admin |
| GET, POST | `/tickets/:id/comments` | Owner, agent, admin |
| GET | `/users` | Admin |
| PATCH | `/users/:id/role` | Admin |

## Running Level 1

```bash
cd level-1/api
npm install
npm run dev
```

Open http://localhost:3000. Tickets are kept in memory and reset on restart.

## Running Level 2

Requires Node.js 20+ and a running MongoDB.

```bash
# API
cd level-2/api
npm install
cp .env.example .env     # then fill in the values
npm run seed:admin       # creates the first admin from .env
npm run dev              # http://localhost:3000

# React client (second terminal)
cd level-2/client
npm install
npm run dev              # http://localhost:5173
```

`.env` values: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`. Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

In development the React app calls `/api/...` and Vite forwards it to Express, so the browser only talks to one origin and the cookie works without CORS.

## What I learned

- Designing a REST API with validation, status codes and central error handling
- Modelling relationships in MongoDB and tuning indexes with `explain()`
- Secure authentication: password hashing, JWT, `httpOnly` cookies, 401 vs 403
- Preventing NoSQL injection and XSS
- Building a React app with routing, context, protected routes and reusable components

## Screenshots

_Coming soon._

## Demo

_LinkedIn video link coming soon._
