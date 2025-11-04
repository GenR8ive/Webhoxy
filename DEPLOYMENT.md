# 🚀 Deployment Guide

This guide covers different deployment options for Webhoxy.

---

## Table of Contents

- [Docker Deployment](#docker-deployment) (Recommended)
- [Manual Deployment](#manual-deployment)
- [Cloud Platforms](#cloud-platforms)
- [Environment Configuration](#environment-configuration)
- [Reverse Proxy Setup](#reverse-proxy-setup)
- [Production Checklist](#production-checklist)

---

## 🐳 Docker Deployment (Recommended)

Docker is the easiest way to deploy Webhoxy with all services properly configured.

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

### Quick Deploy

```bash
# Clone the repository
git clone https://github.com/yourusername/webhoxy.git
cd webhoxy

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

**Access:**
- Web UI: http://your-server:80
- API: http://your-server:8080

### Production Configuration

Edit `docker-compose.yml` for production:

```yaml
services:
  api:
    environment:
      - NODE_ENV=production
      - CORS_ORIGIN=https://your-domain.com
      - LOG_LEVEL=info
      - LOG_RETENTION_DAYS=30  # Keep logs for 30 days
    volumes:
      - ./api/data:/app/data  # Persistent storage
    restart: always

  web:
    restart: always
```

### SSL/TLS with Traefik

```yaml
services:
  traefik:
    image: traefik:v2.10
    command:
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.email=your@email.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./letsencrypt:/letsencrypt
    restart: always

  web:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.webhoxy.rule=Host(`your-domain.com`)"
      - "traefik.http.routers.webhoxy.entrypoints=websecure"
      - "traefik.http.routers.webhoxy.tls.certresolver=letsencrypt"

  api:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.your-domain.com`)"
      - "traefik.http.routers.api.entrypoints=websecure"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"
```

---

## 🔧 Manual Deployment

Deploy without Docker on a VPS or dedicated server.

### Prerequisites

- Node.js 20+
- npm 10+
- nginx or Apache (for reverse proxy)
- PM2 or systemd (for process management)

### 1. Setup Application

```bash
# Clone repository
git clone https://github.com/yourusername/webhoxy.git
cd webhoxy

# Run setup
npm install
npm run setup

# Build services
npm run build
```

### 2. Configure Environment

**API** (`api/.env`):
```env
PORT=8080
HOST=0.0.0.0
NODE_ENV=production
DATABASE_URL=./data/webhoxy.db
CORS_ORIGIN=https://your-domain.com
LOG_LEVEL=info
LOG_PRETTY=false
LOG_RETENTION_DAYS=30
```

**Web** (`web/.env`):
```env
VITE_API_URL=https://api.your-domain.com
```

### 3. Start Services with PM2

```bash
# Install PM2
npm install -g pm2

# Start API
cd api
pm2 start npm --name "webhoxy-api" -- start

# Start Web (with serve)
cd ../web
npm install -g serve
pm2 start serve --name "webhoxy-web" -- -s dist -l 5173

# Save PM2 configuration
pm2 save
pm2 startup
```

### 4. Configure Reverse Proxy

**nginx Configuration** (`/etc/nginx/sites-available/webhoxy`):

```nginx
# Web UI
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    location / {
        root /var/www/webhoxy/web/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}

# API
server {
    listen 80;
    server_name api.your-domain.com;
    
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/webhoxy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL Certificate with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d api.your-domain.com
```

---

## ☁️ Cloud Platforms

### AWS EC2

1. **Launch EC2 Instance**
   - Ubuntu 22.04 LTS
   - t3.small or larger
   - Open ports: 22, 80, 443

2. **Install Dependencies**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Docker (optional)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
```

3. **Deploy Application**
   - Follow [Manual Deployment](#manual-deployment) or [Docker Deployment](#docker-deployment)

### DigitalOcean

1. **Create Droplet**
   - Ubuntu 22.04
   - Basic plan: $6/month
   - Add SSH key

2. **One-Click Deploy with Docker**
```bash
# Install Docker
sudo apt update
sudo apt install -y docker.io docker-compose

# Clone and start
git clone https://github.com/yourusername/webhoxy.git
cd webhoxy
sudo docker-compose up -d
```

### Heroku

Not ideal due to ephemeral filesystem, but possible with external database.

### Railway / Render

Both support Docker deployments - connect your GitHub repository and configure:

**Railway:**
- Add `Dockerfile` to root
- Set environment variables
- Deploy

**Render:**
- Create Web Service from Docker
- Set environment variables
- Auto-deploy on push

---

## ⚙️ Environment Configuration

### Production Environment Variables

**API**:
```env
# Server
PORT=8080
HOST=0.0.0.0
NODE_ENV=production

# Database
DATABASE_URL=/data/webhoxy.db

# Security
CORS_ORIGIN=https://your-domain.com

# Logging
LOG_LEVEL=info
LOG_PRETTY=false

# Performance
LOG_RETENTION_DAYS=30
LOG_CLEANUP_INTERVAL_HOURS=24
```

**Web**:
```env
VITE_API_URL=https://api.your-domain.com
```

---

## 🔒 Production Checklist

### Security

- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set secure environment variables
- [ ] Use API keys for webhook endpoints
- [ ] Configure IP whitelisting
- [ ] Regular security updates

### Performance

- [ ] Enable gzip compression
- [ ] Configure CDN (CloudFlare, etc.)
- [ ] Set up database backups
- [ ] Configure log retention
- [ ] Monitor resource usage

### Monitoring

- [ ] Set up uptime monitoring
- [ ] Configure log aggregation
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor disk usage
- [ ] Set up alerts

### Backups

```bash
# Backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
cp /app/api/data/webhoxy.db $BACKUP_DIR/webhoxy_$DATE.db

# Backup environment
cp /app/api/.env $BACKUP_DIR/api_env_$DATE
cp /app/web/.env $BACKUP_DIR/web_env_$DATE

# Keep only last 30 days
find $BACKUP_DIR -name "webhoxy_*.db" -mtime +30 -delete
```

Add to crontab:
```bash
0 2 * * * /path/to/backup.sh
```

---

## 🔄 Updates

### Docker

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

### Manual

```bash
# Pull latest code
git pull

# Rebuild
npm run build

# Restart services
pm2 restart all
```

---

## 📊 Monitoring

### Health Check Endpoints

```bash
# API health
curl https://api.your-domain.com/

# Web health
curl https://your-domain.com/
```

### Logs

```bash
# Docker
docker-compose logs -f api
docker-compose logs -f web

# PM2
pm2 logs webhoxy-api
pm2 logs webhoxy-web
```

---

## 🆘 Troubleshooting

### Service won't start

```bash
# Check logs
docker-compose logs

# Check port conflicts
netstat -tulpn | grep :8080
netstat -tulpn | grep :80
```

### Database issues

```bash
# Check database file
ls -lh api/data/webhoxy.db

# Backup and recreate
cp api/data/webhoxy.db api/data/webhoxy.db.backup
rm api/data/webhoxy.db
# Restart service to recreate
```

### Permission issues

```bash
# Fix ownership (Docker)
sudo chown -R 1000:1000 api/data

# Fix permissions
chmod 755 api/data
chmod 644 api/data/webhoxy.db
```

---

## 📞 Support

- **Documentation**: See README.md
- **Issues**: GitHub Issues
- **Security**: Report to security@your-domain.com

---

**Happy Deploying!** 🚀

