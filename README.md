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
| `site/api/contact.js` | Reçoit les messages du formulaire de contact (site et appli) et les envoie par e-mail |
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
Il est hébergé sur Vercel (https://3dinfinite.vercel.app/) : le projet Vercel est lié à ce dépôt, avec `site` comme
**Root Directory** (Settings → Build and Deployment), sans build.
Chaque push sur `main` redéploie le site automatiquement. Les boutons pointent toujours vers la dernière version officielle,
et la page affiche son numéro et ses nouveautés. Si tu prends un nom de domaine : remplacer cette adresse dans
`site/index.html`, `site/robots.txt`, `site/sitemap.xml`, `site/llms.txt` et `config.js`.

## Formulaire de contact

Le site (section « Contact ») et l'appli (bouton enveloppe en haut à droite, ou menu **Aide → Contacter l'auteur…**)
envoient leurs messages à `site/api/contact.js`, une fonction Vercel qui les transmet par e-mail avec
[Resend](https://resend.com). L'adresse de l'auteur n'est écrite nulle part dans le code : elle est lue dans les
variables d'environnement du projet Vercel (**Settings → Environments → Production**) :

| Variable | Rôle |
|---|---|
| `CONTACT_TO` | Adresse qui reçoit les messages |
| `RESEND_API_KEY` | Clé d'API Resend (compte gratuit, créé avec la même adresse que `CONTACT_TO`) |
| `CONTACT_FROM` | Facultatif : expéditeur affiché, une fois un nom de domaine vérifié chez Resend |

Après avoir ajouté ou modifié une variable, redéployer le site. Tant qu'elles manquent, le formulaire répond
« pas encore activé ». Limites : 3 pièces jointes, 3 Mo au total, 5 messages par 10 minutes et par adresse IP.
Sans nom de domaine vérifié, Resend n'accepte d'envoyer qu'à l'adresse du compte : c'est le cas voulu ici.

## Charte et logos

`brand/` contient les logos (icône, version horizontale claire et sombre, mot-symbole) et `brand/CHARTE.md` (couleurs, typographie, ton).
`npm run brand` régénère les logos et les images du site à partir de `build/icon.svg`.

## Premier lancement (installeurs non signés)

- **Windows** : SmartScreen affiche « Windows a protégé votre ordinateur » → *Informations complémentaires* → *Exécuter quand même*.
- **macOS** : l'appli n'est pas signée par Apple. Glisser 3DInfinite dans Applications, essayer de l'ouvrir, puis
  *Réglages Système → Confidentialité et sécurité → Ouvrir quand même*. Si macOS dit que l'app est « endommagée » :
  `xattr -cr /Applications/3DInfinite.app` dans le Terminal.

Un certificat de signature (Apple Developer 99 €/an, certificat Windows payant) supprimerait ces avertissements.
