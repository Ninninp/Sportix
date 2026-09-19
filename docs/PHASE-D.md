# Phase D — Design de Sportix (plan détaillé)

> Plan validé le 16/09/2026. Statut : **D1 à D4 faits ; D5 publié le 19/09/2026, en relecture** (reprendre par la validation page par page : J3 → J4 → J2 → Réglages).
>
> **À la reprise d'une session de design :** relire le canvas en ligne (lien dans `design/README.md`) et ses commentaires *avant* toute modification. L'utilisateur a pu le retoucher depuis un autre appareil. Recopier ensuite les fichiers modifiés dans `design/wireframes-d2/`. Cocher chaque étape ici au fur et à mesure.

## Contexte
Le J0 est terminé (squelette Vite/React/Tailwind/Router poussé, commit `f759f71`). D'après `docs/PLAN.md`, la **Phase D** précède tout code d'interface : les maquettes et `design/tokens.md` feront foi pour le J1 (tokens dans le bloc `@theme` de `src/index.css`, composants Button/Card/BottomNav) et pour les écrans des jalons J2 à J4.

Décisions prises avec l'utilisateur :
- **Téléphone : iPhone 14** (écran 390×844 points, **encoche** en haut, barre d'accueil en bas) → concevoir pour Safari en mode PWA « standalone ».
- **Outil : Claude Design seul** (canvas créé depuis Claude Code comme Artifact de type « Design ») → une seule source de vérité, pas de Figma.
- **Direction visuelle : aucune idée préalable** → proposer 3 directions contrastées en D3.

Durée indicative : 3–5 jours, en **5 sessions courtes**, chacune terminée par une validation de l'utilisateur, puis un commit et un push.

## Contraintes iPhone à intégrer dès les wireframes
- **Zones de sécurité de l'iPhone 14** : environ 47 pt en haut (encoche + barre d'état) et 34 pt en bas (barre d'accueil). Rien d'interactif dans ces zones : la BottomNav et les boutons d'action se placent *au-dessus* de la barre d'accueil. Au J1, on utilisera `env(safe-area-inset-*)`.
- **Pas de vibration web sur iOS** → la fin du repos doit se voir de loin (écran qui change franchement de couleur, gros chiffres) et s'entendre (son).
- **Pas d'invite d'installation automatique** sur iOS → prévoir un petit écran ou encart « Installer Sportix : Partager → Sur l'écran d'accueil ».
- Format des planches : **390×844**, exactement la taille de l'iPhone 14 : la maquette correspond donc à l'écran réel.
- Règles de `CLAUDE.md` : cibles tactiles ≥ 48 px, actions principales dans la zone du pouce, chiffres lisibles à 1 m, contraste AA, utilisation à une main.

## Comment on utilise Claude Design (Phase D et jalons suivants)

**Ce que c'est** : une toile de dessin (« canvas ») qui contient plusieurs **planches** (artboards), une par écran, posées côte à côte ; on s'y déplace et on zoome comme dans Figma. Pas d'application à installer : tout se lance depuis Claude Code.

**Le cycle, à chaque fois :**
1. **Tu décris ce que tu veux** dans Claude Code, par exemple « crée les wireframes des écrans de `docs/design/parcours.md` ». Je crée alors (ou reprends) un Artifact de type « Design ». Il n'y a ni skill ni commande `/design` à lancer : il suffit de le demander.
2. **Je dessine le premier jet** : j'écris les planches (fichiers `.dc.html`) et je les publie comme **Artifact**, c'est-à-dire une page privée sur claude.ai dont je te donne le lien.
3. **Tu ouvres le lien**, sur l'ordinateur pour retoucher, et sur l'iPhone pour juger la taille réelle.
4. **Tu retouches à la souris**, si l'édition est activée sur ton compte (on le verra au premier lien) :
   - cliquer sur un élément pour le sélectionner ;
   - modifier couleur, taille ou espacement dans le panneau de propriétés ;
   - double-cliquer sur un texte pour le réécrire ;
   - annuler / rétablir ;
   - **Enregistrer** publie une nouvelle version au même lien.

   Sinon, l'Artifact est en lecture seule : tu me décris les changements (« le bouton Terminer plus gros et en bas ») et je republie.
5. **Pour les gros changements** (nouvel écran, nouvelle direction), tu me le demandes dans Claude Code et je crée ou re-remplis un canvas. Les petites retouches se font directement dans l'Artifact.
6. **Tu exportes les planches validées** en PNG (ou PDF) depuis le canvas, dans `design/exports/`. Claude Code s'en sert ensuite comme référence visuelle.
7. **Retrouver ses canvas** : dans le terminal, `/artifacts` ; sur le web, `claude.ai/code/artifacts`. Les liens sont aussi notés dans `design/README.md`.

**Aux jalons suivants (J1 → J9)**, le design reste la 1ʳᵉ étape du cycle décrit dans `docs/PLAN.md` :
- **Début de jalon** : si l'écran n'existe pas encore (programmes au J5, calendrier des blocs au J6 avec 2 variantes, graphiques au J7), je crée ou complète un canvas avec les tokens de `design/tokens.md`, puis tu valides et exportes.
- **Pendant le code** : je lis `design/tokens.md` et les PNG de `design/exports/` pour reproduire l'écran.
- **Fin de jalon** : je fais une capture de l'app en format iPhone 14 et je la compare à la maquette, puis on corrige les écarts.
- **Après un test à la salle** : les frictions notées deviennent des retouches du canvas, *avant* la retouche du code.
- **Règle** : le canvas + `tokens.md` sont la seule référence. Si on change une couleur, on la change d'abord dans `tokens.md`.

## Étapes

### D1 — Parcours & écrans (session 1, dans Claude Code) ✅ fait le 17/09/2026
Livrable : **`docs/design/parcours.md`**, en français :
- **Inventaire des écrans** : pour chacun, son rôle, les informations affichées, l'action principale et le jalon concerné.
- **Parcours clés en diagrammes Mermaid** :
  1. démarrer une séance → ajouter un exercice → saisir une série → repos → terminer → voir le PR ;
  2. créer un exercice ;
  3. consulter l'historique ;
  4. (aperçu J5/J6) lancer la séance du jour d'un programme et voir le bloc actif.
- **Arborescence de navigation** : les onglets de la BottomNav et les écrans secondaires (5 onglets : Séance · Programmes · Calendrier · Stats · Réglages).
- **Questions métier à trancher** avec l'utilisateur, notées dans le fichier :
  - le pas de charge (2,5 kg ? 1,25 kg ?) ;
  - le RPE : affiché ou masqué par défaut ;
  - le contenu de l'accueil ;
  - la liste des objectifs de bloc (force, hypertrophie, endurance, …) ;
  - l'affichage de la « dernière fois » pendant la saisie.
- ✅ Point de validation : l'utilisateur relit et tranche les questions. **Validé** (v4 de `parcours.md`), avec en plus : double progression, 5 variantes d'équipement, remplacement d'exercice, deload, poids corporel et objectifs perso.

### D2 — Wireframes basse fidélité (session 2, canvas Design) ✅ validé le 18/09/2026 (accueil et écrans de séance refaits, voir `design/README.md`)
Un canvas de **9 planches** en niveaux de gris, sans couleur (liste revue après D1, détail dans `docs/design/parcours.md` § 7) :
- Accueil
- Séance en cours
- Choix d'exercice (avec la création rapide d'exercice)
- Historique
- Programmes
- Calendrier des blocs (avec une semaine de deload)
- Stats — vue d'ensemble
- Stats d'un exercice
- Réglages (avec l'encart d'installation iOS)

Contenu des planches :
- La Séance en cours montre trois états :
  - saisie pré-remplie (double progression : objectif de reps, badge ↑ charge ; boutons +/− et `+ Série`) ;
  - minuteur de repos actif ;
  - menu `⋯` (remplacer / changer de variante / objectif).
- Les zones de sécurité iOS sont matérialisées sur chaque planche.
- Les données d'exemple sont réalistes : squat 100 kg × 5, bloc « Force — semaine 2/4 ».

Suite de la session :
- Sources du canvas enregistrées dans `design/` (emplacement exact selon la skill) ; l'URL de l'Artifact est notée dans `design/README.md`.
- L'utilisateur ouvre l'URL **sur son iPhone** pour juger la taille réelle et l'accessibilité au pouce.
- ✅ Validation, puis retouches éventuelles.

### D3 — Direction visuelle (session 3, canvas Design) ✅ validé le 18/09/2026
3 directions contrastées, appliquées chacune aux **deux mêmes écrans** (Séance en cours et Accueil) pour pouvoir comparer :
1. **Sombre, fort contraste** : fond quasi noir et un accent vif ; lisible en salle.
2. **Sportif / énergique** : couleurs saturées et typographie condensée.
3. **Clair et sobre** : fond clair, style app de santé.

Pour chaque direction :
- une palette et une police (Google Fonts) ;
- un aperçu des gros chiffres et de l'écran « fin de repos ».

L'utilisateur choisit une direction, ou un mélange. ✅ Le choix est consigné dans `design/README.md`.

✅ **Fait le 18/09/2026** : Clair écarté après une critique impeccable ; les deux autres corrigées puis validées correction par correction. Décision : **deux thèmes automatiques** (sombre = « Nuit + Énergie », clair = « Énergie corrigée »). D4 doit donc produire des tokens avec une valeur par thème.

### D4 — Design system (session 4) ✅ validé le 19/09/2026

> **19/09/2026 : validé.** Couleurs, typographie et composants acceptés sans retouche. Icône : plusieurs séries explorées (haltères, lettre S, kettlebell, chevrons, chrono, calendrier, courbe) sur la planche « Icône — variantes du disque » ; retenue : **disque de fonte orange `#FF4B1F` sur fond encre `#1A1030`**, une seule icône pour les deux thèmes (`design/icon.svg`).
>
> Fait : `design/tokens.md` (couleurs par rôle pour les deux thèmes, contrastes, typo SF Pro, espacements, mouvement, bloc CSS pour le J1), canvas « Sportix — Design system D4 » (lien dans `design/README.md`, sources dans `design/design-system-d4/`), `design/icon.svg`. Police décidée : SF Pro (système Apple) pour les deux thèmes.- **`design/tokens.md`** : couleurs nommées par rôle (fond, surface, texte, accent, succès/PR, danger), typographie (tailles, dont les « gros chiffres »), espacements, arrondis et ombres.
  - Chaque couleur est donnée en valeur exacte, avec son **ratio de contraste vérifié (AA)** sur son fond.
  - Le fichier est écrit pour être recopié tel quel dans le bloc `@theme` de Tailwind v4 au J1.
- **Planche de composants** avec leurs états (normal, pressé, désactivé, validé) :
  - Button (principal / secondaire / danger)
  - Card
  - NumberStepper (+/−, grande valeur au centre)
  - SetRow (n°, charge, reps, case « fait », rappel « dernière fois »)
  - BottomNav (5 onglets, icônes Lucide)
  - RestTimer (compact et plein écran)
- **Icône de l'app** : `design/icon.svg`, qui doit rester lisible en petit et sur fond iOS (elle servira à `@vite-pwa/assets-generator` au J1).
- ✅ Validation (19/09/2026).

### D5 — Maquettes haute fidélité du MVP (session 5, canvas Design) — premier jet publié le 19/09/2026, en relecture

> Fait : canvas « Sportix — Maquettes D5 » (lien dans `design/README.md`), 21 écrans × 2 thèmes = 42 planches cliquables, rangées en 4 pages (J2 · Exercices, J3 · Séance, J4 · Repos, Réglages). Sources et générateur dans `design/maquettes-d5/`. Choix à faire valider : séance libre nommée par ses exercices dans l'historique (« Squat, Presse à cuisses +3 ») ; exercice supprimé conservé dans l'historique ; encart d'installation iOS aussi sur l'accueil au premier lancement ; barre compacte « séance en cours » au-dessus des onglets. Reste : validation, puis exports PNG dans `design/exports/`.
Écrans des jalons J2 à J4, construits avec le design system de D4. Chaque écran a ses états **vide / rempli** :
- **J2** : bibliothèque d'exercices (liste + recherche), formulaire d'ajout/modification, confirmation de suppression.
- **J3** : accueil (démarrer une séance), séance en cours (plusieurs exercices, séries cochées, valeurs reprises de la dernière fois), choix d'exercice, fin de séance / récapitulatif avec PR 🏆, historique et détail d'une séance.
- **J4** : minuteur de repos actif (+15 s, passer), écran « repos terminé ».
- **Réglages** minimal (kg/lb, repos par défaut, installation iOS).

Suite de la session :
- L'utilisateur exporte les planches en **PNG** depuis le canvas vers `design/exports/` ; elles serviront de référence lors des comparaisons visuelles des jalons suivants.
- ✅ Validation finale : les maquettes du MVP sont validées et le canvas devient la référence.

### Clôture
- Mettre à jour `CLAUDE.md` avec les liens vers le canvas, `design/tokens.md` et `design/exports/`, et la direction retenue.
- Marquer la Phase D comme faite dans `docs/PLAN.md`.
- Commit, puis push.

## Fichiers produits
`docs/design/parcours.md` · `design/README.md` (URLs des canvas, choix faits) · `design/tokens.md` · `design/icon.svg` · `design/exports/*.png` · sources des canvas dans `design/` · mises à jour de `CLAUDE.md` et `docs/PLAN.md`. **Aucun code dans `src/`** pendant cette phase.

## Vérification
- Chaque planche est ouverte **sur l'iPhone** via l'URL de l'Artifact : taille des textes, accès au pouce, lecture « à 1 m » des chiffres de la séance et du minuteur.
- Contrôle de chaque planche avec la checklist : cibles ≥ 48 px, zones de sécurité respectées, action principale en bas de l'écran.
- Ratios de contraste des tokens calculés et notés dans `tokens.md` (AA ≥ 4,5:1 pour le texte, ≥ 3:1 pour les grands chiffres et les icônes).
- Relecture croisée : chaque écran de `parcours.md` a sa maquette, et chaque composant de D4 est utilisé dans D5.
