require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Import app modules
const spotifyApp = require('./app/lm/server/index.js');

// --- APPS MOUNTING ---

// 1. Spotify Widget (/lm) - mounted on app.mv42.dev subdomain
app.use('/lm', spotifyApp.router);

// 2. Static Web Portfolio - mounted on mv42.dev main domain
app.use(express.static(path.join(__dirname, 'web/public')));

// Route principale - portfolio homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web/public', 'index.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'web/public', '404.html'));
});

// --- STARTUP ---
(async () => {
    try {
        console.log("🚀 Starting MV42 unified VPS server...");

        // Initialize Spotify storage
        await spotifyApp.initStorage();
        spotifyApp.startPollingLoop();
        console.log("✅ Spotify Widget loaded on /lm");

        // Start Express server
        app.listen(PORT, () => {
            console.log(`\n🌍 MV42 Server running on port ${PORT}`);
            console.log(`👉 Portfolio: http://localhost:${PORT}/`);
            console.log(`👉 Spotify: http://localhost:${PORT}/lm/login`);
        });

    } catch (e) {
        console.error("❌ Fatal error on startup:", e);
        process.exit(1);
    }
})();
