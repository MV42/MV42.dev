require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Paths
const STATIC_DIR = path.join(__dirname, 'web/public');
const PORTAL_PAGE = path.join(STATIC_DIR, 'portal.html');
const WEB_GALLERY = path.join(STATIC_DIR, 'web-gallery.html');
const APP_GALLERY = path.join(STATIC_DIR, 'app-gallery.html');

// Import app modules
const groupLinkApp = require('./app/GroupLink/server/index.js');

// --- APPS MOUNTING ---

// 1. GroupLink (/GroupLink)
app.use('/GroupLink', groupLinkApp.router);

// 2. Host-based landing pages
app.get('/', (req, res) => {
    const host = (req.headers.host || '').toLowerCase();

    if (host.startsWith('web.')) {
        return res.sendFile(WEB_GALLERY);
    }

    if (host.startsWith('app.')) {
        return res.sendFile(APP_GALLERY);
    }

    return res.sendFile(PORTAL_PAGE);
});

// Static assets for all hosts
app.use(express.static(STATIC_DIR));

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(STATIC_DIR, '404.html'));
});

// --- STARTUP ---
(async () => {
    try {
        console.log("🚀 Starting MV42 unified VPS server...");

        // Initialize GroupLink storage
        await groupLinkApp.initStorage();
        groupLinkApp.startPollingLoop();
        console.log("✅ GroupLink loaded on /GroupLink");

        // Start Express server
        app.listen(PORT, () => {
            console.log(`\n🌍 MV42 Server running on port ${PORT}`);
            console.log(`👉 Portal: http://localhost:${PORT}/`);
            console.log(`👉 GroupLink: http://localhost:${PORT}/GroupLink/login`);
        });

    } catch (e) {
        console.error("❌ Fatal error on startup:", e);
        process.exit(1);
    }
})();
