# Changelog

All notable changes to Webhoxy will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2024-11-04

### Added

#### Core Features
- **Webhook Proxy System** - Receive, transform, and forward webhook payloads
- **Visual JSON Mapping Editor** with CodeMirror 6
  - Syntax highlighting and linting
  - Auto-complete with source fields
  - Variable chips for easy editing
  - JSON beautification
- **Field Mapping** - Transform webhook payloads using dot notation
- **Auto Field Detection** - Automatically extract available fields from payloads
- **Delivery Logging** - Track all webhook deliveries with full request/response data
- **Pagination** - For webhook lists and log views

#### Security Features
- **API Key Authentication** - Protect webhook endpoints with API keys
  - Password-type masking with visibility toggle
  - Auto-generate secure keys
- **IP Whitelisting** - Restrict webhook access to specific IP addresses
- **Webhook Security Settings** - Configurable per-webhook security

#### Data Management
- **Log Retention** - Configurable automatic log cleanup
  - Default: 7 days retention
  - Automatic database VACUUM
  - Admin endpoints for manual cleanup
- **Source Payload Storage** - Store original payloads for field extraction
- **Field Persistence** - Store and recall source fields across sessions

#### User Interface
- **Modern Web UI** built with Solid.js
  - Responsive design
  - Real-time updates
  - Dark mode JSON editor
- **Webhook Management**
  - Create, edit, and delete webhooks
  - Copy proxy URLs
  - View webhook details
- **Mapping Editor**
  - Visual field mapping interface
  - Get available fields from latest payload
  - Custom field support
- **Log Viewer**
  - Filter by webhook
  - Paginated results
  - Request/response details

#### Developer Experience
- **TypeScript** - Full type safety across backend and frontend
- **Docker Support** - Multi-container setup with Docker Compose
- **Health Checks** - Built-in health monitoring
- **Documentation** - Comprehensive README and API docs
- **Testing** - Vitest for unit tests
- **Linting & Formatting** - ESLint and Prettier

#### API Endpoints
- `POST /api/webhooks` - Create webhook
- `GET /api/webhooks` - List webhooks (paginated)
- `GET /api/webhooks/:id` - Get webhook details
- `PATCH /api/webhooks/:id` - Update webhook
- `DELETE /api/webhooks/:id` - Delete webhook
- `POST /hook/:webhook_id` - Receive webhook (proxy endpoint)
- `POST /api/mappings` - Create field mapping
- `GET /api/mappings/:webhook_id` - Get mappings
- `DELETE /api/mappings/:mapping_id` - Delete mapping
- `GET /api/fields/:webhook_id` - Get available source fields
- `GET /api/fields/:webhook_id/stored` - Get stored fields
- `POST /api/fields/:webhook_id/custom` - Save custom field
- `GET /api/logs` - Get all logs (paginated)
- `GET /api/logs/:webhook_id` - Get logs for webhook
- `GET /api/admin/logs/cleanup/stats` - Get cleanup stats
- `POST /api/admin/logs/cleanup/trigger` - Trigger manual cleanup

#### Database
- **SQLite** - Lightweight, embedded database
- **Migrations** - Automatic schema migrations
- **Tables**:
  - `webhooks` - Webhook configurations
  - `mappings` - Field mapping rules
  - `logs` - Delivery logs with source and transformed payloads
  - `source_fields` - Stored field definitions

#### Configuration
- **Environment Variables**
  - Server configuration (PORT, HOST, NODE_ENV)
  - Database path
  - CORS settings
  - Log level and formatting
  - Log retention settings

### Tech Stack
- **Backend**: Fastify, TypeScript, better-sqlite3, Zod, Pino
- **Frontend**: Solid.js, CodeMirror 6, Tailwind CSS, Axios
- **DevOps**: Docker, Docker Compose, nginx

### Documentation
- Comprehensive README with quick start guide
- API documentation
- Contributing guidelines
- MIT License
- Docker deployment instructions

---

## Future Roadmap

### Planned Features
- [ ] Webhook signature verification (HMAC)
- [ ] Retry logic with exponential backoff
- [ ] Rate limiting
- [ ] Custom headers for forwarding
- [ ] Webhook templates marketplace
- [ ] Batch webhook delivery
- [ ] WebSocket support for real-time updates
- [ ] Multi-user support with authentication
- [ ] Webhook filtering and routing
- [ ] GraphQL support
- [ ] Monitoring dashboard with metrics
- [ ] Webhook testing playground

---

[unreleased]: https://github.com/yourusername/webhoxy/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/webhoxy/releases/tag/v0.1.0

