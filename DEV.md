# MV42.dev — Developer Guide

Complete setup, deployment, and maintenance guide for the unified VPS architecture.

---

## 📋 Prerequisites

- **DigitalOcean VPS** ($4/month) running Ubuntu 22.04+
- **Domain names** with DNS A records pointing to VPS IP:
  - `mv42.dev`
  - `www.mv42.dev`
  - `app.mv42.dev`
  - `web.mv42.dev`
- **Node.js** 18+ installed
- **Root or sudo access**

---

## 🚀 Initial VPS Setup

### 1. Update system and install dependencies

```bash
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install -y nginx
sudo systemctl enable nginx

# Install Certbot (SSL certificates)
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Clone repository

```bash
sudo mkdir -p /srv/mv42
sudo chown -R $USER:$USER /srv

cd /srv
git clone https://github.com/MV42/MV42.dev.git mv42
cd /srv/mv42
```

### 3. Install dependencies

```bash
npm install --omit=dev
```

### 4. Configure environment variables

```bash
cp .env.example .env
nano .env
```

**Required variables:**
```env
NODE_ENV=production
PORT=3000
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://app.mv42.dev/GroupLink/callback
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

**Optional:** Add Firebase service account key for push notifications:
```bash
nano app/GroupLink/server/serviceAccountKey.json
# Paste your Firebase service account JSON
```

### 5. Configure SSL certificates

Stop nginx temporarily and generate a single certificate for all domains:

```bash
sudo systemctl stop nginx

sudo certbot certonly --standalone \
  -d mv42.dev \
  -d www.mv42.dev \
  -d app.mv42.dev \
  -d web.mv42.dev

sudo systemctl start nginx
```

Verify the certificate:
```bash
sudo certbot certificates
# Should show: Certificate Name: mv42.dev
#              Domains: mv42.dev www.mv42.dev app.mv42.dev web.mv42.dev
```

### 6. Configure Nginx

```bash
# Copy site configuration
sudo cp /srv/mv42/nginx/mv42.conf /etc/nginx/sites-available/mv42
sudo ln -sf /etc/nginx/sites-available/mv42 /etc/nginx/sites-enabled/mv42

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

### 7. Start application with PM2

```bash
cd /srv/mv42
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup
# Run the command it outputs to enable auto-start on boot
```

### 8. Verify deployment

```bash
pm2 status        # Should show mv42-unified running
pm2 logs          # Check for errors

# Test endpoints
curl -I https://mv42.dev           # Portal
curl -I https://web.mv42.dev       # Web gallery
curl -I https://app.mv42.dev       # Apps gallery
curl -I https://app.mv42.dev/GroupLink/login  # GroupLink
```

---

## 🔄 GitHub Actions Auto-Deployment

Every push to `main` triggers automatic deployment via GitHub Actions.

### Configure GitHub Secrets

1. Generate SSH key on VPS:
```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_deploy  # Copy this private key
```

2. Add secrets to GitHub repository:
   - Go to `https://github.com/MV42/MV42.dev/settings/secrets/actions`
   - Add three secrets:
     - `SSH_HOST` → Your VPS IP address
     - `SSH_USERNAME` → `root` or your SSH user
     - `SSH_PRIVATE_KEY` → Content of `~/.ssh/github_deploy`

3. **(If not using root)** Add sudo permissions for nginx:
```bash
sudo visudo
# Add this line (replace 'youruser'):
youruser ALL=(ALL) NOPASSWD: /usr/bin/nginx, /usr/sbin/nginx, /bin/systemctl, /usr/bin/cp, /usr/bin/ln, /usr/bin/sed
```

### Workflow behavior

On every push to `main`, the workflow:
1. Connects to VPS via SSH
2. Pulls latest code (`git reset --hard origin/main`)
3. Installs dependencies (`npm install --omit=dev`)
4. Updates Nginx configuration
5. Reloads Nginx
6. Restarts PM2 process

Check deployment status: `https://github.com/MV42/MV42.dev/actions`

---

## 🛠️ Maintenance

### View logs
```bash
pm2 logs mv42-unified
pm2 monit
sudo tail -f /var/log/nginx/error.log
```

### Manual restart
```bash
pm2 restart mv42-unified
sudo systemctl reload nginx
```

### Manual deployment
```bash
cd /srv/mv42
git pull origin main
npm install --omit=dev
pm2 reload deploy/ecosystem.config.js
```

### Update Node.js
```bash
sudo npm install -g n
sudo n stable
pm2 restart mv42-unified
```

### Test SSL renewal
```bash
sudo certbot renew --dry-run
```

---

## 🧹 Local Development

```bash
# Clone repository
git clone https://github.com/MV42/MV42.dev.git
cd MV42.dev

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env  # Add your credentials

# Start server
npm start  # or npm run dev for hot-reload
```

Server runs on `http://localhost:3000`

---

## 🐛 Troubleshooting

### Port 3000 already in use
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Nginx configuration errors
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### PM2 not starting on reboot
```bash
pm2 unstartup
pm2 startup
pm2 save
```

### SSL certificate issues
```bash
sudo certbot certificates
sudo certbot renew --force-renewal
```

### GitHub Actions deployment fails
- Check secrets are configured correctly
- Verify SSH key has proper permissions
- Check workflow logs on GitHub Actions tab
- Ensure nginx sudoers permissions are set (if not root)

---

## 🔐 Security Checklist

- [ ] Firewall enabled (`ufw enable`)
- [ ] SSH key authentication only (disable password auth)
- [ ] Fail2ban installed and configured
- [ ] SSL auto-renewal tested
- [ ] `.env` and secrets never committed (check `.gitignore`)
- [ ] GitHub webhook/secrets are strong
- [ ] Regular system updates scheduled
- [ ] PM2 running as non-root user (recommended)

---

## 📦 Architecture Summary

**Single unified Node.js server** (`index.js`) on port 3000:
- Host-based routing (portal, web gallery, app gallery)
- GroupLink mounted on `/GroupLink`
- Static files served from `web/public/`

**Nginx** handles:
- SSL termination (all domains use single certificate)
- Reverse proxy to Node.js (port 3000)
- HTTP → HTTPS redirect

**PM2** manages:
- Process monitoring and auto-restart
- Log aggregation
- Auto-start on boot

**GitHub Actions** automates:
- Code deployment on push to `main`
- Dependency installation
- Service reload

---

## 📄 License

MIT
