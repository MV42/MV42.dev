# MV42.dev

Portfolio personnel + services Node.js hébergé sur Infomaniak.

## 🚀 Structure du projet

```
├── index.js          # Serveur Express
├── package.json      # Dépendances Node.js
├── public/           # Fichiers statiques
│   ├── index.html    # Page d'accueil portfolio
│   ├── portfolio.css
│   ├── auto-fit-text.css
│   ├── auto-fit-text.js
│   ├── 404.html
│   ├── CV/           # Projet CV
│   ├── FOV/          # FOV Calculator
│   └── OptiTime/     # OptiTime
└── README.md
```

## 📦 Installation locale

```bash
npm install
npm start
```

Le serveur démarre sur `http://localhost:3000`

## 🔧 Déploiement Infomaniak

Le déploiement est automatique via GitHub :
- **Build** : `npm install`
- **Start** : `npm start`
- **Port** : `3000`

## 📋 TODO

- [ ] Copier les vrais fichiers statiques depuis le serveur Infomaniak
- [ ] Intégrer le bot Discord
- [ ] Ajouter l'API/widget Spotify

## 📄 License

MIT
