const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const storage = require('node-persist');
const admin = require('firebase-admin');
const path = require('path');

// --- FIREBASE SETUP ---
try {
    // On cherche le fichier dans le dossier courant (lm/server)
    const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));
    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin initialisé !");
    }
} catch (e) {
    console.log("Attention: Firebase non configuré (serviceAccountKey.json manquant). Le Push ne marchera pas.");
}

const router = express.Router();

// CONFIGURATION
const CREDENTIALS = {
    clientId: 'TON_CLIENT_ID_ICI',
    clientSecret: 'TON_CLIENT_SECRET_ICI',
    redirectUri: 'https://mv42.dev/lm/callback'
};

// Stockage (Tokens + Historique)
// On initialise dans une fonction async car initSync n'existe plus dans les versions récentes
async function initStorage() {
    await storage.init({ dir: path.join(__dirname, 'persist') });
}

const spotifyApi = new SpotifyWebApi(CREDENTIALS);

// --- ROUTES ---

// 1. Route pour se connecter
router.get('/login', (req, res) => {
    const scopes = ['user-read-playback-state', 'user-read-currently-playing'];
    res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

// 2. Le retour de Spotify après connexion
router.get('/callback', async (req, res) => {
    const error = req.query.error;
    const code = req.query.code;

    if (error) return res.send(`Erreur: ${error}`);

    try {
        const data = await spotifyApi.authorizationCodeGrant(code);
        const accessToken = data.body['access_token'];
        const refreshToken = data.body['refresh_token'];

        // On récupère le profil pour savoir qui vient de se connecter
        spotifyApi.setAccessToken(accessToken);
        const me = await spotifyApi.getMe();
        const userId = me.body.id; // Ton ID Spotify ou le sien

        // On sauvegarde les tokens de cet utilisateur
        await storage.setItem(`user_${userId}`, {
            refreshToken,
            name: me.body.display_name,
            lastTrack: null
        });

        res.send(`Succès ! Utilisateur ${me.body.display_name} enregistré. Vous pouvez fermer.`);
    } catch (err) {
        res.send(`Erreur auth: ${err}`);
    }
});

// 3. API pour le Widget Android : Récupère ce que les deux écoutent
router.get('/api/status', async (req, res) => {
    const users = await storage.keys(); // Récupère les clés stockées
    const userKeys = users.filter(k => k.startsWith('user_'));
    
    let result = {};

    for (const key of userKeys) {
        const userData = await storage.getItem(key);
        // On crée une instance dédiée pour cet user
        const userApi = new SpotifyWebApi(CREDENTIALS);
        userApi.setRefreshToken(userData.refreshToken);

        try {
            // Refresh du token (obligatoire car ça expire vite)
            const data = await userApi.refreshAccessToken();
            userApi.setAccessToken(data.body['access_token']);

            // Qu'est-ce qu'il écoute ?
            const playback = await userApi.getMyCurrentPlayingTrack();
            
            if (playback.body && playback.body.item) {
                const track = playback.body.item;
                const trackData = {
                    name: track.name,
                    artist: track.artists[0].name,
                    image: track.album.images[0].url,
                    isPlaying: playback.body.is_playing,
                    progress_ms: playback.body.progress_ms,
                    duration_ms: track.duration_ms,
                    timestamp: Date.now()
                };

                result[userData.name] = trackData;

                // Gestion Historique (Simplifiée : on ajoute si différent du dernier)
                if (!userData.lastTrack || userData.lastTrack.name !== trackData.name) {
                    let history = (await storage.getItem(`history_${key}`)) || [];
                    history.unshift(trackData); // Ajoute au début
                    if (history.length > 50) history.pop(); // Garde les 50 derniers
                    await storage.setItem(`history_${key}`, history);
                    
                    userData.lastTrack = trackData;
                    await storage.setItem(key, userData);
                }
            } else {
                result[userData.name] = { isPlaying: false, ...userData.lastTrack }; // On renvoie le dernier connu
            }
        } catch (err) {
            console.error(`Erreur pour ${userData.name}:`, err);
        }
    }
    res.json(result);
});

// 4. API pour l'Historique (App)
router.get('/api/history', async (req, res) => {
    // Récupère tout l'historique
    const keys = await storage.keys();
    const historyKeys = keys.filter(k => k.startsWith('history_'));
    let combinedHistory = [];
    
    for (const key of historyKeys) {
         const list = await storage.getItem(key);
         // On peut ajouter le nom de l'user si besoin
         combinedHistory = combinedHistory.concat(list);
    }
    
    // Tri par date
    combinedHistory.sort((a, b) => b.timestamp - a.timestamp);
    res.json(combinedHistory);
});

module.exports = {
    router,
    startPollingLoop,
    initStorage
};

// --- BOUCLE DE SURVEILLANCE (POLLING) ---
// C'est le serveur qui travaille, pas le téléphone !
async function startPollingLoop() {
    console.log("Démarrage de la surveillance Spotify...");
    setInterval(async () => {
        try {
            const users = await storage.keys();
            const userKeys = users.filter(k => k.startsWith('user_'));
            let hasChanged = false;

            for (const key of userKeys) {
                const userData = await storage.getItem(key);
                const userApi = new SpotifyWebApi(CREDENTIALS);
                userApi.setRefreshToken(userData.refreshToken);

                try {
                    const data = await userApi.refreshAccessToken();
                    userApi.setAccessToken(data.body['access_token']);

                    const playback = await userApi.getMyCurrentPlayingTrack();
                    
                    if (playback.body && playback.body.item) {
                        const track = playback.body.item;
                        const currentTrackName = track.name;
                        
                        // Si la musique a changé par rapport à la dernière fois
                        if (!userData.lastTrack || userData.lastTrack.name !== currentTrackName) {
                            console.log(`Changement détecté pour ${userData.name}: ${currentTrackName}`);
                            hasChanged = true;
                            
                            // Mise à jour du stockage
                            const trackData = {
                                name: track.name,
                                artist: track.artists[0].name,
                                image: track.album.images[0].url,
                                isPlaying: playback.body.is_playing,
                                timestamp: Date.now()
                            };
                            
                            // Historique
                            let history = (await storage.getItem(`history_${key}`)) || [];
                            history.unshift(trackData);
                            if (history.length > 50) history.pop();
                            await storage.setItem(`history_${key}`, history);

                            userData.lastTrack = trackData;
                            await storage.setItem(key, userData);
                        }
                    }
                } catch (err) {
                    // Ignorer les erreurs de token temporaires
                }
            }

            // Si au moins une personne a changé de musique, on envoie un PUSH à tout le monde
            if (hasChanged) {
                sendPushNotification();
            }

        } catch (e) {
            console.error("Erreur polling:", e);
        }
    }, 5000); // Vérifie toutes les 5 secondes
}

function sendPushNotification() {
    if (!admin.apps.length) return;

    const message = {
        topic: 'couple_updates', // Tout le monde abonné à ce sujet recevra le ping
        data: {
            type: 'REFRESH' // Juste un signal pour dire "Mets-toi à jour"
        }
    };

    admin.messaging().send(message)
        .then((response) => {
            console.log('Push envoyé avec succès:', response);
        })
        .catch((error) => {
            console.log('Erreur envoi Push:', error);
        });
}
