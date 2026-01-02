require('dotenv').config();
const express = require('express');
const path = require('path');

// Import des modules (Apps)
const spotifyServer = require('./lm/server/index.js');

const app = express();
const PORT = process.env.PORT || 3000;

// --- MONTAGE DES APPS ---

// 1. Spotify Widget (/lm)
app.use('/lm', spotifyServer.router);

// 2. (Futur) ChatCast
// const chatCastServer = require('./chatcast/server.js');
// app.use('/chatcast', chatCastServer);


// --- DÉMARRAGE ---
(async () => {
    try {
        console.log("🚀 Démarrage du serveur VPS (Apps Only)...");

        // Initialisation Spotify
        await spotifyServer.initStorage();
        spotifyServer.startPollingLoop();
        console.log("✅ Spotify Widget chargé sur /lm");

        // Démarrage Express
        app.listen(PORT, () => {
            console.log(`\n🌍 Serveur Apps en ligne sur le port ${PORT}`);
            console.log(`👉 Spotify: http://localhost:${PORT}/lm/login`);
        });

    } catch (e) {
        console.error("❌ Erreur fatale au démarrage:", e);
        process.exit(1);
    }
})();
