# Development Guide

This guide covers different ways to run Webhoxy for development purposes.

## Development Scenarios

### Scenario 3: Local Dev (npm run dev)
Run services individually for maximum control and faster feedback loops.

1. **Setup API**:
   ```bash
   cd api
   cp .env.example .env
   npm install
   npm run dev
   ```
   *Runs on port 8080*

2. **Setup Web**:
   ```bash
   cd web
   cp .env.example .env
   npm install
   npm run dev
   ```
   *Runs on port 5173 (default)*

3. **Access**:
   - Web: `http://localhost:5173`
   - API: `http://localhost:8080`

### Scenario 4: Local Dev + External Proxy
Run services locally but access them through a Dockerized Nginx proxy. This mimics production routing while keeping hot-reload.

1. **Start Local Services**:
   Follow steps in Scenario 3 to start API and Web.

2. **Start Proxy**:
   ```bash
   # From root directory
   docker-compose -f docker-compose.dev-proxy.yml up -d
   ```
   *This proxy is configured to forward traffic to `host.docker.internal`.*

3. **Configure Web (Optional)**:
   To make the UI display the proxy URL:
   - Edit `web/.env`:
     ```env
     VITE_WEBHOOK_URL=http://localhost/webhook
     ```

4. **Access**:
   - App: `http://localhost` (Routes to your local running Web)
   - API: `http://localhost/api` (Routes to your local running API)

---

### Docker Development
If you prefer developing entirely within Docker:

**Run Web + API (No Proxy)**:
```bash
docker-compose up
```

**Run Web + API + Proxy**:
```bash
docker-compose -f docker-compose.yml -f docker-compose.proxy.yml up
```

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

