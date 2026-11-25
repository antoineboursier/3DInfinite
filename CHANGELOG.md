# Notes de version

Chaque version officielle a sa section `## X.Y.Z`. Ce texte devient la note de la release GitHub
et s'affiche dans la fenêtre « Mise à jour disponible » de l'appli. Reste court : une liste de ce qui change pour l'utilisateur.

## 1.7.0

- Export 3MF et fusions multicolores nettoyés : les contours des dessins SVG sont simplifiés et allégés (environ deux fois moins de triangles), les débris et filaments minuscules disparaissent, et plus aucune arête de moins de 5 µm ne vient perturber le logiciel de découpe
- Export 3MF : sommets soudés à 0,0001 mm et triangles écrasés retirés
- Import de plusieurs SVG à la fois, et export de chaque pièce à part en STL ou 3MF (.zip)
- Grille : arrondi extérieur et arrondi intérieur des cases
- Interface : icônes pour les arrondis, couleurs des axes X, Y, Z sur les champs, séparateurs dans le panneau de l'objet, cotes plus discrètes
- Alignement : clic sur un point autour de la sélection, directement sur le plateau

## 1.6.1

- Mise à jour sur place : vérification de la version suivante (version de test de la mise à jour, sans changement d'usage)

## 1.6.0

- Mise à jour sur place sous Windows : le bouton « Mettre à jour » ne télécharge que les parties modifiées, puis « Redémarrer et installer » relance l'appli à la place de l'ancienne
- Une barre de progression suit le téléchargement ; l'installation se fait aussi à la fermeture si on ne redémarre pas tout de suite
- Si la mise à jour sur place échoue, le téléchargement s'ouvre dans le navigateur, comme avant

## 1.5.0

- Page d'accueil au lancement : projets récents (avec la date, et une croix pour les retirer), boutons Nouveau projet et Ouvrir, lien vers le site et contact
- Mise à jour : un bloc sur l'accueil et une pastille dans la barre, au lieu d'une boîte de dialogue à chaque démarrage
- Une seule colonne à droite : onglets Formes et Objet ; les actions de sélection (grouper, fusionner, aligner, miroir, répéter, poser) sont dans le panneau de l'objet
- Symétrie : cliquer sur une copie sélectionne l'objet d'origine ; les parts sont plus lisibles et un repère indique le mode en bas de la scène
- Maintenir Alt (Option sur Mac) pour agrandir depuis le centre, et Alt ou Cmd en glissant une forme pour la dupliquer
- Arrondis lisses jusqu'à 100 % (plus d'escaliers) ; arrondi haut, arrondi bas et arrondi côté ; choix arrondi ou chanfrein par icônes
- Creux : le fond est désactivé par défaut
- Cotes : largeur × profondeur affichées sur la forme sélectionnée, hauteur pendant le levage, et ombre portée sur le plateau pour une pièce surélevée
- Grille fine au millimètre quand l'unité est le millimètre
- Poignées plus petites ; flèches de rotation fines, colorées par axe (X rouge, Y vert, Z bleu) et estompées au repos
- Notifications plus discrètes ; drapeaux pour le choix de langue ; espace entre Importer et Exporter

## 1.4.0

- Nouvelle forme « Grille » : barres droites ou inclinées (angle au choix), en un ou deux sens, avec épaisseur des barres, espacement et cadre réglables
- Arrondis d'arête haute et basse sur les barres, comme pour les autres formes
- Étirer une grille ajoute ou retire des cases : les barres gardent leur épaisseur

## 1.3.0

- Contacter l'auteur : le bouton enveloppe, en haut à droite, ouvre un formulaire pour envoyer une question, une idée ou un bug
- Pièces jointes : le projet en cours en une case à cocher, ou des fichiers (capture d'écran, STL, 3MF, SVG)
- Aussi disponible dans le menu Aide et sur le site

## 1.2.0

- Arrondis en pourcentage, plafonnés pour ne pas déformer la pièce ; bascule % / mm, ou saisie directe « 30% » ou « 2mm »
- « Creuser » en pourcentage (ou épaisseur de paroi en mm), avec une case « Fond »
- Mode symétrie ×2, ×4, ×8 : le plateau est partagé en parts, ce qu'on pose dans l'une se répète en miroir dans les autres, en direct
- Répétition avec jauges et aperçu ; en cercle : diamètre, écartement et nombre liés
- Rotation : crans de 15° quand le curseur est dans l'anneau, degré par degré en dehors
- Redimensionnement à la souris calé sur le pas de la grille
- Poignées avec contour, flèches de rotation affinées, panneau allégé (pictos Taille / Position / Rotation)
- Triangle posé à plat
- Visserie, piles et aimants : le modèle, la taille et le jeu se règlent dans le panneau de la pièce posée

## 1.1.0

- Nouvelles formes : triangle, toit arrondi, polygone (nombre de côtés), étoile (branches, creux, arrondis), bulle de dialogue, engrenage (dents, module, alésage, jeu), MetaFillet
- Moulures pour cadres : quart-de-rond, demi-rond, doucine, cadre, chambranle, corniche
- Piles et aimants : logements aux cotes standard (AA, AAA, 18650, CR2032, 9V… aimants Ø3 à Ø20 et blocs), avec jeu réglable
- Couleur de la grille personnalisable (bouton Plateau)
- La fenêtre de mise à jour affiche les nouveautés

## 1.0.0

- Première version de bureau : projets en fichiers `.3di`, Ouvrir / Enregistrer / Enregistrer sous
- Formes pleines et vides, groupes, fusion, alignement, arrondis, texte, SVG
- Import STL, export STL et 3MF
