# Environment Configuration Guide

This document explains all the `.env` files in the project and when to use each one.

## 📁 Environment Files Overview

```
webhoxy/
├── .env                    # Active config for Docker Compose (gitignored)
├── env.example             # Template for Docker Compose setup
├── api/.env.example        # Template for standalone API development
└── web/.env.example        # Template for standalone web development
```

## 🎯 When to Use Each File

### 1. Root `.env` (Docker Compose - Full Stack)

**Location:** `/env.example` → copy to `/.env`

**Use when:**
- Running with Docker Compose (full stack with proxy)
- Running in development mode (API + Web without proxy)
- Deploying to production

**Setup:**
```bash
cp env.example .env
# Edit .env as needed
docker-compose up
```

**Contains:**
- `DOMAIN` - Your domain name
- `PUBLIC_URL` - Full public URL
- `PROXY_PORT` - External HTTP port
- `PROXY_SSL_PORT` - External HTTPS port
- `API_PORT` - Internal API port
- `CORS_ORIGIN` - Allowed origins
- `LOG_LEVEL`, `DATABASE_URL`, etc.

**Example:**
```env
DOMAIN=localhost
PUBLIC_URL=http://localhost
PROXY_PORT=80
API_PORT=8080
CORS_ORIGIN=http://localhost
```

---

### 2. API `.env` (Standalone API Development)

**Location:** `/api/.env.example` → copy to `/api/.env`

**Use when:**
- Running API with `npm run dev` (without Docker)
- Developing API features locally
- Testing API independently

**Setup:**
```bash
cd api
cp .env.example .env
# Edit .env as needed
npm install
npm run dev
```

**Contains:**
- `PORT` - API port (default: 8080)
- `HOST` - Bind address (default: 0.0.0.0)
- `NODE_ENV` - Environment (development/production)
- `DATABASE_URL` - Database path
- `CORS_ORIGIN` - Allowed origins (use * for development)
- `LOG_LEVEL`, `LOG_PRETTY`, etc.
- `PUBLIC_URL` - For generating webhook URLs

**Example:**
```env
PORT=8080
HOST=0.0.0.0
NODE_ENV=development
CORS_ORIGIN=*
LOG_PRETTY=true
PUBLIC_URL=http://localhost:8080
```

---

### 3. Web `.env` (Standalone Frontend Development)

**Location:** `/web/.env.example` → copy to `/web/.env`

**Use when:**
- Running frontend with `npm run dev` (without Docker)
- Developing UI features locally
- Testing frontend independently

**Setup:**
```bash
cd web
cp .env.example .env
# Edit .env to point to your API
npm install
npm run dev
```

**Contains:**
- `VITE_API_URL` - API endpoint URL (⚠️ Must have `VITE_` prefix!)

**Example:**
```env
# Local API development
VITE_API_URL=http://localhost:8080

# Or with Docker
VITE_API_URL=http://localhost:8080

# Or with proxy
VITE_API_URL=http://localhost
```

**Important:** Vite requires the `VITE_` prefix for environment variables to be accessible in the client-side code.

---

## 🚀 Common Development Scenarios

### Scenario 1: Full Docker Development (With Proxy)

**Best for:** Testing production setup locally

```bash
# Setup
cp env.example .env

# Run
docker-compose up

# Access
# - Frontend: http://localhost/
# - API: http://localhost/api/
```

**Uses:** `/.env` only

---

### Scenario 2: Docker Development (No Proxy)

**Best for:** Developing with Docker but want direct access

```bash
# Setup
cp env.example .env

# Run
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Access
# - API: http://localhost:8080/
# - Web: http://localhost:3000/
```

**Uses:** `/.env` only

---

### Scenario 3: Local Development (npm run dev)

**Best for:** Active development with hot reload

```bash
# Setup API
cd api
cp .env.example .env
npm install

# Setup Web
cd ../web
cp .env.example .env
npm install

# Terminal 1 - Run API
cd api
npm run dev

# Terminal 2 - Run Web
cd web
npm run dev

# Access
# - API: http://localhost:8080/
# - Web: http://localhost:3000/
```

**Uses:** `/api/.env` and `/web/.env`

---

### Scenario 4: Mixed Development

**Best for:** Developing frontend while API runs in Docker

```bash
# Run API in Docker
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up api

# Run Web locally
cd web
cp .env.example .env
# Make sure VITE_API_URL=http://localhost:8080
npm run dev

# Access
# - API: http://localhost:8080/
# - Web: http://localhost:3000/
```

**Uses:** `/.env` (for Docker) and `/web/.env` (for local web)

---

## 🔧 Configuration Matrix

| Scenario | Root `.env` | API `.env` | Web `.env` |
|----------|------------|------------|------------|
| **Docker Full Stack** | ✅ Required | ❌ Not used | ❌ Not used |
| **Docker Dev Mode** | ✅ Required | ❌ Not used | ❌ Not used |
| **Local API Only** | ❌ Not needed | ✅ Required | ❌ Not needed |
| **Local Web Only** | ❌ Not needed | ❌ Not needed | ✅ Required |
| **Both Local** | ❌ Not needed | ✅ Required | ✅ Required |
| **API Docker + Web Local** | ✅ Required | ❌ Not used | ✅ Required |

---

## 📝 Configuration Templates

### Development (Local)

#### api/.env
```env
PORT=8080
NODE_ENV=development
CORS_ORIGIN=*
LOG_PRETTY=true
PUBLIC_URL=http://localhost:8080
```

#### web/.env
```env
VITE_API_URL=http://localhost:8080
```

---

### Development (Docker)

#### .env
```env
DOMAIN=localhost
PUBLIC_URL=http://localhost
PROXY_PORT=80
NODE_ENV=development
CORS_ORIGIN=http://localhost
LOG_PRETTY=false
```

---

### Production

#### .env
```env
DOMAIN=webhooks.yourdomain.com
PUBLIC_URL=https://webhooks.yourdomain.com
PROXY_PORT=80
PROXY_SSL_PORT=443
NODE_ENV=production
CORS_ORIGIN=https://webhooks.yourdomain.com
LOG_PRETTY=false
LOG_LEVEL=info
```

---

## ⚠️ Important Notes

1. **Never commit `.env` files** - They're in `.gitignore` for a reason
2. **Only commit `.env.example` files** - These are templates for others
3. **Vite requires `VITE_` prefix** - Environment variables for the frontend must start with `VITE_`
4. **CORS settings matter** - Make sure `CORS_ORIGIN` matches your frontend URL
5. **PUBLIC_URL is important** - Used for generating webhook URLs

---

## 🔍 Troubleshooting

### Frontend can't connect to API

**Check:**
```bash
# In web/.env
VITE_API_URL=http://localhost:8080

# Or if using proxy
VITE_API_URL=http://localhost
```

### CORS errors

**Check:**
```bash
# In API config, make sure CORS_ORIGIN includes your frontend URL
CORS_ORIGIN=http://localhost:3000,http://localhost

# Or for development
CORS_ORIGIN=*
```

### Webhook URLs are wrong

**Check:**
```bash
# Make sure PUBLIC_URL matches your actual domain
PUBLIC_URL=http://localhost:8080       # for local
PUBLIC_URL=https://your-domain.com     # for production
```

---

## 📚 Related Documentation

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Full development guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment
- **[PROXY_SETUP.md](./PROXY_SETUP.md)** - Reverse proxy configuration

---

## Quick Commands

```bash
# Create all .env files from templates
cp env.example .env
cp api/.env.example api/.env
cp web/.env.example web/.env

# Start everything with Docker
docker-compose up

# Start everything locally
cd api && npm run dev &
cd web && npm run dev &
```

