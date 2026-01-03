# MV42.dev Deployment Guide

Complete step-by-step deployment instructions for the unified VPS architecture.

## Prerequisites

- DigitalOcean VPS ($4/month) with Ubuntu 22.04
- Domain names configured:
  - `mv42.dev` → VPS IP
  - `app.mv42.dev` → VPS IP
- Root or sudo access

## Phase 1: Server Preparation

### 1. Update system

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js 18+

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Verify
```

### 3. Install PM2

```bash
sudo npm install -g pm2
```

### 4. Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

### 5. Install webhook

```bash
sudo apt install -y webhook
```

### 6. Install Certbot (SSL)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

## Phase 2: Repository Setup

### 7. Create directory structure

```bash
sudo mkdir -p /srv/mv42
sudo chown -R $USER:$USER /srv
```

### 8. Clone repository

```bash
cd /srv
git clone https://github.com/MV42/MV42.dev.git mv42
cd /srv/mv42
```

### 9. Install dependencies

```bash
npm install --omit=dev
```

### 10. Create sensitive files

```bash
# Environment variables
nano .env
# Paste your configuration (see .env.example)

# Firebase credentials (if using)
nano app/lm/server/serviceAccountKey.json
# Paste your Firebase service account JSON
```

## Phase 3: PM2 Configuration

### 11. Start application

```bash
cd /srv/mv42
pm2 start deploy/ecosystem.config.js
```

### 12. Save PM2 configuration

```bash
pm2 save
pm2 startup
# Follow the instructions displayed
```

### 13. Verify it's running

```bash
pm2 status
pm2 logs mv42-unified
curl http://localhost:3000  # Should return HTML
```

## Phase 4: Nginx Configuration

### 14. Copy Nginx configuration

```bash
sudo cp /srv/mv42/nginx/mv42.conf /etc/nginx/sites-available/mv42
sudo ln -s /etc/nginx/sites-available/mv42 /etc/nginx/sites-enabled/
```

### 15. Update SSL certificate paths (if needed)

```bash
sudo nano /etc/nginx/sites-available/mv42
# Adjust ssl_certificate paths to match your setup
```

### 16. Test and reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 17. Get SSL certificates

```bash
sudo certbot --nginx -d mv42.dev -d www.mv42.dev
sudo certbot --nginx -d app.mv42.dev
```

## Phase 5: Webhook Setup

### 18. Update webhook secret

```bash
nano /srv/mv42/deploy/webhook.json
# Change "CHANGE_ME_TO_YOUR_SECRET" to a strong random string
```

### 19. Generate webhook secret

```bash
openssl rand -hex 32
# Copy this value for both webhook.json and GitHub
```

### 20. Start webhook listener

```bash
webhook -hooks /srv/mv42/deploy/webhook.json -port 9000 -verbose &
```

### 21. Create webhook systemd service

```bash
sudo nano /etc/systemd/system/webhook.service
```

```ini
[Unit]
Description=GitHub Webhook Listener
After=network.target

[Service]
Type=simple
User=mv42
WorkingDirectory=/srv/mv42
ExecStart=/usr/bin/webhook -hooks /srv/mv42/deploy/webhook.json -port 9000 -verbose
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable webhook
sudo systemctl start webhook
sudo systemctl status webhook
```

## Phase 6: GitHub Configuration

### 22. Configure GitHub webhook

1. Go to `https://github.com/MV42/MV42.dev/settings/hooks`
2. Click "Add webhook"
3. Fill in:
   - **Payload URL**: `https://mv42.dev/hooks/mv42-deploy`
   - **Content type**: `application/json`
   - **Secret**: The secret from step 19
   - **Events**: Select "Just the push event"
   - **Active**: ✓
4. Click "Add webhook"

## Phase 7: Testing

### 23. Test deployment

```bash
cd /srv/mv42
git commit --allow-empty -m "Test deployment"
git push origin main
```

### 24. Verify logs

```bash
pm2 logs mv42-unified
sudo journalctl -u webhook -f
```

### 25. Test URLs

- https://mv42.dev → Portfolio
- https://mv42.dev/CV → CV
- https://app.mv42.dev/lm/login → Spotify login

## Maintenance

### View logs

```bash
pm2 logs mv42-unified
pm2 monit
```

### Manual restart

```bash
pm2 restart mv42-unified
```

### Manual deployment

```bash
cd /srv/mv42
./deploy/deploy.sh
```

### Update Node.js

```bash
sudo npm install -g n
sudo n stable
pm2 restart mv42-unified
```

## Troubleshooting

### Port 3000 already in use

```bash
sudo lsof -i :3000
# Kill the process or change PORT in .env
```

### Nginx errors

```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Webhook not triggering

```bash
sudo journalctl -u webhook -f
# Check GitHub webhook deliveries page
```

### PM2 not starting on reboot

```bash
pm2 unstartup
pm2 startup
# Run the command it outputs
pm2 save
```

## Security Checklist

- [ ] Firewall configured (ufw or iptables)
- [ ] SSH key authentication only (disable password)
- [ ] Regular system updates scheduled
- [ ] Fail2ban installed
- [ ] SSL certificates auto-renewal tested
- [ ] `.env` and secrets never committed
- [ ] GitHub webhook secret is strong
- [ ] Nginx security headers configured

## Complete!

Your VPS is now configured for automatic deployment on every push to `main`.
