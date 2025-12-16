const express = require('express');
const path = require('path');
const spotifyServer = require('./lm/server/index.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir les fichiers statiques depuis le dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Monter le serveur Spotify sur /lm
app.use('/lm', spotifyServer.router);

// Démarrer le polling Spotify
spotifyServer.startPollingLoop();

// Route principale - sert index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur MV42.dev démarré sur le port ${PORT}`);
    console.log(`📁 Fichiers statiques servis depuis /public`);
});
