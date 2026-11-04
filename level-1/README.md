# Level 1: Basic

Setup, a REST API, and a vanilla JavaScript frontend for a support ticket system.

## What it covers

- Development environment: Node.js, Git, VS Code, MongoDB
- REST API with Express: full CRUD on tickets, validation, proper HTTP status codes, central error handling
- Frontend in plain HTML, CSS and JavaScript using the Fetch API

## Run it

```bash
cd api
npm install
npm run dev
```

Open http://localhost:3000. Express serves the page in `frontend/`.

Tickets are stored in memory, so they reset whenever the server restarts. Level 2 moves them to MongoDB.

## Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/tickets` | List tickets |
| POST | `/tickets` | Create a ticket |
| GET | `/tickets/:id` | Get one ticket |
| PUT | `/tickets/:id` | Update status, priority or text |
| DELETE | `/tickets/:id` | Delete a ticket |

Tested with Thunder Client.
