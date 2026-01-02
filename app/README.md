# MV42 Apps Server

Backend applications and services for app.mv42.dev

## 🎯 Purpose

This server hosts various applications and APIs that complement the main portfolio:
- **Spotify Widget** (`/lm`) - "Last Music" real-time listening tracker
- **Future Apps** - ChatCast, Discord bot integration, etc.

## 🏗️ Structure

```
├── index.js          # Main Express server
├── package.json      # Dependencies
└── lm/               # Spotify "Last Music" widget
    └── server/
        ├── index.js  # Spotify API integration
        └── persist/  # Token storage (node-persist)
```

## 🚀 Running Locally

```bash
npm install
npm start           # Production mode
npm run dev         # Development with hot reload
```

Server starts on `http://localhost:3000`

## 🔑 Environment Variables

Create a `.env` file:

```env
PORT=3000
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=https://app.mv42.dev/lm/callback
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

## 📡 API Endpoints

### Spotify Widget (`/lm`)

- **GET `/lm/login`** - OAuth login flow
- **GET `/lm/callback`** - OAuth callback handler
- **GET `/lm/api/status`** - Current listening status for all users

## 🔧 Dependencies

- `express` - Web framework
- `spotify-web-api-node` - Spotify API wrapper
- `node-persist` - Local storage for tokens
- `firebase-admin` - Push notifications (optional)
- `dotenv` - Environment configuration

## 🌐 Deployment

Runs on the same DigitalOcean VPS as the web server:

```bash
cd app
npm install
pm2 start index.js --name mv42-apps
```

**Nginx config** routes `app.mv42.dev` → `localhost:3000`

## 📄 License

MIT
