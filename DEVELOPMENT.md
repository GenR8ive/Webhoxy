# Development Guide

## Project Structure

- `api/`: Fastify backend service
- `web/`: SolidJS frontend application
- `scripts/`: Utility scripts

## Setup

1.  **Install Dependencies**
    ```bash
    npm install
    cd api && npm install
    cd ../web && npm install
    ```

2.  **Environment Setup**
    - Copy `.env.example` to `.env` in `api/` and `web/` directories.
    - Update values if necessary.

## Running Services

### API
```bash
cd api
npm run dev
```
Runs on port 8080 by default.

### Web
```bash
cd web
npm run dev
```
Runs on port 5173 by default.

## Testing

### API Tests
```bash
cd api
npm test
```

## Database

The API uses SQLite. The database file is located at `api/data/webhoxy.db`.
Migrations are run automatically on startup.
