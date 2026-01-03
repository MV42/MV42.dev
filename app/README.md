# App Modules

Application modules mounted on the main server.

## Spotify Widget (`/lm`)

Real-time music listening tracker using Spotify API.

### Features

- OAuth2 authentication flow
- Multi-user token management
- Firebase push notifications (optional)
- Persistent storage with node-persist

### API Endpoints

- `GET /lm/login` - Start OAuth flow
- `GET /lm/callback` - OAuth callback
- `GET /lm/api/status` - Current listening status

### Configuration

Requires environment variables in root `.env`:

```env
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REDIRECT_URI=https://app.mv42.dev/lm/callback
FIREBASE_SERVICE_ACCOUNT={...}
```

### Storage

- Tokens stored in `lm/server/persist/` (gitignored)
- Firebase credentials in `lm/server/serviceAccountKey.json` (gitignored)

## Future Modules

- ChatCast
- Discord bot integration
- Other web services

All modules are mounted on the main unified server in `/index.js`.
