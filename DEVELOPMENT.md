# Development Guide

This guide covers different ways to run Webhoxy for development purposes.

## Three Development Modes

### 1. Full Stack with Proxy (Recommended for testing production setup)

Run all services together with the reverse proxy:

```bash
# Start all services (proxy, api, web)
docker-compose up

# Or in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Access:
# - Frontend: http://localhost/
# - API: http://localhost/api/
# - Health: http://localhost/health
```

**Use this when:**
- Testing the full production setup locally
- Testing webhook endpoints with proper routing
- Verifying proxy configuration

---

### 2. Services Without Proxy (Development Mode)

Run API and Web independently without the proxy:

```bash
# Start API and Web (no proxy)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Or specific service only
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up api
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up web

# Access:
# - API: http://localhost:8080/
# - Web: http://localhost:3000/
```

**Use this when:**
- Developing API features
- Developing frontend features
- Don't need the full proxy setup
- Want faster startup times

---

### 3. Individual Services (Maximum Flexibility)

Run just one service at a time:

#### API Only

```bash
# Start just the API
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up api

# Access: http://localhost:8080/
```

#### Web Only

```bash
# Start just the Web frontend
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up web

# Access: http://localhost:3000/
```

**Use this when:**
- Working on a specific service
- Need minimal resource usage
- Debugging a single component

---

## Quick Reference

| Mode | Command | API URL | Web URL |
|------|---------|---------|---------|
| **Full Stack (Proxy)** | `docker-compose up` | http://localhost/api/ | http://localhost/ |
| **Dev Mode (No Proxy)** | `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up` | http://localhost:8080/ | http://localhost:3000/ |
| **API Only** | `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up api` | http://localhost:8080/ | - |
| **Web Only** | `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up web` | - | http://localhost:3000/ |

---

## Port Mapping

### Production Mode (with Proxy)
```
External → Internal
   80    → proxy:80 → api:8080 (internal)
                   → web:80 (internal)
```

### Development Mode (without Proxy)
```
External → Internal
  8080   → api:8080
  3000   → web:80
```

---

## Environment Configuration

### Full Stack Mode
Uses root `.env` file:
```bash
cp env.example .env
# Edit .env as needed
```

### API Standalone Development
Uses `api/.env` file:
```bash
cp api/.env.example api/.env
# Edit api/.env as needed
```

---

## Common Development Tasks

### Rebuild After Code Changes

```bash
# Rebuild specific service
docker-compose build api
docker-compose build web

# Rebuild and restart
docker-compose up --build
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f proxy
```

### Reset Everything

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (WARNING: deletes database)
docker-compose down -v

# Clean rebuild
docker-compose up --build
```

### Run Commands Inside Container

```bash
# Execute command in API container
docker-compose exec api sh

# Execute command in Web container
docker-compose exec web sh
```

---

## Hot Reload / Live Development (Without Docker)

For active development with hot reload, you can run the services directly without Docker:

### API Development (Node.js)

```bash
cd api
npm install
cp .env.example .env
# Edit .env if needed
npm run dev  # Runs with nodemon for auto-reload
```

Access: http://localhost:8080/

### Web Development (Vite + SolidJS)

```bash
cd web
npm install
cp .env.example .env
# Edit .env to point to your API (default: http://localhost:8080)
npm run dev  # Runs Vite dev server with HMR
```

Access: http://localhost:3000/

**Note:** Make sure the API is running (either via Docker or `npm run dev` in the api folder) before starting the web frontend.

### Running Both Locally

```bash
# Terminal 1 - API
cd api
npm install
cp .env.example .env
npm run dev

# Terminal 2 - Web
cd web
npm install
cp .env.example .env
npm run dev
```

Then access:
- API: http://localhost:8080/
- Web: http://localhost:3000/

---

## Debugging

### Check Service Health

```bash
# Check all services status
docker-compose ps

# Health check API
curl http://localhost:8080/  # Dev mode
curl http://localhost/health  # Proxy mode
```

### Database Access

```bash
# Copy database from container
docker cp webhoxy-api:/app/data/webhoxy.db ./webhoxy.db

# Use SQLite browser to inspect
sqlite3 webhoxy.db
```

### Network Issues

```bash
# Check if services can communicate
docker-compose exec api ping web
docker-compose exec web ping api

# Check network
docker network inspect webhoxy-network
```

---

## Tips

1. **Use Dev Mode for Feature Development**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
   ```

2. **Use Proxy Mode Before Deploying**
   ```bash
   docker-compose up
   ```

3. **Keep .env files in .gitignore**
   - Never commit actual `.env` files
   - Only commit `.env.example` templates

4. **Use Environment Variables**
   ```bash
   # Override on command line
   PROXY_PORT=8080 docker-compose up
   ```

---

## Switching Between Modes

### From Proxy Mode to Dev Mode

```bash
# Stop current services
docker-compose down

# Start in dev mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### From Dev Mode to Proxy Mode

```bash
# Stop current services
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

# Start in proxy mode
docker-compose up
```

---

## Production vs Development

| Feature | Development | Production |
|---------|------------|------------|
| Proxy | Optional | Required |
| Ports Exposed | 8080, 3000 | 80, 443 |
| Logging | Pretty, verbose | JSON, structured |
| Hot Reload | Yes (local dev) | No |
| CORS | Open (*) | Restricted |
| NODE_ENV | development | production |

---

## Next Steps

- For production deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md)
- For proxy configuration, see [PROXY_SETUP.md](./PROXY_SETUP.md)
- For general usage, see [README.md](./README.md)

