# MV42.dev

Personal portfolio and Node.js services hosted on a single DigitalOcean VPS ($4/month).

## 🏗️ Architecture

This repository contains two separate Node.js applications running on the same VPS:

```
├── app/              # App server → app.mv42.dev
│   ├── index.js      # Apps-only Express server (port 3000)
│   ├── package.json
│   └── lm/           # Spotify "Last Music" widget
│       └── server/
└── web/              # Web server → mv42.dev
    ├── index.js      # Static portfolio server (port 3001)
    ├── package.json
    └── public/       # Static files
        ├── index.html
        ├── portfolio.css
        ├── CV/       # CV project
        ├── FOV/      # FOV Calculator
        └── OptiTime/ # OptiTime project
```

**VPS Setup:**
- Both apps run on the same DigitalOcean VPS
- Reverse proxy (Nginx/Caddy) routes traffic:
  - `app.mv42.dev` → port 3000 (app server)
  - `mv42.dev` → port 3001 (web server)
- Process manager (PM2) keeps both servers running

## 🚀 Quick Start

### Development (Local)

```bash
# Run the app server (port 3000)
cd app
npm install
npm start

# Run the web server (port 3001 to avoid conflict)
cd web
npm install
PORT=3001 npm start
```

### Production (DigitalOcean VPS)

```bash
# Start both servers with PM2
cd app
pm2 start index.js --name mv42-apps

cd ../web
pm2 start index.js --name mv42-web -- --port 3001

# Save PM2 configuration
pm2 save
pm2 startup
```

**Reverse Proxy Example (Nginx):**
```nginx
server {
    server_name app.mv42.dev;
    location / {
        proxy_pass http://localhost:3000;
    }
}

server {
    server_name mv42.dev;
    location / {
        proxy_pass http://localhost:3001;
    }
}
```

## 📦 Requirements

- Node.js >= 18.0.0
- PM2 (process manager)
- Nginx or Caddy (reverse proxy)
- Environment variables (for app server):
  - `SPOTIFY_CLIENT_ID`
  - `SPOTIFY_CLIENT_SECRET`
  - `SPOTIFY_REDIRECT_URI`
  - `FIREBASE_SERVICE_ACCOUNT` (optional)

## 📄 License

MIT
