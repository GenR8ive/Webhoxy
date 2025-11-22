# Environment Configuration

This document lists all environment variables used by Webhoxy.

## Root Configuration (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `API_URL` | URL for the API service | `http://localhost:8080/api` |
| `WEB_URL` | URL for the Web service | `http://localhost:5173` |
| `WEB_PORT` | Port for the Web service | `5173` |
| `API_PORT` | Port for the API service | `8080` |
| `API_HOST` | Host for the API service | `0.0.0.0` |
| `NODE_ENV` | Node environment | `production` |
| `DATABASE_URL` | Path to SQLite database | `./data/webhoxy.db` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` |
| `LOG_LEVEL` | Logging level | `info` |

## API Service (api/.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port to listen on | `8080` |
| `HOST` | Host to bind to | `0.0.0.0` |
| `NODE_ENV` | Node environment | `development` |
| `DATABASE_URL` | Path to SQLite database | `./data/webhoxy.db` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` |
| `LOG_LEVEL` | Logging level | `debug` |
| `PUBLIC_URL` | Public URL for webhooks (optional) | `http://localhost:PORT` |

## Web Service (web/.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | URL of the API service | `http://localhost:8080/api` |
| `VITE_WEB_URL` | URL of the Web service | `http://localhost:5173` |
| `VITE_WEB_PORT` | Port to serve the web app | `5173` |
