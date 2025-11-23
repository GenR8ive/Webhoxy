# Webhoxy

Webhoxy is a high-performance webhook proxy service built with Fastify and SolidJS. It allows you to receive webhooks from third-party services and forward them to your local development environment or other destinations with transformation capabilities.

## Features

- **Webhook Proxy**: Receive webhooks and forward them to any destination.
- **Transformation**: Transform webhook payloads using JSON templates.
- **Real-time UI**: View incoming webhooks and their status in real-time.
- **High Performance**: Built with Fastify and SolidJS for maximum speed.

## Getting Started

### Prerequisites

- Node.js >= 20
- Docker & Docker Compose (optional)

### Clone Repo
```bash
git clone https://github.com/GenR8ive/Webhoxy.git
```
### Running Locally (Development)

1.  **Install Dependencies**
    ```bash
    npm install
    cd api && npm install
    cd ../web && npm install
    ```

2.  **Start Services**
    You can start the API and Web services independently.

    **API:**
    ```bash
    cd api
    npm run dev
    ```
    The API will be available at `http://localhost:8080`.

    **Web:**
    ```bash
    cd web
    npm run dev
    ```
    The Web UI will be available at `http://localhost:5173`.

### Running with Docker

1.  **Build and Start**
    ```bash
    docker-compose up --build
    ```

2.  **Access Services**
    - Web UI: `http://localhost:5173` (or configured WEB_PORT)
    - API: `http://localhost:8080` (or configured API_PORT)

## Documentation

- [Deployment Guide](DEPLOYMENT.md)
- [Development Guide](DEVELOPMENT.md)
- [Environment Configuration](ENV_CONFIG.md)
- [Architecture](ARCHITECTURE.md)

## License

MIT


