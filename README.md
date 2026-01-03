# MV42.dev

**Unified VPS architecture** - Portfolio + Apps on a single DigitalOcean VPS ($4/month).

## 🏗️ Architecture

**1 repo • 1 server • 1 source of truth**

```
MV42.dev/
├── index.js              # Unified Express server
├── package.json          # All dependencies
├── .env                  # Environment variables (not committed)
│
├── app/                  # Application modules
│   └── lm/               # Spotify "Last Music" widget
│       └── server/
│           ├── index.js
│           └── persist/  # Token storage (gitignored)
│
├── web/                  # Static portfolio
│   └── public/
│       ├── index.html
│       ├── portfolio.css
│       ├── CV/
│       ├── FOV/
│       └── OptiTime/
│
├── deploy/               # Deployment automation
│   ├── ecosystem.config.js   # PM2 configuration
│   ├── deploy.sh             # Auto-deploy script
│   └── webhook.json          # GitHub webhook config
│
└── nginx/                # Reverse proxy config
    └── mv42.conf         # Nginx site configuration
```

## 🌐 Routing

Single Node.js server (port 3000) serves everything:

- **mv42.dev** → Static portfolio (`/web/public/`)
- **app.mv42.dev** → Spotify widget (`/lm`)
- **mv42.dev/hooks/** → Webhook endpoint (internal)

Nginx handles SSL termination and proxies to port 3000.

## 🚀 Local Development

```bash
git clone https://github.com/MV42/MV42.dev.git
cd MV42.dev
npm install
cp .env.example .env  # Create and configure
npm start
```

Server starts on `http://localhost:3000`

## 📦 Production Deployment

### Initial Setup (VPS)

```bash
# 1. Clone repository
cd /srv
git clone https://github.com/MV42/MV42.dev.git mv42
cd /srv/mv42

# 2. Install dependencies
npm install --omit=dev

# 3. Create sensitive files
nano .env
nano app/lm/server/serviceAccountKey.json

# 4. Start with PM2
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup

# 5. Configure Nginx
sudo cp nginx/mv42.conf /etc/nginx/sites-available/mv42
sudo ln -s /etc/nginx/sites-available/mv42 /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 6. Setup webhook listener
sudo apt install -y webhook
webhook -hooks /srv/mv42/deploy/webhook.json -port 9000 -daemon

# 7. Make deploy script executable
chmod +x deploy/deploy.sh
```

### GitHub Webhook Setup

1. Go to **Settings → Webhooks** on GitHub
2. Add webhook:
   - URL: `https://mv42.dev/hooks/mv42-deploy`
   - Content type: `application/json`
   - Secret: Same as in `deploy/webhook.json`
   - Events: `push` on `main` branch

### Auto-deployment

Every push to `main` triggers automatic deployment:

```bash
git push origin main
# → GitHub webhook → deploy.sh → git pull → npm install → pm2 reload
```

## 🔑 Environment Variables

Create `.env` in root:

```env
NODE_ENV=production
PORT=3000
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=https://app.mv42.dev/lm/callback
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

## 📋 Useful Commands

```bash
# View logs
pm2 logs mv42-unified

# Restart application
pm2 restart mv42-unified

# Manual deployment
cd /srv/mv42 && ./deploy/deploy.sh

# Check PM2 status
pm2 status

# Monitor resources
pm2 monit
```

## 📄 License

MIT
