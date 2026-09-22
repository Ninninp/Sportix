# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## État actuel du dépôt

J0 et Phase D terminés (design : [`docs/PHASE-D.md`](docs/PHASE-D.md)).

**J1 à J5 : codés. J1, J2, J3 et J5 validés par l'utilisateur ; J4 en attente d'une seule vérification (le son).**

- **J1 (coquille PWA)** — codé le 19/09/2026, **validé le 21/09/2026** : PWA installable et hors ligne (`vite-plugin-pwa`), tokens dans `src/index.css`, composants `Button`/`Card`/`BottomNav`, 5 onglets, déploiement GitHub Pages. Testé sur l'iPhone : app installée, marche en mode avion, barre d'onglets et accueil OK. Le message iOS « Désactivez le mode Avion… » au lancement hors ligne **reste** : limite acceptée, la seule requête à l'ouverture est `sw.js`, faite par le navigateur lui-même (vérification de mise à jour prévue par la norme des service workers), impossible à supprimer depuis l'app. `src/pwa.ts` vérifie les mises à jour à chaque retour au premier plan et recharge tout seul ; le numéro de version (commit · date) s'affiche en bas de Réglages. `/code-review` fait le 19/09/2026.
- **J2 (base de données + bibliothèque)** — **validé le 21/09/2026** (testé sur l'iPhone) : base Dexie, 32 exercices pré-remplis, écrans Bibliothèque / Nouvel exercice / Modifier / suppression.
- **J3 (enregistrer une séance)** — **validé le 21/09/2026** (testé à la salle) : séance libre, pavé − / +, pré-remplissage, double progression, records, récapitulatif, historique. Retour de la salle corrigé : à la barre libre la charge part de 20 kg et n'en descend plus (`minWeight` / `stepWeight` dans `src/lib/progression.ts`).
- **J4 (minuteur de repos)** — codé le 21/09/2026, `/code-review` fait, **pas encore validé** : repos lancé à la validation d'une série, écrans repos actif / prolongé / terminé, « +15 s », barre « Séance en cours » au-dessus des onglets, son, écran gardé allumé, vibration (Android), Réglages (repos par défaut, son, pas de charge par variante). Testé sur l'iPhone : écran allumé OK, décompte juste après verrouillage OK, secondes régulières OK (chronos calés sur le changement de seconde, `useNow(anchor)` + `msUntilNextSecond`). **Il ne reste que le test du son.** Les animations (fin de repos, « +15 s ») sont en CSS pour l'instant et seront reprises au **J10** (les View Transitions ne marchent pas sur son iPhone ; iOS colore la barre d'état d'après les éléments fixes du haut, même transparents → un voile qui s'efface doit être retiré du DOM à la fin de son animation).
- **J5 (programmes)** — codé et **validé le 21/09/2026** : onglet Programmes, accueil façon Lyfta (chiffres de la semaine avec évolution, pastilles des jours, « Autre séance »), séance « en liste », Dexie v4. Maquettes : canvas « Sportix — Maquettes J5 » (lien dans `design/README.md`, sources `design/maquettes-j5/`). `/code-review` fait le 21/09/2026, les 8 remarques traitées : démarrage de séance vérifié **dans** la transaction d'écriture (un double appui créait une deuxième séance fantôme — idem `startSession`) ; boutons − / + du panneau d'exercice calculés depuis la base et non depuis l'affichage (`changeDayExercise`, sinon des appuis rapides étaient perdus) ; un exercice supprimé est retiré des jours de programme et l'écran de suppression le dit (`countExerciseInPrograms`) ; comparaison de la semaine passée calculée en jours de calendrier (`weekBefore`, juste aux changements d'heure) ; heure de l'accueil relue à chaque retour au premier plan (`useNowOnResume`) ; grande carte limitée à 5 exercices + « + N » ; rôles ARIA du tableau des séries ; `SetRow.tsx` (code mort) supprimé.
- **Après le J5, le 21/09/2026** : l'ordre des jours d'un programme se change enfin (flèches « Monter » / « Descendre » dans le menu ⋯ du jour, `moveDay`) — il n'y avait aucun moyen de le faire, alors que c'est lui qui décide de la rotation des séances ; et le chrono de « Repos par défaut » (Réglages) utilise le pavé compact.
- **J6 (calendrier des blocs)** — **codé le 22/09/2026, pas encore validé** (détails plus bas) ; **maquettes faites et publiées le 21/09/2026** (canvas « Sportix — Maquettes J6 », lien dans `design/README.md`, sources `design/maquettes-j6/`, 7 écrans × 2 thèmes) ; **décisions prises** : l'onglet Calendrier est une **vue mensuelle** et elle seule (la variante « frise des blocs » est écartée) ; **un bloc commence un lundi et dure un nombre entier de semaines** ; le deload est facultatif (« Aucun »). **Pas de date-fns** : les calculs tiennent en `Date` natif, comme `src/lib/week.ts` (plan mis à jour). Fait le 22/09/2026 : `src/lib/blocks.ts` testé (`blocks.test.ts`), Dexie **version 5** (`blocks`, `blockGoals`, objectif d'exemple « Force » ajouté aussi aux bases existantes), `src/db/blocks.ts` (CRUD, objectifs ; `createBlock` / `updateBlock` avec `shiftNext` pour décaler les blocs suivants, calcul dans `shiftNextBlocks`), `blockId` posé par `startSession` et `startProgramSession`. **Règle du rattachement** : le `blockId` d'une séance suit toujours les dates (bloc en cours à son démarrage) ; il est recalculé pour toutes les séances à chaque création / modification / suppression d'un bloc (`reattachSessions`, dans la même transaction). Test de migration v4 → v5 dans `src/db/blocks.test.ts`.

**Écrans du J6 codés le 22/09/2026**, pas encore validés : onglet Calendrier (`CalendarPage` : grille du mois, colonne S1/S2/D, mois précédent / suivant, carte du bloc en cours ou du prochain), `BlockFormPage` (nouveau / modifier, panneau « Nouvel objectif » ; **le deload ne se règle que là** : un seul par bloc, « Aucun » ou « sem. N » ; avertissement de chevauchement avec « Décaler « X » » / « Laisser le chevauchement » / « Changer les dates »), `BlockDetailPage` (tuiles, semaines, suppression ; plus de « + Semaine de deload », retiré le 22/09/2026 à la demande de l'utilisateur), ligne du bloc sur l'accueil (`WeekBar`). Parcours complet piloté dans Chrome (puppeteer-core hors dépôt), thèmes clair et sombre.

Retours de l'utilisateur du 22/09/2026, traités : bouton « + Semaine de deload » retiré ; retouches du canvas J6 reportées (chiffres de la semaine centrés sur l'accueil, « 5 sem. » / « sem. 4 ») ; carte du calendrier en toutes lettres (« 4 faites sur 10 prévues » : prévues = jours du programme × semaines). **Question ouverte** : la règle des séances prévues ne convient pas (un programme A/B fait 3 fois par semaine donne 2 × semaines) — attendre la réponse de l'utilisateur.

**Reprendre ici (J6)** :
1. Trancher les séances prévues, test sur l'iPhone, puis `/code-review` du J6, puis validation.
2. À prévoir (parcours § 3.6) : les séances de deload ne déclenchent pas la double progression.

Reste aussi du J4 : **le test du son** sur l'iPhone (dernier point avant de pouvoir cocher le J4).

App en ligne : **https://ninninp.github.io/Sportix/** (redéployée à chaque push sur `main` par `.github/workflows/deploy.yml`, qui lance aussi lint et tests). Dans l'onglet Actions de GitHub, le seul workflow qui compte est « Déploiement GitHub Pages » ; un run « pages build and deployment » signifie que Pages est repassé en mode « depuis une branche » (il publierait les sources brutes). Pour relancer un déploiement sans changement : `git commit --allow-empty` + push. Sans `gh` sur cette machine : l'état des runs se lit via `https://api.github.com/repos/Ninninp/Sportix/actions/runs` (réponse mise en cache ~1 min).

Références de design, qui font foi pour tout le code d'interface :
- [`design/tokens.md`](design/tokens.md) : couleurs (deux thèmes automatiques clair/sombre via `prefers-color-scheme`), typo SF Pro, espacements, mouvement ; son bloc CSS est recopié dans `src/index.css` (le modifier aux deux endroits).
- [`public/icon.svg`](public/icon.svg) : icône de l'app (disque de fonte orange sur encre), source de `@vite-pwa/assets-generator`.
- Canvas « Sportix — Maquettes D5 » (lien dans [`design/README.md`](design/README.md)) : 22 écrans du MVP × 2 thèmes. Sources dans `design/maquettes-d5/` (`S-…` sombre, `C-…` clair, générées par `generer.mjs`). Les choix de design validés sont listés dans `design/README.md`.
- `design/exports/` : PNG des planches, à exporter depuis le canvas (pas encore fait).

## Appareil cible et outil de design

- **iPhone 14** (390×844 pt, encoche, barre d'accueil ; Safari en PWA standalone) : zones de sécurité ≈ 47 pt en haut / 34 pt en bas, `env(safe-area-inset-*)` ; **pas de vibration web sur iOS** (fin de repos = signal visuel fort + son) ; pas d'invite d'installation automatique (prévoir un encart « Partager → Sur l'écran d'accueil »). Planches de maquette en 390×844.
- **Claude Design seul** (Artifact de type « Design » = canvas de planches ; pas de skill ni de commande `/design`), pas de Figma. Liens des canvas et choix de design notés dans `design/README.md` ; exports PNG dans `design/exports/`. Le fonctionnement pour chaque jalon est décrit dans `docs/PHASE-D.md`.

Avant toute action, **lire [`docs/PLAN.md`](docs/PLAN.md)** : c'est la source de vérité du projet (contexte, stack, modèle de données, jalons J0 → J9). Toute décision d'architecture doit s'y conformer ou mettre le plan à jour explicitement.

## Contexte du projet

PWA personnelle de suivi d'entraînement en salle, utilisée sur téléphone (installée sur l'écran d'accueil, utilisable hors-ligne). Spécificité par rapport aux apps du genre : un **calendrier de blocs de spécialisation** (périodisation — un bloc = un objectif + une date de début + une durée en semaines + un programme associé), auquel les séances sont rattachées pour comparer la progression d'un bloc à l'autre.

Contraintes structurantes :
- **Aucun backend, aucune donnée hors de l'appareil.** Tout est en IndexedDB (Dexie). La synchronisation multi-appareils n'est pas au programme ; la portabilité des données passe par un export/import JSON (jalon J8).
- **Mobile-first strict**, conçu pour une utilisation en salle : cibles tactiles ≥ 48 px, actions principales dans la zone du pouce, chiffres lisibles à 1 m, usage à une main.
- Le **design précède le code** : les maquettes (Claude Design, exportées dans `design/`) et les tokens de `design/tokens.md` font foi pour l'UI ; la config Tailwind dérive de ces tokens.

## Communication

L'auteur est **débutant en développement web** et travaille **en français**. Répondre en français, expliquer les choix et le rôle des fichiers créés plutôt que livrer du code sans commentaire.

## Stack

Installé : Vite 8 + React 19 + TypeScript 6 · Tailwind CSS v4 (plugin `@tailwindcss/vite`) · React Router v8 (paquet `react-router`, pas `react-router-dom`) · Vitest 5 · oxlint (config `.oxlintrc.json`, ignore `.claude/` et `design/`) · `vite-plugin-pwa` + `@vite-pwa/assets-generator` (J1) · Dexie + `dexie-react-hooks`, `fake-indexeddb` en dev (J2). Node ≥ 24 (`.nvmrc`).

À ajouter avec les jalons concernés : Recharts (J7). **date-fns écarté au J6** (21/09/2026) : `Date` natif suffit pour les semaines et la grille du mois.

Notes :
- **Tailwind v4 n'a pas de `tailwind.config.js`** : les tokens sont dans `src/index.css` (variables `--sx-*` par thème + `@theme`). Classes disponibles : `bg-bg`, `bg-surface`, `bg-surface-2`, `border-border`, `border-border-strong`, `text-text`, `text-muted`, `text-faint`, `bg-accent`/`text-on-accent`, `accent-2`, `inverse`/`on-inverse`/`on-inverse-muted`, `hero-action`, `danger`, tailles `text-caption` … `text-display` et `text-num-s` … `text-num-hero`, utilitaire `num` (chiffres tabulaires).
- **L'app vit sous `/Sportix/`** (`base` de `vite.config.ts`, `basename` du routeur) : en dev, ouvrir `http://localhost:5173/Sportix/`.
- Routes dans `src/routes.tsx` ; `src/App.tsx` = layout racine (contenu + `BottomNav`, zones de sécurité iPhone via `env(safe-area-inset-*)`).
- **Icônes PWA** générées au build depuis `public/icon.svg` (`pwa-assets.config.ts`) ; les PNG produits dans `public/` sont ignorés par Git.
- Service worker : pas de doublon dans `workbox.globPatterns` (le manifest est déjà ajouté par le plugin) — un doublon fait échouer toute la mise en cache hors ligne.
- **Base de données** : `src/db/schema.ts` (Dexie — version 1 : `exercises` ; version 2 (J3) : `sessions` et `sets` ; version 3 (J4) : `settings` ; version 4 (J5) : `programs`, `programDays`, `programExercises`), `seed.ts` (32 exercices insérés au premier lancement), `exercises.ts` et `sessions.ts` (lecture/écriture), `persist.ts` (stockage persistant). Les fonctions d'accès acceptent une base en dernier paramètre, ce qui permet de les tester avec `fake-indexeddb` (`src/db/db.test.ts`). **Toute évolution du schéma = une nouvelle `db.version(n)`**, jamais une modification d'une version publiée.
- **Suppression d'un exercice = suppression « douce »** (`deletedAt`) : il disparaît des listes mais reste en base pour l'historique des séances. Il est en revanche **retiré des jours de programme** (sinon il revenait dans chaque nouvelle séance) ; l'écran de suppression annonce combien de séances de programme sont concernées (`countExerciseInPrograms`).
- Les écrans lisent la base avec `useLiveQuery` (voir `src/features/exercises/useExercises.ts` et `src/features/sessions/useSession.ts`) : l'affichage se met à jour tout seul.
- **Règles de la séance dans `src/lib/`** : `sessions.ts` (regroupement par exercice, volume — ×2 pour les haltères —, durées, formats français), `progression.ts` (pas de charge par variante, pré-remplissage et double progression de `docs/design/parcours.md` § 2), `records.ts` (record = charge max par exercice **et** variante ; reps pour le poids du corps). Les composants ne calculent pas.
- **Séance en cours** = séance sans `endedAt` ; une seule à la fois, retrouvée au lancement. « Terminer » supprime les séries non faites. Les onglets sont masqués sous `/seance` (`src/App.tsx`).
- **Écritures concurrentes (relecture du J5)** : deux appuis rapprochés sur un bouton sont la règle sur iPhone, pas l'exception. Un test du genre « existe-t-il déjà ? » doit donc être **dans la même transaction Dexie** que l'écriture (`startSession`, `startProgramSession`), et un bouton − / + doit calculer sa nouvelle valeur **depuis la base** (`changeDayExercise`), jamais depuis la valeur affichée, qui a un cycle de retard.
- **Repos (J4)** : `session.rest` = `{ endsAt, duration, extended? }` (`src/lib/rest.ts`), jamais de décompte. `validateSetAndRest` valide la série et lance le repos dans une seule transaction (et remplit les séries suivantes encore vides du même exercice). Les chronos affichés à la seconde utilisent `useNow(anchor)` (`src/features/timer/useNow.ts`) : rafraîchissement calé sur le changement de seconde, jamais un `setInterval` à intervalle fixe (secondes irrégulières sur iPhone). Animations de repos en CSS (`@keyframes sx-*` dans `src/index.css`), pas de View Transitions ; un élément `fixed` coloré doit quitter le DOM après son animation (iOS s'en sert pour colorer la barre d'état, même à opacité 0). L'alarme (son, vibration, Wake Lock) est montée dans `App.tsx` via `useRestAlarm`, pour marcher depuis n'importe quel onglet ; elle ne sonne que si la fin est vue « en direct » (`shouldRing`). Le son (Web Audio, `src/features/timer/sound.ts`) doit être déverrouillé pendant un geste : `unlockAudio()` à l'appui sur « Valider la série ».
- **Programmes (J5)** : `src/lib/programs.ts` (types, `nextDay` = rotation A → B → A, `planDaySets` = séries du jour pré-remplies, `increaseSuggested`), `src/db/programs.ts` (CRUD, `startProgramSession` : séance + toutes ses séries en une transaction), écrans dans `src/features/programs/`. Programme actif = `settings.activeProgramId`. Une séance de programme porte `programDayId` et `title` (nom du jour, affiché dans l'en-tête, l'historique et le récap) ; ses séries portent `restSeconds` (repos de l'exercice) et `progression: false` si la double progression est désactivée. Sans double progression, `repsMin = repsMax` (reps fixes). Première fois sur un exercice : 0 rep, les séries suivantes suivent la première.
- **Ordre des jours d'un programme** : c'est l'ordre de la rotation des séances (`nextDay`). Il se change dans le menu ⋯ d'un jour (« Monter » / « Descendre », `moveDay`) ; il n'y a pas de glisser-déposer, trop hasardeux à une main en salle.
- **Accueil (J5)** : `src/lib/week.ts` (chiffres de la semaine à date égale : du lundi à maintenant contre la même période la semaine passée ; flèche seule, grise vers le bas, rien si égal ; pastilles). « Autre séance » : choix pour aujourd'hui seulement (état de l'écran, pas en base).
- **Séance « en liste » (J5)** : `src/features/sessions/SessionList.tsx` (exercice ouvert en tableau, autres repliés), pavé `NumberStepper compact`. Le choix d'exercice est partagé (`src/features/exercises/ExercisePicker.tsx`) entre la séance et les programmes.
- **Réglages** : `src/lib/settings.ts` (valeurs par défaut, `withDefaults`), `src/db/settings.ts` (une ligne `id: 'app'`, seuls les réglages modifiés sont enregistrés), `useSettings()`. Le pas de charge des réglages se passe en dernier paramètre (`steps`) aux fonctions de `progression.ts`.
- Le pavé − / + (`NumberStepper`) réagit au **doigt qui se pose** (`onPointerDown`, pour le maintien enfoncé) : un test automatisé doit envoyer `pointerdown`, pas seulement `click`. Toucher le nombre ouvre le clavier (`onType`) ; sa largeur vient d'une copie invisible du texte (jamais d'une largeur estimée en `ch`, fausse avec SF Pro), hauteurs de ligne resserrées (14 + 34 px) pour tenir dans les 60 px du bloc, et `overflow-clip` (pas `hidden`) pour que le focus ne fasse pas défiler le bloc.

## Commandes

```bash
npm run dev          # serveur de développement → http://localhost:5173/Sportix/
npm run build        # vérification TypeScript (tsc -b) + build de production dans dist/
npm run lint         # oxlint
npm run preview      # servir dist/ — tester le service worker / mode PWA (ne fonctionne pas en dev)
npm test             # Vitest en mode surveillance ; `npm test -- --run` pour une exécution unique
npm test -- src/lib/sanity.test.ts   # un seul fichier de test
```

## Architecture visée

Découpage par fonctionnalité, pas par type de fichier :

```
src/db/          schema.ts (Dexie + migrations), seed.ts, backup.ts (export/import JSON)
src/features/    exercises/ sessions/ programs/ blocks/ stats/ timer/
src/components/  UI partagée issue du design system
src/lib/         calculs purs (1RM Epley, volume, PR) et helpers de dates
```

Principes à respecter :
- **Toute la logique de calcul dans `src/lib/`**, en fonctions pures et testées (Vitest). Les composants ne calculent pas.
- **Accès aux données via Dexie uniquement dans `src/db/` et les hooks de features** ; lecture réactive avec `useLiveQuery` plutôt qu'un état global dupliqué.
- **Sauvegarde immédiate à chaque saisie** pendant une séance : l'app peut être fermée ou tuée par le système à tout moment en salle.
- **Toute évolution du schéma Dexie passe par une migration versionnée** — des données réelles d'entraînement peuvent déjà exister sur le téléphone, elles ne doivent jamais être perdues.
- Le **minuteur de repos se base sur un horodatage de fin**, jamais sur un décompte `setInterval`, pour rester juste quand l'écran se verrouille.

## Git

Dépôt `Ninninp/Sportix`, branche `main`. Le projet est travaillé depuis plusieurs machines : commencer par `git pull`, et pousser en fin de session de travail.
