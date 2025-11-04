# 🏗️ Architecture Documentation

This document provides a detailed overview of Webhoxy's architecture, design decisions, and technical implementation.

---

## Table of Contents

- [System Overview](#system-overview)
- [Technology Stack](#technology-stack)
- [Component Architecture](#component-architecture)
- [Data Flow](#data-flow)
- [Database Schema](#database-schema)
- [API Design](#api-design)
- [Security Architecture](#security-architecture)
- [Performance Considerations](#performance-considerations)

---

## 🎯 System Overview

Webhoxy is a webhook proxy and transformation platform designed to bridge incompatible webhook systems. It consists of two main services:

1. **API Service** - Backend server handling webhook proxying, transformation, and storage
2. **Web Service** - Frontend UI for managing webhooks, mappings, and logs

### Design Principles

- **Simplicity** - Easy to deploy and use
- **Performance** - Fast webhook processing with minimal overhead
- **Reliability** - Comprehensive error handling and logging
- **Security** - Built-in authentication and authorization
- **Maintainability** - Clean code with TypeScript and proper testing

---

## 🛠️ Technology Stack

### Backend (API)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20+ | Runtime environment |
| **TypeScript** | 5.7+ | Type-safe development |
| **Fastify** | 5.2+ | Web framework (fastest Node.js framework) |
| **better-sqlite3** | 11.7+ | Embedded database (synchronous, no async overhead) |
| **Zod** | 3.24+ | Schema validation |
| **Pino** | 9.5+ | Structured logging |
| **Axios** | - | HTTP client for forwarding |

**Why Fastify?**
- 2-3x faster than Express
- Built-in schema validation
- Better error handling
- Plugin architecture

**Why SQLite?**
- Zero configuration
- Serverless
- ACID compliant
- Perfect for small to medium deployments

### Frontend (Web)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Solid.js** | 1.9+ | Reactive UI framework |
| **TypeScript** | 5.9+ | Type safety |
| **CodeMirror 6** | 6+ | Advanced code editor |
| **Tailwind CSS** | 4+ | Utility-first styling |
| **Axios** | 1.7+ | API client |
| **Vite** | 7+ | Build tool and dev server |

**Why Solid.js?**
- True reactivity (no virtual DOM)
- Better performance than React
- Smaller bundle size
- Similar API to React

**Why CodeMirror 6?**
- Modern, extensible architecture
- Rich plugin ecosystem
- Excellent TypeScript support
- Professional JSON editing experience

---

## 🏛️ Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                          CLIENT                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Web UI (Solid.js)                                    │  │
│  │  ├── Pages (Home, Mappings, Logs)                    │  │
│  │  ├── Components (Forms, Lists, Editors)              │  │
│  │  └── API Client (Axios)                              │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST
┌────────────────────▼────────────────────────────────────────┐
│                     API SERVER (Fastify)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Routes                                               │  │
│  │  ├── /api/webhooks     (CRUD + Proxy endpoint)      │  │
│  │  ├── /api/mappings     (Field mapping rules)        │  │
│  │  ├── /api/fields       (Auto field detection)       │  │
│  │  ├── /api/logs         (Delivery logs)              │  │
│  │  └── /api/admin        (Admin operations)           │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Services                                             │  │
│  │  ├── Forwarder         (HTTP forwarding)            │  │
│  │  ├── JSON Mapper       (Payload transformation)     │  │
│  │  ├── Field Extractor   (Auto field detection)       │  │
│  │  └── Log Cleanup       (Retention management)       │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Database (SQLite)                                    │  │
│  │  ├── webhooks          (Configurations)             │  │
│  │  ├── mappings          (Transformation rules)       │  │
│  │  ├── logs              (Delivery history)           │  │
│  │  └── source_fields     (Field cache)                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### API Service Architecture

```
api/
├── src/
│   ├── index.ts              # Application bootstrap
│   ├── config/
│   │   └── index.ts         # Configuration with Zod validation
│   ├── db/
│   │   ├── index.ts         # Database initialization
│   │   ├── types.ts         # TypeScript interfaces
│   │   └── migrations.ts    # Schema migrations
│   ├── routes/
│   │   ├── webhooks.ts      # Webhook CRUD + proxy endpoint
│   │   ├── mappings.ts      # Mapping CRUD
│   │   ├── fields.ts        # Field extraction
│   │   ├── logs.ts          # Log retrieval
│   │   └── admin.ts         # Admin operations
│   ├── services/
│   │   ├── forwarder.ts     # HTTP forwarding logic
│   │   └── log-cleanup.ts   # Background cleanup service
│   └── utils/
│       ├── json-mapper.ts   # JSON transformation
│       └── field-extractor.ts # Field detection
└── data/
    └── webhoxy.db           # SQLite database file
```

### Web Service Architecture

```
web/
├── src/
│   ├── App.tsx              # Root component with routing
│   ├── index.tsx            # Entry point
│   ├── pages/
│   │   ├── Home.tsx         # Webhook list page
│   │   ├── MappingsPage.tsx # Mapping editor page
│   │   └── Logs.tsx         # Log viewer page
│   ├── components/
│   │   ├── Layout.tsx       # App shell
│   │   ├── WebhookForm.tsx  # Create webhook
│   │   ├── WebhookList.tsx  # Webhook cards
│   │   ├── WebhookEditModal.tsx # Edit webhook
│   │   ├── MappingEditor.tsx # Legacy mapping editor
│   │   ├── JsonMappingEditor.tsx # Advanced JSON editor
│   │   └── LogViewer.tsx    # Log display
│   ├── lib/
│   │   ├── api.ts          # API client functions
│   │   └── types.ts        # TypeScript interfaces
│   └── templates/
│       ├── discord.json     # Discord webhook template
│       ├── slack.json       # Slack webhook template
│       ├── teams.json       # Teams webhook template
│       └── telegram.json    # Telegram webhook template
└── dist/                    # Build output
```

---

## 🔄 Data Flow

### Webhook Proxying Flow

```
1. External Service → POST /hook/:webhook_id
                          ↓
2. Webhoxy API receives payload
                          ↓
3. Validate security (API key, IP whitelist)
                          ↓
4. Store source payload in logs table
                          ↓
5. Retrieve mappings for webhook_id
                          ↓
6. Transform payload using JSON mapper
                          ↓
7. Forward to target_url
                          ↓
8. Store response in logs table
                          ↓
9. Return response to client
```

### Field Mapping Flow

```
1. User clicks "Get Fields"
                          ↓
2. Frontend calls GET /api/fields/:webhook_id
                          ↓
3. API retrieves latest log entry
                          ↓
4. Extract all fields from source_payload
                          ↓
5. Store fields in source_fields table
                          ↓
6. Return fields to frontend
                          ↓
7. User maps fields visually
                          ↓
8. Frontend creates mappings via POST /api/mappings
```

---

## 🗄️ Database Schema

### webhooks

```sql
CREATE TABLE webhooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  target_url TEXT NOT NULL,
  api_key TEXT,
  allowed_ips TEXT,
  require_api_key INTEGER DEFAULT 0,
  require_ip_whitelist INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_webhooks_api_key ON webhooks(api_key);
```

**Columns:**
- `id` - Auto-incrementing primary key
- `name` - Human-readable webhook name
- `description` - Optional description
- `target_url` - Destination URL for forwarding
- `api_key` - Optional API key for authentication
- `allowed_ips` - Comma-separated IP whitelist
- `require_api_key` - Boolean flag (0/1)
- `require_ip_whitelist` - Boolean flag (0/1)
- `created_at` - ISO 8601 timestamp

### mappings

```sql
CREATE TABLE mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  webhook_id INTEGER NOT NULL,
  source_field TEXT,
  target_field TEXT NOT NULL,
  fixed_value TEXT,
  FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE
);

CREATE INDEX idx_mappings_webhook ON mappings(webhook_id);
```

**Columns:**
- `id` - Auto-incrementing primary key
- `webhook_id` - Foreign key to webhooks table
- `source_field` - Dot-notation path (e.g., "user.name")
- `target_field` - Dot-notation path for target
- `fixed_value` - Optional static value (if null, use source_field)

### logs

```sql
CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  webhook_id INTEGER NOT NULL,
  source_payload TEXT,
  payload TEXT NOT NULL,
  response_code INTEGER,
  response_body TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE
);

CREATE INDEX idx_logs_webhook ON logs(webhook_id);
CREATE INDEX idx_logs_created ON logs(created_at);
```

**Columns:**
- `id` - Auto-incrementing primary key
- `webhook_id` - Foreign key to webhooks table
- `source_payload` - Original received payload (JSON)
- `payload` - Transformed payload sent to target (JSON)
- `response_code` - HTTP status code from target
- `response_body` - Response from target
- `created_at` - ISO 8601 timestamp

### source_fields

```sql
CREATE TABLE source_fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  webhook_id INTEGER NOT NULL,
  field_path TEXT NOT NULL,
  field_type TEXT NOT NULL,
  sample_value TEXT,
  is_custom INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE,
  UNIQUE(webhook_id, field_path)
);

CREATE INDEX idx_source_fields_webhook ON source_fields(webhook_id);
```

**Columns:**
- `id` - Auto-incrementing primary key
- `webhook_id` - Foreign key to webhooks table
- `field_path` - Dot-notation field path
- `field_type` - Data type (string, number, boolean, object, array)
- `sample_value` - Example value for reference
- `is_custom` - Flag for user-added fields (0/1)
- `created_at` - ISO 8601 timestamp

---

## 🔌 API Design

### REST Principles

- **Resource-based URLs** - `/api/webhooks`, `/api/mappings`
- **HTTP methods** - GET (read), POST (create), PATCH (update), DELETE (delete)
- **Status codes** - 200 (success), 201 (created), 400 (bad request), 404 (not found), 500 (error)
- **JSON format** - All requests and responses use JSON

### Pagination

List endpoints support pagination:

```
GET /api/webhooks?page=1&limit=10
GET /api/logs?page=2&limit=20
```

**Response format:**
```json
{
  "webhooks": [...],
  "total": 45,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

### Error Handling

Consistent error format:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed: name is required"
}
```

---

## 🔐 Security Architecture

### Authentication

- **API Key** - Per-webhook authentication
- **Header format** - `X-API-Key: your-api-key`
- **Query parameter** - `?api_key=your-api-key` (fallback)

### Authorization

- **IP Whitelist** - Comma-separated IP addresses
- **Validation** - Checks `request.ip` against `allowed_ips`

### Input Validation

- **Zod schemas** - All inputs validated before processing
- **Type safety** - TypeScript prevents type errors
- **SQL injection** - Prepared statements via better-sqlite3

### Best Practices

✅ Environment-based configuration  
✅ No sensitive data in logs  
✅ CORS configuration  
✅ Non-root Docker user  
✅ HTTPS recommended for production  

---

## ⚡ Performance Considerations

### Optimization Strategies

1. **Synchronous SQLite**
   - No async overhead
   - Fast read/write operations
   - Perfect for embedded use

2. **Fastify Framework**
   - Fastest Node.js framework
   - Schema-based validation (JIT compilation)
   - Efficient routing

3. **Log Cleanup**
   - Automatic old log deletion
   - Periodic VACUUM operations
   - Configurable retention

4. **Frontend**
   - Solid.js (no virtual DOM)
   - Code splitting
   - Lazy loading

5. **Docker**
   - Multi-stage builds
   - Layer caching
   - nginx for static files

### Scalability

**Current limits:**
- Thousands of webhooks
- Millions of log entries (with cleanup)
- 100+ concurrent requests

**Scaling options:**
- Vertical: Increase server resources
- Horizontal: Add read replicas (PostgreSQL migration)
- CDN: Cache static assets

---

## 🧪 Testing Strategy

### Unit Tests

- **Vitest** - Fast unit testing
- **Coverage** - Key utilities tested
- **Location** - `*.test.ts` files

```bash
npm test
npm run test:coverage
```

### Integration Tests

- Test full request/response cycle
- Validate database operations
- Check error handling

### Manual Testing

- Webhook creation flow
- Mapping editor functionality
- Log viewer pagination

---

## 📦 Deployment Architecture

### Docker Deployment

```
┌─────────────────────────────────────┐
│  Docker Host                        │
│  ┌───────────────┐  ┌────────────┐ │
│  │  API Container│  │Web Container│ │
│  │  Port: 8080   │  │Port: 80    │ │
│  │  Fastify      │  │nginx       │ │
│  └───────┬───────┘  └────────────┘ │
│          │                          │
│  ┌───────▼───────┐                 │
│  │  Volume:      │                 │
│  │  ./api/data   │                 │
│  │  (Persistent) │                 │
│  └───────────────┘                 │
└─────────────────────────────────────┘
```

### Production Setup

```
┌──────────┐      ┌─────────────┐      ┌──────────┐
│          │      │             │      │          │
│  Client  │─────▶│   nginx/    │─────▶│ Webhoxy  │
│          │      │   Traefik   │      │          │
└──────────┘      │   (SSL)     │      └──────────┘
                  └─────────────┘
                       Reverse Proxy
```

---

## 🔮 Future Enhancements

### Planned Improvements

1. **Database Migration**
   - PostgreSQL support for high-scale deployments
   - Connection pooling
   - Read replicas

2. **Advanced Features**
   - Webhook retry with exponential backoff
   - Rate limiting
   - Webhook signature verification (HMAC)
   - Custom headers for forwarding

3. **UI Enhancements**
   - Real-time webhook testing
   - Visual webhook flow builder
   - Analytics dashboard

4. **Multi-tenancy**
   - User authentication
   - Organization support
   - Role-based access control

---

## 📚 References

- [Fastify Documentation](https://fastify.io)
- [Solid.js Documentation](https://solidjs.com)
- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3)
- [CodeMirror Documentation](https://codemirror.net)

---

**Version**: 0.1.0  
**Last Updated**: November 4, 2024

