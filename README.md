# 🚀 Webhoxy

<div align="center">

**A powerful, lightweight webhook proxy and transformation platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](https://www.docker.com/)

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

**Webhoxy** is a modern webhook proxy service that receives, transforms, and forwards webhook payloads with an intuitive visual interface. Perfect for integrating different services with incompatible webhook formats.

### 🎯 Why Webhoxy?

- **Visual Field Mapping** - Click-to-map interface instead of writing complex transformation scripts
- **Auto Field Detection** - Automatically extracts and displays available fields from your webhook payloads
- **Real-time Logs** - Monitor all webhook deliveries with full request/response details
- **Security First** - API key authentication and IP whitelisting built-in
- **Lightweight** - SQLite database with automatic log retention management
- **Production Ready** - Docker support, health checks, and proper error handling

---

## ✨ Features

### Core Capabilities

🔄 **Webhook Proxying**
- Receive webhooks from any source
- Transform payloads with visual field mapping
- Forward to any target URL

🎨 **Visual JSON Editor**
- Syntax highlighting and linting
- Auto-complete with source fields
- Variable chips for easy editing
- JSON beautification

🔒 **Security**
- API key authentication
- IP whitelist filtering
- Secure credential management

📊 **Monitoring**
- Real-time delivery logs
- Request/response tracking
- Error debugging
- Paginated log history

🔧 **Field Mapping**
- Auto-detect source fields
- Drag-and-drop mapping
- Fixed value support
- Nested field handling

⚡ **Performance**
- Built on Fastify (fastest Node.js framework)
- SQLite for minimal resource usage
- Automatic log cleanup
- Health monitoring

---

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended)
- OR **Node.js 20+** and **npm 10+**

### Scenario 1: Docker Compose (Web + API)
*User sets ports and domains.*

1. Create a `.env` file in the root directory (copy from `env.example`).
2. Adjust `API_PORT` and `WEB_PORT` in `.env` if needed.
### How It Works

```
┌─────────────┐      ┌──────────┐      ┌─────────────┐      ┌───────────┐
│   Source    │─────▶│ Webhoxy  │─────▶│  Transform  │─────▶│  Target   │
│  (GitHub,   │      │  Proxy   │      │   Payload   │      │  (Slack,  │
│  Stripe,    │      │          │      │             │      │  Discord) │
│   etc.)     │      └──────────┘      └─────────────┘      └───────────┘
└─────────────┘
```

### Usage Guide

#### 1. Create a Webhook

1. Open the Webhoxy web UI
2. Click "Create Webhook"
3. Enter details:
   - **Name**: e.g., "GitHub to Slack"
   - **Target URL**: Your destination webhook URL
   - **Security** (optional): Add API key or IP whitelist

4. Copy the generated **Proxy URL**

#### 2. Configure Source Webhook

Point your source service (GitHub, Stripe, etc.) to the **Proxy URL**:

```
http://your-domain.com/hook/1
```

#### 3. Send Test Webhook

Send a test payload to your proxy URL to auto-detect fields.

#### 4. Create Field Mappings

1. Navigate to **Mappings** for your webhook
2. Click **Get Fields** to see available source fields
3. Use the visual editor to map fields:

```json
{
  "text": "New commit by {{user.name}}",
  "channel": "#deployments",
  "commit": "{{repository.url}}"
}
```

#### 5. Monitor Logs

View all deliveries in the **Logs** tab with:
- Request payloads
- Response status
- Error details
- Timestamps

---

## 🏗️ Architecture

```
webhoxy/
├── api/                    # Backend (Fastify + TypeScript)
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── db/            # Database & migrations
│   │   └── utils/         # Field extraction, JSON mapping
│   ├── data/              # SQLite database
│   └── Dockerfile
│
├── web/                   # Frontend (Solid.js + TypeScript)
│   ├── src/
│   │   ├── pages/        # Main pages
│   │   ├── components/   # UI components
│   │   ├── lib/          # API client & types
│   │   └── templates/    # Webhook templates
│   └── Dockerfile
│
└── docker-compose.yml     # Multi-container setup
```

---

## ⚙️ Configuration

### Environment Variables

**API Service** (`api/.env`):

```env
# Server
PORT=8080
HOST=0.0.0.0
NODE_ENV=production

# Database
DATABASE_URL=./data/webhoxy.db

# Security
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info
LOG_PRETTY=false

# Log Retention
LOG_RETENTION_DAYS=7
LOG_CLEANUP_INTERVAL_HOURS=24
```

**Web Service**:
- Configure API URL in `web/.env`:
```env
VITE_API_URL=http://localhost:8080
```

---

## 🔐 Security Features

### API Key Authentication

Protect your webhook endpoints with API keys:

```bash
# Clients must include the key in the header
curl -H "X-API-Key: your-api-key" http://localhost:8080/hook/1
```

### IP Whitelisting

Restrict webhook access to specific IPs:

```
276: 192.168.1.100, 10.0.0.5, 172.16.0.0/24
277: ```
278: 
279: ### Password Recovery
280: 
281: Since Webhoxy does not use email, password recovery is handled via a server-side script. An administrator can reset any user's password:
282: 
283: ```bash
284: # Usage: node scripts/reset-password.js <username> <new_password>
285: node scripts/reset-password.js admin newSecretPassword123
286: ```
287: 
288: This will:
289: 1. Reset the password
290: 2. Invalidate all existing sessions
291: 3. Require the user to change their password upon next login
292: 
293: ---

## 🐳 Docker Details

### Building Images

```bash
# Build API only
docker build -t webhoxy-api ./api

# Build Web only
docker build -t webhoxy-web ./web

# Build both
docker-compose build
```

### Running Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Health Checks

The API includes health monitoring:

```bash
curl http://localhost:8080/
```

Response:
```json
{
  "status": "ok",
  "version": "0.1.0"
}
```

---

## 🧪 Testing

### API Tests

```bash
cd api

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## 📊 API Endpoints

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/webhooks` | Create webhook |
| `GET` | `/api/webhooks` | List webhooks (paginated) |
| `GET` | `/api/webhooks/:id` | Get webhook details |
| `PATCH` | `/api/webhooks/:id` | Update webhook |
| `DELETE` | `/api/webhooks/:id` | Delete webhook |
| `POST` | `/hook/:webhook_id` | Receive webhook (proxy endpoint) |

### Mappings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/mappings` | Create field mapping |
| `GET` | `/api/mappings/:webhook_id` | Get mappings |
| `DELETE` | `/api/mappings/:mapping_id` | Delete mapping |

### Fields

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/fields/:webhook_id` | Get available source fields |
| `GET` | `/api/fields/:webhook_id/stored` | Get stored fields |
| `POST` | `/api/fields/:webhook_id/custom` | Save custom field |

### Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/logs` | Get all logs (paginated) |
| `GET` | `/api/logs/:webhook_id` | Get logs for webhook |

---

## 🎨 Tech Stack

### Backend (API)

- **[Fastify](https://fastify.io)** - Lightning-fast web framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[better-sqlite3](https://github.com/WiseLibs/better-sqlite3)** - Synchronous SQLite driver
- **[Zod](https://zod.dev/)** - Schema validation
- **[Pino](https://getpino.io/)** - High-performance logging

### Frontend (Web)

- **[Solid.js](https://solidjs.com)** - Reactive UI framework
- **[CodeMirror 6](https://codemirror.net/)** - Advanced JSON editor
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS
- **[Axios](https://axios-http.com/)** - HTTP client
- **[Solid Icons](https://www.npmjs.com/package/solid-icons)** - Icon library

---

## 📈 Roadmap

- [x] Visual field mapping
- [x] API key authentication
- [x] IP whitelisting
- [x] Log retention management
- [x] Webhook editing
- [ ] Webhook signature verification (HMAC)
- [ ] Retry logic with exponential backoff
- [ ] Rate limiting
- [ ] Custom headers for forwarding
- [ ] Webhook templates marketplace
- [ ] Batch webhook delivery
- [ ] WebSocket support for real-time updates
- [ ] Multi-user support with authentication

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with love using **Fastify** and **Solid.js**
- Inspired by webhook transformation needs in modern applications
- Thanks to the open-source community

---

## 💬 Support

- **Documentation**: See this README and `/api/README.md`
- **Issues**: [GitHub Issues](https://github.com/yourusername/webhoxy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/webhoxy/discussions)

---

<div align="center">

**Made with ❤️ by developers, for developers**

⭐ Star us on GitHub if Webhoxy helps you!

</div>

