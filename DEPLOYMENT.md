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

## Quick Start

### 1. Local Development

```bash
# Copy environment template
cp env.example .env

# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost
# API: http://localhost/api
# Webhooks: http://localhost/webhook/{webhook-id}
```

### 2. Production Deployment

#### Step 1: Configure Environment

Create a `.env` file from the template:

```bash
cp env.example .env
```

Edit `.env` with your production values:

```env
# Your domain name
DOMAIN=webhoxy.yourdomain.com
PUBLIC_URL=https://webhoxy.yourdomain.com

# Ports (use 80/443 for production)
PROXY_PORT=80
PROXY_SSL_PORT=443

# API Configuration
NODE_ENV=production
LOG_LEVEL=info
LOG_PRETTY=false

# CORS (add your domains)
CORS_ORIGIN=https://webhoxy.yourdomain.com
```

#### Step 2: Deploy

```bash
# Pull latest changes
git pull

# Rebuild and start services
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
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
