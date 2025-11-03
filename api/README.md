# Webhoxy API (Node.js + Fastify)

A high-performance webhook proxy service built with **Fastify** and **TypeScript**. Receives, transforms, and forwards webhook payloads with JSON field mapping capabilities.

## 🚀 Quick Start

### Prerequisites
- **Node.js**: 20.x or higher
- **npm**: 10.x or higher

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Start development server
npm run dev
```

Server starts at: **http://localhost:8080**

### Production

```bash
# Build
npm run build

# Start production server
npm start
```

## 📚 Features

### ✨ Core Capabilities
- **Webhook Proxying**: Receive webhooks and forward to target URLs
- **JSON Field Mapping**: Transform payloads using dot notation field mappings
- **Auto-field Detection**: Automatically extract available fields from webhook payloads
- **Delivery Logging**: Track all webhook deliveries with full request/response data
- **Type-safe**: Full TypeScript support with Zod validation

### 🎯 What Makes This Different
- **Smart Field Mapping**: Auto-extracts source fields from your webhook payloads
- **Simple UX**: Click to map fields instead of typing paths manually
- **Fast**: Built on Fastify, one of the fastest Node.js frameworks
- **Production-ready**: Docker support, proper error handling, logging

## 🌐 API Endpoints

### Webhooks
- `POST /api/webhooks` - Create webhook
- `GET /api/webhooks` - List all webhooks
- `GET /api/webhooks/:id` - Get webhook by ID
- `DELETE /api/webhooks/:id` - Delete webhook
- `POST /hook/:webhook_id` - **Receive webhook** (proxy endpoint)

### Mappings
- `POST /api/mappings` - Create field mapping
- `GET /api/mappings/:webhook_id` - Get mappings for webhook
- `DELETE /api/mappings/:mapping_id` - Delete mapping

### Fields (Smart Mapping)
- `GET /api/fields/:webhook_id` - **Get available source fields from latest payload**
- `POST /api/fields/extract` - Extract fields from custom JSON

### Logs
- `GET /api/logs/:webhook_id` - Get delivery logs

## 💡 Usage Example

### 1. Create a Webhook

```bash
curl -X POST http://localhost:8080/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GitHub to Slack",
    "description": "Forward GitHub events to Slack",
    "target_url": "https://hooks.slack.com/services/YOUR/WEBHOOK"
  }'
```

**Response:**
```json
{
  "id": 1,
  "proxy_url": "http://localhost:8080/hook/1"
}
```

### 2. Send a Test Webhook

```bash
curl -X POST http://localhost:8080/hook/1 \
  -H "Content-Type: application/json" \
  -d '{
    "event": "push",
    "user": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "repository": "myrepo"
  }'
```

### 3. Get Available Fields (Auto-detected)

```bash
curl http://localhost:8080/api/fields/1
```

**Response:**
```json
{
  "fields": [
    { "path": "event", "type": "string", "sample": "push" },
    { "path": "user.name", "type": "string", "sample": "John Doe" },
    { "path": "user.email", "type": "string", "sample": "john@example.com" },
    { "path": "repository", "type": "string", "sample": "myrepo" }
  ]
}
```

### 4. Create Field Mappings

```bash
curl -X POST http://localhost:8080/api/mappings \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_id": 1,
    "source_field": "user.name",
    "target_field": "author"
  }'
```

Now when webhooks are received, the payload will be transformed:

**Before:**
```json
{
  "event": "push",
  "user": { "name": "John Doe" }
}
```

**After:**
```json
{
  "author": "John Doe"
}
```

## 🏗️ Architecture

```
api-node/
├── src/
│   ├── index.ts              # Application entry point
│   ├── config/
│   │   └── index.ts         # Configuration with Zod validation
│   ├── db/
│   │   ├── index.ts         # Database initialization
│   │   ├── types.ts         # TypeScript interfaces
│   │   └── migrations.ts    # Database migrations
│   ├── routes/
│   │   ├── webhooks.ts      # Webhook CRUD + proxy
│   │   ├── mappings.ts      # Field mapping CRUD
│   │   ├── logs.ts          # Delivery logs
│   │   └── fields.ts        # Field extraction (auto-detect)
│   ├── services/
│   │   └── forwarder.ts     # HTTP forwarding logic
│   └── utils/
│       ├── json-mapper.ts   # JSON transformation
│       └── field-extractor.ts # Auto field detection
├── package.json
├── tsconfig.json
├── Dockerfile
└── docker-compose.yml
```

## 🗄️ Database Schema

### webhooks
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `name` | TEXT | Webhook name |
| `description` | TEXT | Optional description |
| `target_url` | TEXT | Forward destination |
| `created_at` | TEXT | ISO 8601 timestamp |

### mappings
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `webhook_id` | INTEGER | FK to webhooks |
| `source_field` | TEXT | JSON path (e.g., "user.name") |
| `target_field` | TEXT | Target path (e.g., "author") |
| `fixed_value` | TEXT | Optional fixed value |

### logs
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `webhook_id` | INTEGER | FK to webhooks |
| `payload` | TEXT | JSON payload sent |
| `response_code` | INTEGER | HTTP status code |
| `response_body` | TEXT | Response body |
| `created_at` | TEXT | ISO 8601 timestamp |

## 🐳 Docker

### Build and Run

```bash
# Build image
docker build -t webhoxy-api .

# Run container
docker run -p 8080:8080 -v $(pwd)/data:/app/data webhoxy-api
```

### Docker Compose

```bash
docker-compose up -d
```

## ⚙️ Configuration

Environment variables (`.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8080 | Server port |
| `HOST` | 0.0.0.0 | Server host |
| `NODE_ENV` | development | Environment |
| `DATABASE_URL` | ./data/webhoxy.db | SQLite database path |
| `CORS_ORIGIN` | * | CORS origins (comma-separated) |
| `LOG_LEVEL` | info | Log level (info, debug, error) |
| `LOG_PRETTY` | true | Pretty print logs (dev only) |

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run dev
```

## 📦 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm test` | Run tests |
| `npm run lint` | Lint code |
| `npm run lint:fix` | Fix linting issues |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Type check without emitting |

## 🎨 Tech Stack

- **[Fastify](https://fastify.io)** - Fast web framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[better-sqlite3](https://github.com/WiseLibs/better-sqlite3)** - Synchronous SQLite3
- **[Zod](https://zod.dev/)** - Schema validation
- **[Pino](https://getpino.io/)** - Fast logging
- **[Vitest](https://vitest.dev/)** - Unit testing

## 🔒 Security Best Practices

This implementation follows Node.js security best practices:

✅ Input validation with Zod  
✅ SQL injection prevention (prepared statements)  
✅ CORS configuration  
✅ Proper error handling  
✅ Logging without sensitive data  
✅ Non-root Docker user  
✅ Environment-based configuration  

## 🚧 Roadmap

- [ ] Webhook signature verification (HMAC)
- [ ] Retry logic with exponential backoff
- [ ] Rate limiting
- [ ] API key authentication
- [ ] Custom headers for forwarding
- [ ] Webhook filtering
- [ ] Batch delivery
- [ ] WebSocket support for real-time logs

## 📄 License

MIT License

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and test
4. Run linter: `npm run lint:fix`
5. Commit: `git commit -am 'Add feature'`
6. Push: `git push origin feature-name`
7. Open a Pull Request

## 📧 Support

- **Documentation**: See `README.md`
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

---

**Made with ❤️ using Fastify and TypeScript**

**Version**: 0.1.0  
**Last Updated**: October 31, 2024

