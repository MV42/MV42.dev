const express = require('express');
const path = require('path');
const spotifyServer = require('./lm/server/index.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir les fichiers statiques depuis le dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Monter le serveur Spotify sur /lm
app.use('/lm', spotifyServer.router);

// Démarrage du serveur
(async () => {
    try {
        // Initialisation du stockage Spotify (Async)
        await spotifyServer.initStorage();
        
        // Lancer la boucle de surveillance
        spotifyServer.startPollingLoop();

        app.listen(PORT, () => {
            console.log(`🚀 Serveur MV42.dev démarré sur le port ${PORT}`);
            console.log(`📁 Fichiers statiques servis depuis /public`);
        });
    } catch (e) {
        console.error("Erreur au démarrage:", e);
    }
})();
