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
| `.github/workflows/release.yml` | Fabrique les installeurs à chaque nouvelle version |

## Publier une nouvelle version

```bash
npm version patch          # 1.0.0 -> 1.0.1 (ou minor / major) : change package.json, commit et tag v1.0.1
git push --follow-tags
```

GitHub Actions fabrique alors `3DInfinite-Setup-X.Y.Z.exe` (Windows) et `3DInfinite-X.Y.Z-arm64.dmg` / `-x64.dmg` (macOS),
puis les ajoute à la page **Releases** (environ 10 minutes). Le tag doit correspondre à la version de `package.json`.

## Mises à jour côté utilisateur

Au lancement, l'appli lit la dernière release publiée sur GitHub. Si elle est plus récente, elle affiche
« Mise à jour disponible : 3DInfinite X.Y.Z — Télécharger ? ». Le bouton ouvre le téléchargement de l'installeur
(Windows : `.exe`, Mac : le `.dmg` qui correspond au processeur). Menu **Aide → Rechercher des mises à jour…** pour le faire à la main.

Quand le site officiel existera : renseigner son adresse dans `config.js` (`downloadPage`), le bouton « Télécharger » y renverra.
Le dépôt doit rester **public** pour que l'appli puisse lire les releases sans clé.

## Premier lancement (installeurs non signés)

- **Windows** : SmartScreen affiche « Windows a protégé votre ordinateur » → *Informations complémentaires* → *Exécuter quand même*.
- **macOS** : l'appli n'est pas signée par Apple. Glisser 3DInfinite dans Applications, essayer de l'ouvrir, puis
  *Réglages Système → Confidentialité et sécurité → Ouvrir quand même*. Si macOS dit que l'app est « endommagée » :
  `xattr -cr /Applications/3DInfinite.app` dans le Terminal.

Un certificat de signature (Apple Developer 99 €/an, certificat Windows payant) supprimerait ces avertissements.
