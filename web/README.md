# MV42 Portfolio Website

Static portfolio and project showcase hosted at mv42.dev

## 🎯 Purpose

Main portfolio website serving static HTML/CSS/JS content, including:
- Personal portfolio landing page
- Interactive CV
- FOV Calculator for gaming
- OptiTime scheduling tool

## 🏗️ Structure

```
├── index.js          # Express static file server
├── package.json      # Minimal dependencies
└── public/           # Static assets
    ├── index.html    # Portfolio landing page
    ├── portfolio.css
    ├── auto-fit-text.css
    ├── auto-fit-text.js
    ├── 404.html
    ├── CV/           # Interactive CV project
    │   └── index.html
    ├── FOV/          # Field of View calculator
    │   └── index.html
    └── OptiTime/     # Time optimization tool
        ├── index.html
        ├── script.js
        └── style.css
```

## 🚀 Running Locally

```bash
npm install
npm start
```

Server starts on `http://localhost:3000`

## 🔧 Features

- Simple Express static file server
- Custom 404 error page
- Zero configuration needed
- Lightweight and fast

## 🌐 Deployment

Runs on the same DigitalOcean VPS as the app server:

```bash
cd web
npm install
PORT=3001 pm2 start index.js --name mv42-web
```

**Nginx config** routes `mv42.dev` → `localhost:3001`

## 📦 Dependencies

- `express` - Static file serving

Minimal dependencies for maximum performance.

## 📄 License

MIT