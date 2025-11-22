# Deployment Guide

This guide covers how to deploy Webhoxy to production.

## Docker Deployment (Recommended)

The easiest way to deploy Webhoxy is using Docker Compose.

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd webhoxy
    ```

2.  **Configure Environment**
    Copy `env.example` to `.env` and update the values.
    ```bash
    cp env.example .env
    ```
    Make sure to set `API_URL` and `WEB_URL` to your production domains/IPs.

3.  **Start Services**
    ```bash
    docker-compose up -d --build
    ```

4.  **Verify Deployment**
    - Check logs: `docker-compose logs -f`
    - Access Web UI: `http://<your-domain-or-ip>:5173`
    - Access API: `http://<your-domain-or-ip>:8080/health`

## Manual Deployment

### API Service

1.  **Build**
    ```bash
    cd api
    npm install
    npm run build
    ```

2.  **Run**
    ```bash
    npm start
    ```
    Ensure environment variables are set (PORT, DATABASE_URL, etc.).

### Web Service

1.  **Build**
    ```bash
    cd web
    npm install
    npm run build
    ```

2.  **Serve**
    Serve the `dist` directory using a static file server (e.g., nginx, serve).
    ```bash
    npx serve -s dist -l 5173
    ```
