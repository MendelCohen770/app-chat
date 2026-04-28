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

## Architecture

```mermaid
flowchart LR
  Browser[Browser / React Client]
  Nginx[Nginx (client container)]
  API[Express + Socket.IO Server]
  Mongo[(MongoDB)]
  Redis[(Redis)]

  Browser -->|HTTP + WebSocket| Nginx
  Nginx -->|/api + /socket.io proxy| API
  API --> Mongo
  API --> Redis
```

- The client is served by Nginx in the `client` container.
- API and realtime events are handled by the Node.js server in the `server` container.
- MongoDB stores persistent chat/auth data and Redis is available for caching/pub-sub needs.

## Environment Variables

Copy from `.env.example`, `server/.env.example`, and `client/.env.example` and set values for your environment.

| Variable | Scope | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `NODE_ENV` | Docker / Server | No | `production` (Docker), `development` (server local) | Runtime mode |
| `SERVER_PORT` | Docker | No | `3000` | Host-mapped server port in Docker stack |
| `CLIENT_PORT` | Docker | No | `5173` | Host-mapped client port in Docker stack |
| `DB_CONNECTION` | Server | Yes | `mongodb://127.0.0.1:27017/app-chat` (local), `mongodb://mongo:27017/app-chat` (Docker) | MongoDB connection string |
| `JWT_SECRET` | Server | Yes | `replace_with_a_long_random_secret` | JWT signing secret (min 15 chars) |
| `CLIENT_ORIGIN` | Server | Yes | `http://localhost:5173` | Frontend origin for CORS/CSP |
| `GOOGLE_CLIENT_ID` | Server + Client build | Yes (if Google auth enabled) | `your_google_client_id_here` | Google OAuth client ID |
| `PORT` | Server local | No | `3000` | Server port outside Docker compose |
| `CORS_ORIGIN_WHITELIST` | Server | No | `http://localhost:5173,http://127.0.0.1:5173` | Extra allowed origins (comma-separated) |
| `SHUTDOWN_TIMEOUT_MS` | Server | No | `10000` | Graceful shutdown timeout in ms |
| `SENTRY_DSN` | Server | No | empty | Backend Sentry DSN |
| `SENTRY_TRACES_SAMPLE_RATE` | Server | No | `0` | Backend trace sample ratio (0-1) |
| `LOG_LEVEL` | Server | No | `debug` (local), `info` (Docker) | Structured logger level |
| `SERVICE_NAME` | Server | No | `app-chat-server` | Service name in logs |
| `EMAIL` | Server | No | empty | SMTP sender address for OTP emails |
| `EMAIL_PASSWORD` | Server | No | empty | SMTP app password for OTP emails |
| `VITE_API_BASE_URL` | Client | Yes | `http://localhost:3000` (client local), `http://localhost:5173` (Docker build arg) | Backend base URL used by frontend |
| `VITE_GOOGLE_CLIENT_ID` | Client | Yes (if Google auth enabled) | `your_google_client_id_here` | Google OAuth client ID for frontend |
| `VITE_SENTRY_DSN` | Client | No | empty | Frontend Sentry DSN |
| `VITE_SENTRY_TRACES_SAMPLE_RATE` | Client | No | `0` | Frontend trace sample ratio (0-1) |

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

## Run with Docker

1. Copy `.env.example` to `.env` in project root and update secrets.
2. Build and start all services:

```bash
docker compose up --build -d
```

3. Open the app at `http://localhost:5173`.
4. Stop services when done:

```bash
docker compose down
```

Optional: remove persistent volumes as well:

```bash
docker compose down -v
```

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

## Monitoring and Alerts

- HTTP access logs are handled by `pino-http` with correlation IDs and sensitive field redaction.
- Health-check routes (`/health`, `/ready`) are excluded from automatic access logs to reduce noise.

Recommended uptime monitor setup (UptimeRobot or Better Stack):

1. Create monitors for:
   - `GET https://<your-domain>/health`
   - `GET https://<your-domain>/ready`
2. Interval: every 30-60 seconds from at least two regions.
3. Alert policy: trigger incident after 2-3 consecutive failures.
4. Alert channels: email + one realtime channel (Slack/Telegram).
5. Runbook baseline:
   - `/health` fails and `/ready` fails -> check process status and DB connectivity.
   - `/health` OK and `/ready` fails -> DB issue or startup dependency issue.
