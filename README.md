# 3DInfinite

Modélisation 3D simple pour l'impression 3D (primitives, trous, groupes, arrondis, texte, SVG, import/export STL et 3MF).
Appli de bureau (Windows / macOS) construite avec Electron. Les projets sont des fichiers **`.3di`**.

## Développer

```bash
npm install
npm start          # assemble l'appli (app/) puis la lance
```

Ouvrir le dossier dans n'importe quel éditeur (Antigravity, VS Code…). Le code de l'interface est dans **`src/app.html`**
(un seul fichier) et **`src/geom.js`** (géométrie des arrondis). Après une modification : `npm start`.

| Fichier | Rôle |
|---|---|
| `src/app.html`, `src/geom.js` | L'application (interface, outils 3D, import/export) |
| `main.js` | Fenêtre, menus, ouvrir/enregistrer `.3di`, vérification de mise à jour |
| `preload.js` | Pont sécurisé entre la page et `main.js` |
| `config.js` | Dépôt GitHub des mises à jour, adresse de la page de téléchargement |
| `tools/build-app.mjs` | Assemble `src/` + bibliothèques locales dans `app/` (fonctionne hors ligne) |
| `build/icon.svg` | Icône (le PNG est généré) |
| `.github/workflows/release.yml` | Publie une version officielle (lancé à la main) |
| `vercel.json` | Configuration Vercel du site (dossier `site/`) |
| `CHANGELOG.md` | Notes de chaque version |
| `site/`, `brand/` | Site internet, logos et charte |

## Publier une version officielle

Pousser du code ne publie rien. Une version sort seulement quand tu le décides :

1. Dans `package.json`, augmenter `"version"` (ex. `1.1.0` → `1.2.0`).
2. Dans `CHANGELOG.md`, ajouter une section `## 1.2.0` avec la liste des nouveautés (ce texte sera la note de version).
3. Commit et push sur `main`.
4. Sur GitHub : onglet **Actions** → **Publier une version officielle** → **Run workflow**.

Environ 10 minutes plus tard, la release `v1.2.0` existe avec ses notes et trois fichiers prêts à l'emploi :
`3DInfinite-Setup.exe` (Windows), `3DInfinite-mac-arm64.dmg` (Mac Apple Silicon), `3DInfinite-mac-x64.dmg` (Mac Intel).
Le workflow refuse de tourner si la version est déjà publiée ou si ses notes manquent dans `CHANGELOG.md`.

## Ce que voient les utilisateurs

Au lancement, l'appli lit la dernière release. Si elle est plus récente, une fenêtre affiche
« Mise à jour disponible : 3DInfinite X.Y.Z », les nouveautés, et un bouton **Télécharger** :
sous Windows il télécharge directement l'installeur, sous macOS il ouvre la page de téléchargement du site
(réglable dans `config.js`, `updateTarget`). Menu **Aide → Rechercher des mises à jour…** pour le faire à la main.
Le dépôt doit rester **public** pour que l'appli et le site puissent lire les releases.

## Site internet

Le dossier `site/` est une page statique (présentation, captures, téléchargement, FAQ, données structurées, `llms.txt`).
Il est hébergé sur Vercel : le projet Vercel est lié à ce dépôt, avec `vercel.json` (sortie `site/`, aucun build).
Chaque push sur `main` redéploie le site automatiquement. Les boutons pointent toujours vers la dernière version officielle,
et la page affiche son numéro et ses nouveautés. Si tu prends un nom de domaine : remplacer cette adresse dans
`site/index.html`, `site/robots.txt`, `site/sitemap.xml`, `site/llms.txt` et `config.js`.

## Charte et logos

`brand/` contient les logos (icône, version horizontale claire et sombre, mot-symbole) et `brand/CHARTE.md` (couleurs, typographie, ton).
`npm run brand` régénère les logos et les images du site à partir de `build/icon.svg`.

## Premier lancement (installeurs non signés)

- **Windows** : SmartScreen affiche « Windows a protégé votre ordinateur » → *Informations complémentaires* → *Exécuter quand même*.
- **macOS** : l'appli n'est pas signée par Apple. Glisser 3DInfinite dans Applications, essayer de l'ouvrir, puis
  *Réglages Système → Confidentialité et sécurité → Ouvrir quand même*. Si macOS dit que l'app est « endommagée » :
  `xattr -cr /Applications/3DInfinite.app` dans le Terminal.

Un certificat de signature (Apple Developer 99 €/an, certificat Windows payant) supprimerait ces avertissements.
