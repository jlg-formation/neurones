# Spécification — Le laboratoire des neurones

## 1. Statut et objectif

Ce document décrit une application pédagogique interactive permettant de comprendre comment un neurone artificiel puis un petit réseau de neurones apprennent à classer des points dans un plan. Il constitue la spécification de la première version ; sa rédaction ne déclenche pas l’implémentation.

L’application associe un parcours guidé, des exemples prédéfinis et la possibilité de modifier les échantillons. L’utilisateur observe l’apprentissage pas à pas, les limites d’une séparation linéaire et l’apport d’une couche cachée.

L’interface est en français. Les maquettes produites pendant la conception donnent une direction visuelle : interface claire, accents indigo, plan central dominant, panneaux latéraux et commandes d’entraînement en bas. Leurs valeurs numériques sont illustratives.

## 2. Décisions validées

- Stack : Vite, TypeScript, React et Tailwind CSS.
- Deux modes d’architecture : « Un neurone » et « MLP ».
- Un MLP possède une couche cachée et un neurone de sortie.
- Le premier passage en mode MLP commence avec un seul neurone caché.
- Des boutons − et + modifient le nombre de neurones cachés.
- Un changement d’architecture réinitialise l’entraînement et conserve les points.
- Un pas d’entraînement utilise un lot configurable ; un slider règle toutes les tailles entières de 1 à all.
- Un clic sur un neurone caché permet d’inspecter sa carte d’activation.
- Un panneau dépliable « Voir les calculs » expose les détails mathématiques.
- Les points sont sauvegardés dans le localStorage.
- Une action permet de restaurer un exemple initial.

Les choix complémentaires précisés ci-dessous constituent les valeurs proposées pour la première version et pourront être ajustés pendant la conception.

## 3. Modèle pédagogique

Chaque échantillon possède deux entrées réelles, x₁ et x₂, et une cible binaire.

| Représentation | Signification |
| --- | --- |
| Position du point | Valeurs x₁ et x₂ |
| Point noir | Cible 0 |
| Point blanc à contour sombre | Cible 1 |
| Fond du plan | Sortie prédite par le réseau |
| Frontière de décision | Positions où la sortie du réseau vaut 0,5 |

La sortie sigmoïde est comprise entre 0 et 1. La classe prédite vaut 1 à partir de 0,5, et 0 en dessous. Le fond représente une prédiction, sans présenter cette valeur comme une certitude statistiquement calibrée.

Un neurone seul produit une séparation linéaire. Ajouter un seul neurone caché avec des activations monotones ne suffit pas à obtenir une frontière courbe. La combinaison de plusieurs neurones cachés permet des frontières plus riches ; leur forme dépend des données et des paramètres appris.

Toutes les visualisations proviennent du réseau réellement calculé. Aucune courbe prédéfinie ne remplace une frontière apprise.

## 4. Organisation de l’écran

| Zone | Contenu |
| --- | --- |
| Première colonne, étroite | Parcours guidé, jeux de données et architecture |
| Deuxième colonne | Schéma du réseau, explication contextuelle et accès aux calculs |
| Troisième colonne | Plan interactif, outils de modification des points et légende |
| Quatrième colonne, étroite | Commandes d’entraînement, sliders, indicateurs et historique d’erreur |

Le graphique conserve la priorité visuelle. L’interface est compacte, sans cartes arrondies ni grands espacements décoratifs. Sur ordinateur, elle occupe la hauteur disponible du navigateur et affiche quatre colonnes sans défilement de la page. Les colonnes aux deux extrémités accueillent la configuration à gauche et l’entraînement à droite ; l’espace principal central est partagé entre le réseau puis le plan. Les sliders Vitesse et Batch size sont empilés verticalement, chacun avec son libellé et sa valeur. L’entraînement n’est plus présenté dans une barre inférieure. La taille du plan dépend de la largeur et de la hauteur restantes, en conservant un repère carré.

Sur écran étroit, trois onglets donnent accès à « Données et architecture », « Plan et entraînement » et « Réseau et calculs ». Les calculs détaillés s’ouvrent dans un volet indépendant, avec défilement interne si nécessaire, sans agrandir la page. La première version vise prioritairement un usage sur ordinateur.

## 5. Plan et édition des points

### 5.1 Affichage

Le plan affiche des axes x₁ et x₂, une grille discrète, les échantillons, les régions prédites, la frontière et une légende. L’échelle proposée est fixe, de −3 à +3 sur chaque axe. Le rapport d’échelle entre les axes reste identique pour ne pas déformer les figures.

Les points blancs possèdent un contour sombre. Un halo peut signaler un échantillon mal classé sans modifier sa couleur de cible.

### 5.2 Ajout

La barre d’outils propose « Point noir · 0 », « Point blanc · 1 », « Ajouter » et « Supprimer » avec une icône de poubelle.

L’utilisateur choisit une classe, active Ajouter puis clique dans le plan. Chaque clic ajoute un point à cet endroit. Le mode reste actif pour les ajouts successifs. Le curseur ou un indicateur rappelle la classe sélectionnée.

### 5.3 Suppression

En mode Supprimer, le survol met en évidence le point ciblé et un clic le retire. Un clic dans une zone vide ne fait rien. Un seul point est supprimé par clic ; lorsque plusieurs points sont proches, le plus proche du clic est ciblé dans une tolérance visuelle définie.

### 5.4 Inspection

Un mode d’inspection permet de sélectionner un échantillon sans le modifier. Ses coordonnées, sa cible, sa prédiction et les activations correspondantes deviennent consultables. Les modes d’ajout, de suppression et d’inspection sont exclusifs pour éviter les actions ambiguës.

### 5.5 Modification pendant une expérience

Comportement proposé : une modification des points met l’entraînement en pause, conserve les paramètres actuels, recalcule les indicateurs et recommence l’historique d’erreur pour le nouveau jeu. Le compteur des étapes de cet historique repart à zéro. Les points sont immédiatement sauvegardés localement.

## 6. Jeux de données

| Jeu | Description | Usage |
| --- | --- | --- |
| Deux groupes | Deux classes séparables par une droite | Découvrir le neurone seul |
| XOR | Quatre points avec classes alternées sur les diagonales | Comprendre la limite linéaire |
| Cercles | Une classe au centre, l’autre autour | Explorer les frontières non linéaires |

Les points du XOR peuvent être placés aux coordonnées −1 et +1, avec cible 0 lorsque les coordonnées ont le même signe et cible 1 sinon. Les cibles restent binaires.

Les jeux chargés restent modifiables. Les exemples guidés utilisent des données et initialisations reproductibles. Charger un jeu met l’entraînement en pause, remplace les points et réinitialise l’entraînement ; l’architecture courante est conservée. Charger une étape guidée applique, elle, la configuration complète de l’étape.

## 7. Architectures

### 7.1 Un neurone

Deux entrées sont reliées à un neurone de sortie :

ŷ = σ(w₁x₁ + w₂x₂ + b)

σ désigne la fonction sigmoïde. Le réseau possède deux poids et un biais. Sa frontière est droite lorsqu’elle existe ; elle peut être hors du cadre ou absente dans une configuration dégénérée.

### 7.2 MLP

Deux entrées alimentent une couche cachée de n neurones, qui alimente un neurone de sortie. Les couches successives sont entièrement connectées.

Pour chaque neurone caché j :

- zⱼ = wⱼ₁x₁ + wⱼ₂x₂ + bⱼ
- hⱼ = σ(zⱼ)

Pour la sortie :

- zₒ = Σⱼ vⱼhⱼ + bₒ
- ŷ = σ(zₒ)

Le choix proposé est une sigmoïde dans la couche cachée et en sortie. Les boutons − et + règlent n ; la plage proposée est de 1 à 8. Les boutons sont désactivés aux bornes.

Le premier passage en MLP utilise n = 1. Pour les passages ultérieurs, la proposition est de conserver la dernière taille MLP choisie dans la session.

### 7.3 Changement d’architecture

Changer de mode ou de taille cachée :

1. met l’entraînement en pause ;
2. conserve les échantillons ;
3. réinitialise les poids et biais ;
4. remet à zéro compteur et historique ;
5. actualise schéma, prédictions et indicateurs ;
6. revient à l’affichage de la sortie si le neurone inspecté n’existe plus.

## 8. Schéma et inspection du réseau

Le schéma représente exactement le réseau actif, avec entrées à gauche, couche cachée au centre et sortie à droite. Les nœuds portent les libellés x₁, x₂, h₁…hₙ et ŷ. Toutes les connexions sont visibles.

Pour trois neurones cachés, il existe deux entrées, trois neurones cachés et une sortie, soit six connexions d’entrée et trois connexions de sortie. Les biais participent aux calculs et sont consultables dans les détails, sans imposer des nœuds supplémentaires au schéma.

Un résumé indique « 2 entrées → n neurones cachés → 1 sortie » et l’activation utilisée.

Cliquer sur un neurone caché sélectionne sa carte d’activation. Un bouton visible « Revenir à la sortie du réseau » rétablit la vue globale. La sélection est mise en évidence dans le schéma.

## 9. Visualisations du plan

### 9.1 Sortie du réseau

Le fond représente les valeurs de ŷ : lavande vers 0, vert clair vers 1, avec une transition discrète. Un trait indigo représente le niveau 0,5. Les couleurs exactes sont définies dans un thème partagé.

Le MLP peut produire des courbes, plusieurs branches ou des régions fermées. L’affichage ne suppose ni une seule frontière ni une solution parfaite. L’absence de contour à 0,5 est un état valide.

### 9.2 Activation d’un neurone caché

Le fond représente hⱼ(x₁, x₂). La légende indique explicitement l’activation du neurone inspecté, et sa droite à 0,5 peut être affichée. Cette droite ne doit pas être confondue avec la frontière finale du réseau.

Les échantillons restent visibles. Un texte explique que la sortie combine les activations des neurones cachés pour construire sa propre frontière.

## 10. Entraînement

### 10.1 Commandes

| Commande | Effet |
| --- | --- |
| Un pas | Une mise à jour des paramètres à partir du prochain lot |
| Lecture / Pause | Démarre ou suspend la succession des étapes |
| Vitesse | Règle la cadence d’exécution et d’affichage |
| Réinitialiser l’entraînement | Conserve points et architecture, réinitialise paramètres et historique |
| Restaurer l’exemple initial | Recharge la configuration de départ de l’étape guidée active |

La vitesse ne modifie pas le taux d’apprentissage. Un pas calcule le gradient moyen du lot courant, puis met à jour simultanément les paramètres. Le slider « Batch size » permet toutes les tailles entières de 1 à N−1 ; sa borne droite indique « all (N) », avec N le nombre de points. La valeur exacte est affichée pendant le déplacement. Avec zéro ou un point, le slider est désactivé et affiche all (0) ou all (1).

Changer la taille met en pause et conserve poids, historique, compteurs, dernier lot et progression du passage courant. Le prochain lot reprend les points restants avec la nouvelle taille, même en passant à all. Une taille numérique qui atteint ou dépasse le nouveau nombre de points devient all. Le mode all reste actif lors des ajouts de points.

Les points sont mélangés, puis parcourus par lots successifs sans répétition au cours du passage. Le dernier lot peut être plus petit. Un nouveau mélange est effectué au passage suivant. Le mode all utilise tous les points à chaque mise à jour. En lecture rapide, le dernier lot affiché correspond à la dernière mise à jour effectuée.

Un anneau bleu entoure chaque point du dernier lot, indépendamment de sa classe. Il coexiste avec le halo orange des erreurs et reste affiché en pause jusqu’au pas suivant. Le libellé « Dernier lot : k / N points » indique sa taille réelle. Un changement de données, d’architecture ou une réinitialisation efface les anneaux obsolètes.

### 10.2 Méthode proposée

- Descente de gradient sur le lot sélectionné, ou sur le jeu complet en mode all.
- Rétropropagation pour le MLP.
- Entropie croisée binaire moyenne comme fonction d’erreur.
- Taux d’apprentissage fixe, réglable dans un panneau secondaire.
- Initialisation reproductible et non identique entre neurones cachés pour éviter une symétrie qui empêcherait leur différenciation.
- Calcul numériquement stable de l’erreur et des activations.

Le taux initial sera choisi lors de l’implémentation pour que les exemples guidés évoluent de façon lisible et fiable. Il n’est pas fixé par les maquettes.

### 10.3 Indicateurs

L’interface affiche le nombre d’étapes, le pourcentage de points bien classés, l’erreur moyenne et son historique. Tous correspondent au réseau courant sur les données courantes.

Le pourcentage mesure la réussite sur les échantillons affichés, pas la généralisation à de nouvelles données. L’erreur peut encore diminuer après l’obtention de 100 % de bonnes classifications.

## 11. Voir les calculs

Un panneau dépliable expose les calculs sans encombrer la vue principale. Il s’appuie sur l’échantillon sélectionné et indique clairement ce contexte.

Il montre :

1. les entrées et la cible ;
2. les poids et biais des neurones ;
3. leurs sommes pondérées ;
4. leurs activations ;
5. le calcul et la prédiction de sortie ;
6. l’erreur de l’échantillon et l’erreur moyenne du jeu.

Les détails sont regroupés par neurone et repliables lorsque le réseau grandit. Les nombres sont arrondis pour la lecture ; les calculs utilisent leur précision complète. Les formules et résultats viennent du moteur réel. Le panneau indique la taille du lot et distingue les calculs du point inspecté de ceux de l’entraînement. Les indicateurs globaux restent calculés sur tout le jeu.

## 12. Parcours guidé

### Étape 1 — Un seul neurone

Charger Deux groupes et Un neurone. Faire observer la droite, son déplacement et le rôle des poids et du biais. Proposer quelques pas puis la lecture automatique et l’ajout d’un point.

### Étape 2 — Les limites

Charger XOR et Un neurone. Expliquer l’impossibilité de séparer les quatre points avec une droite ; distinguer cette limite géométrique d’un manque de temps d’entraînement.

### Étape 3 — Une couche cachée

Charger Cercles et MLP avec un neurone caché. Inviter à passer à deux, trois puis quatre neurones. Chaque changement recommence l’entraînement sur les mêmes points. Faire inspecter les activations cachées et la sortie combinée.

### Étape 4 — Le défi XOR

Charger XOR et un MLP à deux neurones cachés. Proposer « Entraîner » et « Voir une solution ». La seconde action charge des paramètres connus qui classent correctement les quatre points et précise qu’il s’agit d’une solution préparée. Distinguer la capacité de représentation du réseau de la réussite d’un entraînement donné.

Les étapes restent accessibles directement et l’utilisateur peut modifier leur configuration.

## 13. Sauvegarde et restauration

Le localStorage conserve automatiquement les points, avec un format versionné et une validation à la lecture. La sauvegarde des poids, de l’historique et de l’architecture n’est pas requise dans cette première version.

À la réouverture, les points valides sauvegardés sont restaurés ; le réseau utilise l’architecture initiale Un neurone, avec des paramètres initialisés et l’entraînement en pause. L’interface indique la restauration des points.

Sans sauvegarde valide, l’application charge la première étape. Une sauvegarde absente, corrompue ou un stockage indisponible n’empêche pas l’utilisation ; un message discret signale l’impossibilité de persister les modifications si nécessaire.

« Restaurer l’exemple initial » remplace les points sauvegardés par ceux de l’étape guidée active et recharge son architecture de départ. Cette action est distincte de la réinitialisation du seul entraînement.

## 14. Cas particuliers et accessibilité

- Aucun point : entraînement désactivé et invitation à ajouter ou charger des échantillons.
- Une seule classe : entraînement autorisé.
- Points de cibles opposées aux mêmes coordonnées : acceptés, avec explication de la contradiction si détectée.
- Frontière hors du cadre ou absente : affichage valide, sans courbe artificielle.
- Modification pendant la lecture : pause avant application de la modification.
- Neurone ou point supprimé : sélection correspondante effacée.
- États sélectionnés, erreurs et modes signalés autrement que par la seule couleur.
- Boutons nommés, focus visible et contrôles standards utilisables au clavier.
- Schéma accompagné d’un résumé textuel de l’architecture.

## 15. Architecture logicielle

### 15.1 Stack

- Vite pour le développement et la compilation.
- TypeScript pour les modèles et la logique.
- React pour l’interface et sa synchronisation.
- Tailwind CSS pour la mise en page, le thème et les états des composants.
- Canvas 2D pour les cartes de prédictions et d’activation.
- SVG pour axes, points interactifs, contours, schéma du réseau et courbe d’erreur.
- localStorage pour les échantillons.

L’application s’exécute localement dans le navigateur, sans serveur applicatif ni compte. Une bibliothèque lourde d’apprentissage automatique n’est pas nécessaire pour ces réseaux.

### 15.2 Moteur mathématique

Module TypeScript indépendant de React, responsable de la création du réseau, de l’initialisation, de la propagation, des détails intermédiaires, de l’erreur, des gradients et de l’étape d’entraînement. Les résultats doivent être vérifiables sans interface.

### 15.3 État de l’expérience

Un reducer React et des hooks dédiés coordonnent données, architecture, paramètres, historique, lecture, outils et sélections. Des actions explicites rendent les transitions prévisibles. Aucun autre gestionnaire d’état n’est requis initialement.

Le réseau et les données constituent la source de vérité ; indicateurs et visualisations sont dérivés de leur état courant.

### 15.4 Visualisations

Les composants lisent l’état et ne contiennent pas de logique d’entraînement. Le fond Canvas et la superposition SVG partagent les mêmes transformations de coordonnées. La frontière est extraite du champ de sortie calculé, par exemple par marching squares, avec une résolution permettant un tracé stable.

La boucle de lecture doit conserver une interface réactive et être arrêtée proprement lors d’une pause ou d’un changement de configuration. L’optimisation par worker reste une possibilité ultérieure si les mesures la justifient.

### 15.5 Parcours, persistance et composants

Les étapes guidées sont des configurations déclaratives contenant jeu, architecture, paramètres initiaux et explications. La persistance est isolée derrière des fonctions de lecture, validation et écriture.

Des composants partagés structurent boutons, panneaux, sélecteurs et compteurs. Tailwind habille l’interface ; les mathématiques et la géométrie des visualisations restent dans leurs modules dédiés. Les couleurs utilisées par Canvas et SVG proviennent du même thème.

## 16. Vérification attendue

Les vérifications portent en priorité sur les comportements mathématiques et les transitions importantes :

- propagation d’un neurone et d’un MLP sur des paramètres connus ;
- gradients comparés à une approximation numérique ;
- erreur et seuil de classification ;
- résolution du XOR avec une configuration connue à deux neurones cachés ;
- conservation des points et réinitialisation lors d’un changement d’architecture ;
- ajout, suppression, sauvegarde et restauration des points ;
- cohérence des coordonnées entre le plan et les interactions ;
- cohérence de la carte d’un neurone sélectionné avec ses activations réelles.

Une vérification visuelle complète les contrôles : lisibilité, nombre exact de nœuds et de connexions, distinction des classes, frontières, modes d’inspection et adaptation de l’interface.

## 17. Critères d’acceptation

La première version est conforme lorsque :

1. Les trois jeux de données sont accessibles et modifiables.
2. Les points noirs ciblent 0 et les points blancs ciblent 1.
3. Les modes Ajouter, Supprimer et Inspecter n’entrent pas en conflit.
4. Un neurone seul affiche une frontière droite lorsqu’elle existe.
5. Le premier passage en MLP présente un neurone caché.
6. Les boutons − et + modifient la couche cachée et réinitialisent l’entraînement en conservant les points.
7. Le schéma correspond exactement à l’architecture active.
8. Un pas utilise le prochain lot pour une mise à jour ; le slider règle toutes les tailles de 1 à all et les anneaux bleus identifient le dernier lot.
9. Lecture, pause et vitesse fonctionnent sans modifier implicitement le taux d’apprentissage.
10. Les frontières et cartes d’activation sont calculées à partir des paramètres réels.
11. Cliquer sur un neurone caché affiche sa carte ; le retour à la sortie est explicite.
12. Le panneau dépliable présente les calculs de l’échantillon sélectionné.
13. Le parcours explique la limite linéaire et montre une solution du XOR avec deux neurones cachés.
14. Les points persistent localement entre deux ouvertures.
15. Les actions de réinitialisation de l’entraînement et de restauration de l’exemple initial sont distinctes.

## 18. Hors du périmètre initial

Plusieurs couches cachées, choix de multiples fonctions d’activation ou optimiseurs, import/export de fichiers, comptes utilisateurs, synchronisation distante et sauvegarde des entraînements ne sont pas requis pour cette première version. Ils pourront être étudiés après validation de l’expérience pédagogique principale.


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
