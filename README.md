# Le laboratoire des neurones

Le slider « Batch size » permet toutes les tailles entières de 1 à `all (N)`. Les lots parcourent les points mélangés sans répétition avant le passage suivant. Les anneaux bleus identifient le dernier lot ; les indicateurs mesurent le jeu complet. Changer la taille met en pause et conserve les poids.

`npm run test:batch` vérifie le slider, les tailles intermédiaires, les anneaux et la disposition compacte. Le serveur Vite doit être lancé.

Application pédagogique locale en français : Vite, TypeScript, React et Tailwind CSS.

## Démarrage

```sh
npm install
npm run dev
```

Ouvrir l’adresse affichée par Vite (par défaut http://127.0.0.1:5173).

```sh
npm test
npm run build
```

Le dossier `dist` contient l’application compilée. Les points sont conservés dans le stockage local du navigateur ; aucun serveur applicatif n’est utilisé.

Le moteur mathématique (`src/network.ts`) est indépendant de React. Le reducer (`src/state.ts`) coordonne les transitions. Les visualisations Canvas/SVG sont dans `src/visuals.tsx` et la persistance versionnée dans `src/storage.ts`.

Voir `spécification.md` pour le périmètre et les choix pédagogiques.

## Vérification dans un navigateur

Le serveur doit être lancé avec `npm run dev`, puis :

```sh
npm run test:e2e
```

Le scénario utilise Edge installé, sans fenêtre. Pour utiliser Chrome, définir `BROWSER_CHANNEL=chrome`. Il vérifie l’apprentissage, les architectures, les cartes cachées, l’ajout/suppression, l’inspection, la persistance, le XOR et l’absence de débordement sur mobile. Des captures locales `preview-mlp.png` et `preview-mobile.png` sont produites.

La vitesse maximale est de 600 pas par seconde ; plusieurs mises à jour mathématiques peuvent être regroupées entre deux rafraîchissements visuels. « Un pas » effectue toujours exactement une mise à jour.

## Interface compacte

L’interface utilise la hauteur disponible du navigateur. Sur ordinateur, quatre colonnes affichent la configuration, le réseau, le plan et l’entraînement, sans défilement de la page. La colonne d’entraînement empile les deux sliders, les commandes, les indicateurs et la courbe d’erreur. Le plan garde la même échelle sur les deux axes. Sur écran étroit, les onglets « Données et architecture », « Plan et entraînement » et « Réseau et calculs » donnent accès aux mêmes fonctions. Les calculs détaillés s’ouvrent dans un volet indépendant.

`npm run test:layout` vérifie l’absence de débordement sur plusieurs tailles, la visibilité des commandes et le cas de huit neurones cachés. Le serveur Vite doit être lancé.


### Configuration et compteurs d’entraînement

La colonne présente les réglages (Vitesse, Batch size et Learning rate), puis les boutons, puis les observations. Le learning rate est directement visible, vaut 0,5 initialement et règle l’amplitude des ajustements indépendamment de la vitesse.

Les indicateurs distinguent mises à jour des poids, époques terminées, échantillons traités cumulés (répétitions comprises), progression du passage courant, pourcentage bien classé et erreur moyenne. Chaque valeur possède une infobulle explicative au survol et au focus clavier. Une époque est terminée uniquement après utilisation de tous les points ; changer le batch size conserve la progression. Avec 48 points et une taille de 20, les lots 20, 20 et 8 représentent trois mises à jour, une époque et 48 échantillons traités. Les compteurs repartent de zéro lors d’une modification des données, d’architecture, ou d’une réinitialisation.

`npm run test:progress` vérifie ces comportements dans le navigateur, avec le serveur Vite démarré.


### Annotations optionnelles

Les cases à cocher de légende « Erreurs de classification » et « Dernier lot » activent indépendamment les anneaux orange et bleus. Les deux sont désactivées au chargement. Leurs choix restent conservés pendant la session, y compris pendant les entraînements et les réinitialisations.

`npm run test:annotations` vérifie ces interactions avec le serveur Vite démarré.


### Légende alignée et visibilité des couches

Les repères fixes Cible 0 et Cible 1 sont placés côte à côte au-dessus du graphique, sans interaction. Sous le graphique, quatre cases à cocher natives sont alignées en deux colonnes sur deux lignes : Erreurs de classification et Dernier lot à gauche ; Frontière à 0,5 (Activation à 0,5 pour un neurone caché) et Gradient 0 → 1, accompagné de son aperçu coloré, à droite. Chaque case précède son libellé aligné à gauche ; la case et son libellé sont cliquables. Les options basculent indépendamment leur couche et conservent leurs états pendant la session. Initialement, frontière et gradient sont visibles, erreurs et dernier lot masqués. Un espacement supérieur de 16 px (12 px sur écran étroit) sépare les options du graphique et des axes, avec 8 px en dessous. L’ensemble reste sans défilement de page.


### Conservation du dessin lors des changements de réseau

Changer d’étape du parcours modifie seulement l’architecture et les explications, en conservant exactement les points actuels. Les boutons Un neurone, MLP, + et −, la réinitialisation de l’entraînement et le chargement des poids préparés du XOR conservent également les points. Seules les actions explicites de chargement de données remplacent le dessin : les jeux prédéfinis et « Charger l’exemple », qui charge les points et l’architecture conseillés pour l’étape active. « Vider le plan » reste une suppression explicite. Le parcours affiche l’exemple conseillé et rappelle que son chargement remplace le dessin.

`npm run test:drawing` vérifie la conservation exacte des coordonnées, classes et identifiants dans le navigateur et le stockage local, ainsi que le rechargement de la page. Aucun historique Annuler/Rétablir ni sauvegarde multiversion n’est ajouté à ce stade.


### Menu de dessins prédéfinis

Un select natif « Dessins prédéfinis » remplace les boutons Deux groupes, XOR et Cercles. La sélection charge immédiatement les points du modèle choisi, sans validation supplémentaire et en conservant l’architecture active. Le texte sous le menu précise que ce choix remplace les points actuels. Le chargement met en pause et réinitialise l’entraînement. Après édition manuelle, effacement ou restauration d’un plan depuis le stockage local, le menu indique « Plan actuel ».

## Déploiement GitHub Pages

Site : https://jlg-formation.github.io/neurones/

Chaque push sur `master` lance les tests, compile le projet et publie `dist` via GitHub Actions. Le chemin de base Vite est `/neurones/` (également en développement local).
