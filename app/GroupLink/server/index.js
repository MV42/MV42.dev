const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const storage = require('node-persist');
const admin = require('firebase-admin');
const path = require('path');

// --- FIREBASE SETUP ---
let serviceAccount;
try {
    // 1. Essai via Variable d'environnement (Recommandé pour Infomaniak)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log("Configuration Firebase chargée depuis la variable d'environnement.");
    } 
    // 2. Essai via fichier local
    else {
        serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));
        console.log("Configuration Firebase chargée depuis le fichier JSON.");
    }

    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin initialisé !");
    }
} catch (e) {
    console.log("Attention: Firebase non configuré. Le Push ne marchera pas. Erreur:", e.message);
}

const router = express.Router();

// CONFIGURATION
const CREDENTIALS = {
    clientId: process.env.SPOTIFY_CLIENT_ID || 'TON_CLIENT_ID_ICI',
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || 'TON_CLIENT_SECRET_ICI',
    redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'https://app.mv42.dev/GroupLink/callback'
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
        const avatar = me.body.images && me.body.images.length > 0 ? me.body.images[0].url : null;

        // On sauvegarde les tokens de cet utilisateur
        await storage.setItem(`user_${userId}`, {
            refreshToken,
            name: me.body.display_name,
            avatar,
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

            // Si l'avatar n'existe pas, on le récupère maintenant
            if (!userData.avatar) {
                try {
                    const me = await userApi.getMe();
                    if (me.body.images && me.body.images.length > 0) {
                        userData.avatar = me.body.images[0].url;
                        await storage.setItem(key, userData);
                        console.log(`Avatar récupéré pour ${userData.name}`);
                    }
                } catch (e) { /* ignore */ }
            }

            // Qu'est-ce qu'il écoute ?
            const playback = await userApi.getMyCurrentPlayingTrack();
            
            if (playback.body && playback.body.item) {
                const track = playback.body.item;
                const trackData = {
                    name: track.name,
                    artist: track.artists[0].name,
                    image: track.album.images[0].url,
                    isPlaying: playback.body.is_playing,
                    uri: track.uri, // spotify:track:xxx pour ouvrir dans Spotify
                    progress_ms: playback.body.progress_ms,
                    duration_ms: track.duration_ms,
                    timestamp: Date.now(),
                    user: userData.name, // Ajouter le nom de l'utilisateur
                    userImage: userData.avatar || null
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
                result[userData.name] = { isPlaying: false, userImage: userData.avatar || null, ...userData.lastTrack }; // On renvoie le dernier connu
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
         // Ajouter le nom de l'utilisateur si pas déjà présent
         const userKey = key.replace('history_', '');
         const userData = await storage.getItem(userKey);
         const userName = userData?.name || 'Inconnu';
         
         const listWithUser = list.map(item => ({
             ...item,
             user: item.user || userName
         }));
         combinedHistory = combinedHistory.concat(listWithUser);
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
