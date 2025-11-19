# Webhoxy Deployment Guide

## Architecture Overview

Webhoxy uses a reverse proxy architecture with three main services:

```
Internet → Reverse Proxy (nginx) → API Service (Node.js/Fastify)
                                 → Web Service (nginx/SPA)
```

### Services

1. **Proxy Service** - Central entry point, routes all traffic
2. **API Service** - Backend REST API for webhook management
3. **Web Service** - Frontend SPA for UI

## Deployment Scenarios

Webhoxy supports two main Docker deployment strategies:

### Scenario 1: Web + API (No Proxy)
Best for simple deployments where you want to expose services directly or use your own external load balancer.

1. **Configure Environment**:
   ```bash
   cp env.example .env
   ```
   Edit `.env`:
   ```env
   API_PORT=8080
   WEB_PORT=80
   # Ensure these ports are open and not in use
   ```

2. **Run**:
   ```bash
   docker-compose up -d
   ```

3. **Access**:
   - Web: `http://your-server:80`
   - API: `http://your-server:8080`

### Scenario 2: Web + API + Proxy (Recommended)
Best for production. The Nginx proxy handles routing, SSL (optional), and provides a single entry point.

1. **Configure Environment**:
   ```bash
   cp env.example .env
   ```
   Edit `.env`:
   ```env
   DOMAIN=your-domain.com
   PROXY_PORT=80
   
   # IMPORTANT: Change WEB_PORT to avoid conflict with PROXY_PORT if on same host
   WEB_PORT=3000 
   API_PORT=8080
   ```

2. **Run**:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.proxy.yml up -d --build
   ```

3. **Access**:
   - Main: `http://your-domain.com` (Routes to Web)
   - API: `http://your-domain.com/api`
   - Webhooks: `http://your-domain.com/webhook/...`

---

## Production Deployment Steps

### 1. Prepare Server
Ensure Docker and Docker Compose are installed.

### 2. Environment Setup
Create your production `.env` file:

```bash
cp env.example .env
nano .env
```

**Critical Variables:**
- `DOMAIN`: Your actual domain name
- `PUBLIC_URL`: Full URL (e.g., `https://example.com`)
- `NODE_ENV`: Set to `production`
- `WEBHOOK_URL`: (Optional) Explicitly set the webhook base URL if needed

### 3. Deploy
```bash
# For Proxy Setup (Recommended)
docker-compose -f docker-compose.yml -f docker-compose.proxy.yml up -d --build
```

### 4. Verify
```bash
docker-compose ps
docker-compose logs -f
```

## Configuration Reference

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DOMAIN` | localhost | Your domain name |
| `PUBLIC_URL` | http://localhost | Full public URL |
| `PROXY_PORT` | 80 | HTTP port |
| `PROXY_SSL_PORT` | 443 | HTTPS port (for SSL) |
| `API_PORT` | 8080 | Internal API port |
| `NODE_ENV` | production | Node environment |
| `DATABASE_URL` | ./data/webhoxy.db | SQLite database path |
| `CORS_ORIGIN` | * | Allowed CORS origins (comma-separated) |
| `LOG_LEVEL` | info | Log level (fatal/error/warn/info/debug/trace) |
| `LOG_RETENTION_DAYS` | 7 | Days to keep webhook logs |

### Port Mapping

The reverse proxy handles all external traffic:

- **Port 80 (HTTP)**: Main entry point
- **Port 443 (HTTPS)**: SSL/TLS traffic (configure SSL separately)

Internal services are not exposed directly:
- API Service: Internal port 8080 (not exposed)
- Web Service: Internal port 80 (not exposed)

## URL Structure

With the reverse proxy, all traffic goes through a single entry point:

- **Frontend**: `http://your-domain/`
- **API Endpoints**: `http://your-domain/api/*`
- **Webhook Receivers**: `http://your-domain/webhook/{webhook-id}`
- **Health Check**: `http://your-domain/health`

## SSL/TLS Setup (HTTPS)

### Option 1: Using Let's Encrypt with Certbot

1. Update `nginx/nginx.conf` to add SSL configuration
2. Use certbot to obtain certificates
3. Mount certificates in docker-compose.yml

Example SSL configuration:

```nginx
server {
    listen 443 ssl http2;
    server_name ${DOMAIN};
    
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    # ... rest of configuration
}
```

### Option 2: Using Cloudflare or Another CDN

Set up Cloudflare in front of your server:
1. Point your domain DNS to Cloudflare
2. Enable SSL in Cloudflare
3. Set `PUBLIC_URL=https://your-domain.com` in .env
4. Cloudflare handles SSL termination

## Monitoring

### Check Service Health

```bash
# All services status
docker-compose ps

# Individual service logs
docker-compose logs api
docker-compose logs web
docker-compose logs proxy

# Follow logs in real-time
docker-compose logs -f

# Health check
curl http://localhost/health
```

### Common Issues

**Issue**: Proxy shows unhealthy
- **Solution**: Check if API and Web services are healthy first
- **Check**: `docker-compose logs proxy`

**Issue**: Can't access webhook endpoints
- **Solution**: Verify PUBLIC_URL is set correctly
- **Check**: Webhook URLs should use the PUBLIC_URL domain

## Scaling

For high-traffic deployments:

1. **Horizontal Scaling**: Run multiple API instances
2. **Load Balancing**: Add more upstreams in nginx.conf
3. **Database**: Consider migrating from SQLite to PostgreSQL

## Backup and Restore

### Backup

```bash
# Backup database
docker-compose exec api cp /app/data/webhoxy.db /app/data/backup-$(date +%Y%m%d).db

# Copy backup to host
docker cp webhoxy-api:/app/data/backup-*.db ./backups/
```

### Restore

```bash
# Copy backup to container
docker cp ./backups/backup-20250101.db webhoxy-api:/app/data/webhoxy.db

# Restart services
docker-compose restart api
```

## Maintenance

### Update Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up --build -d
```

### Clean Up

```bash
# Remove old containers
docker-compose down

# Remove unused images
docker system prune -a

# Remove volumes (WARNING: deletes data)
docker-compose down -v
```

## Security Best Practices

1. **Change default ports** in production if needed
2. **Enable SSL/TLS** for production deployments
3. **Set proper CORS_ORIGIN** - don't use `*` in production
4. **Regular backups** of the database
5. **Monitor logs** for suspicious activity
6. **Use firewall rules** to restrict access
7. **Keep Docker images updated**

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Check health: `curl http://localhost/health`
3. Review this guide
4. Check the main README.md for application usage
