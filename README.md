# App Chat

A full-stack real-time chat application with a React + Vite client and a Node.js + Express + Socket.IO server.

## Tech Stack

- **Client:** React, TypeScript, Vite, MUI, Tailwind CSS, Socket.IO Client
- **Server:** Node.js, Express, TypeScript, Socket.IO, Mongoose, Zod
- **Database:** MongoDB
- **Auth:** JWT (HTTP-only cookies), Google OAuth
- **Infra/Security:** Helmet, CORS whitelist, rate limiting

## Project Structure

- `client/` - Frontend app
- `server/` - Backend API + Socket.IO server

## Environment Variables

### Server (`server/.env`)

Copy from `server/.env.example` and set values:

- `DB_CONNECTION` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret (minimum 15 chars in current validation)
- `CLIENT_ORIGIN` - Frontend origin for CORS/CSP
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `PORT` - Optional server port (default: `3000`)
- `CORS_ORIGIN_WHITELIST` - Optional extra allowed origins (comma-separated)
- `SHUTDOWN_TIMEOUT_MS` - Optional graceful shutdown timeout
- `NODE_ENV` - Optional runtime environment
- `LOG_LEVEL` - Optional logger level
- `SERVICE_NAME` - Optional logger service name
- `EMAIL` - Optional SMTP sender email
- `EMAIL_PASSWORD` - Optional SMTP app password

### Client (`client/.env`)

Copy from `client/.env.example` and set values:

- `VITE_API_BASE_URL` - Base URL for backend API
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID for frontend login

## Install

Install dependencies for both apps:

```bash
cd server && npm install
cd ../client && npm install
```

## Run in Development

Run each app in a separate terminal:

```bash
cd server && npm run dev
```

```bash
cd client && npm run dev
```

- Client default URL: `http://localhost:5173`
- Server default URL: `http://localhost:3000`

## Build

Build both apps:

```bash
cd server && npm run build
cd ../client && npm run build
```

## Run in Production

Build first, then run server:

```bash
cd server && npm run build && npm start
```

To serve the client production build, run your preferred static server against `client/dist` (for example with Nginx).

## Health Endpoints

- `GET /health` - Returns `200` with service uptime and DB status
- `GET /ready` - Returns `200` only when server is ready (DB connected), otherwise `503`
