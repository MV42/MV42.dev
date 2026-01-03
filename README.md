# MV42.dev

**Personal portfolio and web services platform** hosted on a DigitalOcean VPS.

---

## 🌐 Live Sites

### [mv42.dev](https://mv42.dev)
Portal homepage with links to Apps and Web spaces.

### [web.mv42.dev](https://web.mv42.dev)
Web projects gallery featuring:
- **Portfolio** — Main landing page
- **[CV](https://web.mv42.dev/CV/)** — Interactive curriculum vitae
- **[FOV Calculator](https://web.mv42.dev/FOV/)** — Field of View calculator for gaming/simulation
- **[OptiTime](https://web.mv42.dev/OptiTime/)** — Time optimization and scheduling tool

### [app.mv42.dev](https://app.mv42.dev)
Applications and services:
- **[Spotify Widget](https://app.mv42.dev/lm/login)** — Real-time music listening tracker
- More apps coming soon...

---

## 🏗️ Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: Vanilla HTML/CSS/JS (zero build)
- **Hosting**: DigitalOcean VPS ($4/month)
- **Proxy**: Nginx with SSL (Let's Encrypt)
- **Process Manager**: PM2
- **CI/CD**: GitHub Actions (auto-deploy on push)

---

## 🚀 Features

- **Host-based routing** — Portal serves different content based on subdomain
- **Static first** — No build process, fast and lightweight
- **Auto-deployment** — Push to `main` → instant deploy
- **SSL everywhere** — Single certificate for all domains
- **Modular architecture** — Easy to add new projects/services

---

## 📂 Repository Structure

```
MV42.dev/
├── index.js              # Unified Node.js server
├── package.json          # Dependencies
│
├── app/                  # Application modules
│   └── lm/               # Spotify "Last Music" widget
│
├── web/                  # Static web projects
│   └── public/
│       ├── portal.html          # Portal page
│       ├── web-gallery.html     # Web projects index
│       ├── app-gallery.html     # Apps index
│       ├── index.html           # Portfolio landing
│       ├── CV/                  # CV project
│       ├── FOV/                 # FOV Calculator
│       └── OptiTime/            # OptiTime tool
│
├── deploy/               # Deployment automation
│   ├── ecosystem.config.js      # PM2 configuration
│   ├── deploy.sh                # Deploy script
│   └── webhook.json             # Webhook config
│
├── nginx/                # Nginx reverse proxy config
│   └── mv42.conf
│
└── .github/workflows/    # GitHub Actions CI/CD
    └── deploy.yml
```

---

## 💻 For Developers

See **[DEV.md](./DEV.md)** for:
- VPS setup instructions
- Deployment guide
- GitHub Actions configuration
- Maintenance and troubleshooting

---

## 📄 License

MIT — Feel free to use this architecture for your own projects!

---

## 📬 Contact

**MV42** — [GitHub](https://github.com/MV42)
