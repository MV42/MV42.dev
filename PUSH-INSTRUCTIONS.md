# Instructions finales avant le push

## ⚠️ Actions requises sur le VPS AVANT de push

### 1. Recréer le certificat SSL avec mv42.dev comme nom principal

```bash
# Sur le VPS
sudo certbot delete --cert-name app.mv42.dev

# Recréer avec mv42.dev comme principal
sudo certbot certonly --nginx -d mv42.dev -d www.mv42.dev -d app.mv42.dev

# Vérifier
sudo certbot certificates
# Doit afficher: Certificate Name: mv42.dev
```

### 2. Donner les droits sudo à l'utilisateur pour Nginx (si ce n'est pas root)

Si vous utilisez un utilisateur autre que root :

```bash
# Ajouter les permissions NOPASSWD pour nginx
sudo visudo

# Ajouter cette ligne (remplacez 'votre_user' par votre username SSH) :
votre_user ALL=(ALL) NOPASSWD: /usr/bin/nginx, /usr/sbin/nginx, /bin/systemctl reload nginx, /bin/systemctl restart nginx, /usr/bin/cp, /usr/bin/ln, /usr/bin/sed
```

Si vous utilisez `root` (SSH_USERNAME=root), rien à faire.

## 📋 Ce qui a été modifié

### 1. `.github/workflows/deploy.yml`
- ✅ Automatise tout : git pull, npm install, nginx, PM2
- ✅ Configure nginx automatiquement
- ✅ Met à jour les chemins SSL vers mv42.dev
- ✅ Redémarre PM2 proprement

### 2. `nginx/mv42.conf`
- ✅ Chemins SSL mis à jour vers `/etc/letsencrypt/live/mv42.dev/`

### 3. `package.json`
- ✅ Déjà présent avec toutes les dépendances

## 🚀 Prêt à push

Une fois que vous avez :
1. ✅ Recrée le certificat SSL avec mv42.dev
2. ✅ Configuré les permissions sudo (si pas root)
3. ✅ Configuré les secrets GitHub (SSH_HOST, SSH_USERNAME, SSH_PRIVATE_KEY)

Alors vous pouvez :

```bash
git add .
git commit -m "feat: auto-deployment with nginx and PM2 setup"
git push origin main
```

Le workflow GitHub Actions va :
1. Se connecter au VPS
2. Pull le code
3. Installer les dépendances
4. Configurer Nginx
5. Démarrer PM2
6. Votre site sera en ligne ! 🎉

## 🔍 Vérification après push

Regardez les logs GitHub Actions :
- Allez sur `https://github.com/MV42/MV42.dev/actions`
- Cliquez sur le dernier workflow
- Vérifiez qu'il se termine en vert ✅

Puis testez :
- https://mv42.dev
- https://app.mv42.dev
