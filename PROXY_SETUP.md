# Reverse Proxy Setup - Quick Reference

## What Changed?

Your Webhoxy application now uses a **centralized reverse proxy** architecture:

### Before (Direct Access)
```
http://localhost:8080/  → API
http://localhost/       → Web Frontend
```

### After (Reverse Proxy)
```
http://localhost/          → Web Frontend  (via proxy)
http://localhost/api/      → API           (via proxy)
http://localhost/webhook/  → Webhooks      (via proxy)
http://localhost/health    → Health Check  (via proxy)
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Internet / External                       │
└────────────────────────────┬────────────────────────────────┘
                             │
                    Port 80 (HTTP) / 443 (HTTPS)
                             │
                             ▼
                    ┌─────────────────┐
                    │  Reverse Proxy  │  (nginx)
                    │   Port 80/443   │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌───────────┐    ┌───────────┐    ┌───────────┐
    │    API    │    │    Web    │    │ Webhooks  │
    │  Port N/A │    │  Port N/A │    │  (API)    │
    └───────────┘    └───────────┘    └───────────┘
    (not exposed)    (not exposed)    (routed via API)
```

## Benefits

✅ **Single Entry Point**: All traffic goes through port 80 (and 443 for SSL)  
✅ **Easy Configuration**: Change domain/URL in one place (.env file)  
✅ **Better Security**: Internal services not exposed directly  
✅ **SSL/TLS Ready**: Easy to add certificates for HTTPS  
✅ **Production Ready**: Proper headers, timeouts, and routing  
✅ **Scalable**: Easy to add more backend instances  

## URL Structure

All URLs now follow a consistent pattern through the proxy:

| Service | URL Pattern | Proxies To |
|---------|-------------|------------|
| Frontend | `http://your-domain/` | `webhoxy-web:80` |
| API | `http://your-domain/api/*` | `webhoxy-api:8080/api/*` |
| Webhooks | `http://your-domain/webhook/{id}` | `webhoxy-api:8080/api/webhooks/receive/{id}` |
| Health | `http://your-domain/health` | `webhoxy-api:8080/` |

## Configuration

### Environment Variables (.env)

The key configuration variables for the proxy:

```env
# Your domain (used in nginx config)
DOMAIN=localhost

# Full public URL (used by the app to generate webhook URLs)
PUBLIC_URL=http://localhost

# External ports
PROXY_PORT=80        # HTTP port
PROXY_SSL_PORT=443   # HTTPS port (for SSL)

# CORS settings (should match your PUBLIC_URL)
CORS_ORIGIN=http://localhost
```

### Local Development

```bash
# Use localhost
DOMAIN=localhost
PUBLIC_URL=http://localhost
PROXY_PORT=80
```

### Production Server

```bash
# Use your domain
DOMAIN=webhoxy.example.com
PUBLIC_URL=https://webhoxy.example.com
PROXY_PORT=80
PROXY_SSL_PORT=443
CORS_ORIGIN=https://webhoxy.example.com
```

### Behind Another Proxy/CDN (e.g., Cloudflare)

```bash
# Use non-standard ports if needed
DOMAIN=webhoxy.example.com
PUBLIC_URL=https://webhoxy.example.com
PROXY_PORT=8080      # Different port if 80 is taken
CORS_ORIGIN=https://webhoxy.example.com
```

## Testing the Setup

### Check All Services

```bash
# Check service status
docker-compose ps

# All three services should show (healthy):
# - webhoxy-proxy  (healthy)
# - webhoxy-api    (healthy)
# - webhoxy-web    (healthy)
```

### Test Endpoints

```bash
# Health check (returns API status)
curl http://localhost/health

# Frontend (returns HTML)
curl http://localhost/

# API (create a webhook example)
curl -X POST http://localhost/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Webhook","url":"https://example.com/target"}'
```

### View Logs

```bash
# Proxy logs (see routing)
docker-compose logs -f proxy

# API logs
docker-compose logs -f api

# All logs
docker-compose logs -f
```

## Common Scenarios

### Scenario 1: Running on a VPS with a domain

1. Point your domain DNS to your server IP
2. Update `.env`:
   ```env
   DOMAIN=webhoxy.yourdomain.com
   PUBLIC_URL=https://webhoxy.yourdomain.com
   CORS_ORIGIN=https://webhoxy.yourdomain.com
   ```
3. Setup SSL (see DEPLOYMENT.md for SSL setup)
4. Run: `docker-compose up -d`

### Scenario 2: Running on localhost for development

1. Use the default `.env` settings:
   ```env
   DOMAIN=localhost
   PUBLIC_URL=http://localhost
   ```
2. Run: `docker-compose up -d`
3. Access at: http://localhost

### Scenario 3: Running behind Cloudflare

1. Point Cloudflare to your server IP
2. Enable SSL in Cloudflare
3. Update `.env`:
   ```env
   DOMAIN=webhoxy.yourdomain.com
   PUBLIC_URL=https://webhoxy.yourdomain.com
   CORS_ORIGIN=https://webhoxy.yourdomain.com
   ```
4. Cloudflare handles SSL termination
5. Your server receives HTTP traffic

### Scenario 4: Custom ports (e.g., port 80 already in use)

1. Update `.env`:
   ```env
   PROXY_PORT=8080
   PUBLIC_URL=http://localhost:8080
   ```
2. Access at: http://localhost:8080

## Nginx Proxy Configuration

The proxy is configured in `nginx/nginx.conf`. Key features:

- **Load balancing ready**: Upstream blocks for easy scaling
- **WebSocket support**: For real-time features
- **Large payloads**: 50MB max body size for webhooks
- **Security headers**: X-Real-IP, X-Forwarded-* headers
- **Timeouts**: 60s for long-running requests
- **Health checks**: Built-in monitoring

## Troubleshooting

### Problem: Proxy shows unhealthy

**Check:**
```bash
docker-compose logs proxy
curl http://localhost/health
```

**Solution:** Ensure API and Web services are healthy first.

### Problem: 502 Bad Gateway

**Cause:** Backend service is down or not responding

**Check:**
```bash
docker-compose ps
docker-compose logs api
docker-compose logs web
```

### Problem: Webhooks return wrong URL

**Cause:** PUBLIC_URL not set correctly

**Solution:** Update `.env` with the correct PUBLIC_URL and restart:
```bash
docker-compose restart api
```

### Problem: CORS errors in browser

**Cause:** CORS_ORIGIN doesn't match your domain

**Solution:** Update CORS_ORIGIN in `.env`:
```env
CORS_ORIGIN=https://your-actual-domain.com
```

## Customization

### Add SSL Certificate

Edit `nginx/nginx.conf` to add SSL configuration:

```nginx
server {
    listen 443 ssl http2;
    server_name ${DOMAIN};
    
    ssl_certificate /etc/ssl/certs/fullchain.pem;
    ssl_certificate_key /etc/ssl/private/privkey.pem;
    
    # ... rest of config
}
```

### Add Rate Limiting

Add to `nginx/nginx.conf`:

```nginx
limit_req_zone $binary_remote_addr zone=webhook_limit:10m rate=10r/s;

location /webhook/ {
    limit_req zone=webhook_limit burst=20;
    # ... rest of config
}
```

### Add Custom Headers

Add to `nginx/nginx.conf`:

```nginx
add_header X-Custom-Header "value";
```

## Next Steps

1. ✅ Test the reverse proxy locally
2. 📝 Update your `.env` for production
3. 🔒 Setup SSL/TLS (see DEPLOYMENT.md)
4. 🚀 Deploy to your server
5. 📊 Monitor logs and health checks

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

