# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## État actuel du dépôt

J0 et Phase D terminés (design : [`docs/PHASE-D.md`](docs/PHASE-D.md)). **J1 (coquille PWA) codé le 19/09/2026, validé le 21/09/2026** : PWA installable et hors ligne (`vite-plugin-pwa`), tokens dans `src/index.css`, composants `Button`/`Card`/`BottomNav`, 5 onglets (Séance et Réglages en coquille, Programmes/Calendrier/Stats « à venir »), déploiement GitHub Pages. **Déployé et en ligne le 19/09/2026** (dépôt public, Pages en source « GitHub Actions » ; vérifié : page, service worker, manifest, icônes, liens directs, rendu iPhone émulé). Premier test sur l'iPhone (19/09/2026) : app installée, marche en mode avion, page Réglages OK, barre d'état OK en sombre (`default` gardé ; thème clair non testable sur son iPhone). Retours corrigés et déployés : barre d'onglets abaissée (56 px, 8 px sous la zone de sécurité), accueil sans titre ni date (reporté aussi dans le canvas D5), et service worker enregistré seulement avec du réseau (`src/pwa.ts`) pour éviter le message iOS « Désactivez le mode Avion… » au lancement hors ligne. Re-test du 21/09/2026 : barre d'onglets et accueil OK, message du mode avion toujours là (voir plus bas). `src/pwa.ts` vérifie les mises à jour à chaque retour au premier plan et recharge tout seul ; le numéro de version (commit · date) s'affiche en bas de Réglages. `/code-review` du J1 fait le 19/09/2026.

**J2 et J3 validés le 21/09/2026** (J2 testé sur l'iPhone, J3 testé à la salle). Retour de la salle corrigé : à la barre libre, la charge part de 20 kg et ne descend plus en dessous (`minWeight` / `stepWeight` dans `src/lib/progression.ts`). Séance complète pilotée dans Chrome le 21/09/2026 (script puppeteer-core hors dépôt) : frictions relevées pour le J4, voir ci-dessous.

**J1 validé le 21/09/2026.** Le message iOS du mode avion reste, limite acceptée par l'utilisateur : une fois l'app installée, la seule requête réseau à l'ouverture est `sw.js`, faite par le navigateur lui-même (vérification de mise à jour prévue par la norme des service workers, même JavaScript désactivé) ; impossible à supprimer depuis l'app. **J1, J2 et J3 sont tous validés.**

**J4 (minuteur de repos) codé le 21/09/2026**, pas encore validé : repos lancé à la validation d'une série, écrans repos actif / prolongé / terminé, « +15 s » (animé depuis l'écran de fin), barre « Séance en cours » au-dessus des onglets, son, écran gardé allumé, vibration (Android), Réglages (repos par défaut, son, pas de charge par variante). Vérifié en local (82 tests ; cycle complet piloté dans Chrome, thèmes clair et sombre). **Reprendre ici** : test sur l'iPhone à la salle — le son sonne-t-il (bouton silencieux désactivé) ? l'écran reste-t-il allumé pendant le repos ? le décompte est-il juste après verrouillage ? — puis `/code-review` du J4, puis J5 (programmes).

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

À ajouter avec les jalons concernés : date-fns (J6) · Recharts (J7).

Notes :
- **Tailwind v4 n'a pas de `tailwind.config.js`** : les tokens sont dans `src/index.css` (variables `--sx-*` par thème + `@theme`). Classes disponibles : `bg-bg`, `bg-surface`, `bg-surface-2`, `border-border`, `border-border-strong`, `text-text`, `text-muted`, `text-faint`, `bg-accent`/`text-on-accent`, `accent-2`, `inverse`/`on-inverse`/`on-inverse-muted`, `hero-action`, `danger`, tailles `text-caption` … `text-display` et `text-num-s` … `text-num-hero`, utilitaire `num` (chiffres tabulaires).
- **L'app vit sous `/Sportix/`** (`base` de `vite.config.ts`, `basename` du routeur) : en dev, ouvrir `http://localhost:5173/Sportix/`.
- Routes dans `src/routes.tsx` ; `src/App.tsx` = layout racine (contenu + `BottomNav`, zones de sécurité iPhone via `env(safe-area-inset-*)`).
- **Icônes PWA** générées au build depuis `public/icon.svg` (`pwa-assets.config.ts`) ; les PNG produits dans `public/` sont ignorés par Git.
- Service worker : pas de doublon dans `workbox.globPatterns` (le manifest est déjà ajouté par le plugin) — un doublon fait échouer toute la mise en cache hors ligne.
- **Base de données** : `src/db/schema.ts` (Dexie — version 1 : `exercises` ; version 2 (J3) : `sessions` et `sets` ; version 3 (J4) : `settings`), `seed.ts` (32 exercices insérés au premier lancement), `exercises.ts` et `sessions.ts` (lecture/écriture), `persist.ts` (stockage persistant). Les fonctions d'accès acceptent une base en dernier paramètre, ce qui permet de les tester avec `fake-indexeddb` (`src/db/db.test.ts`). **Toute évolution du schéma = une nouvelle `db.version(n)`**, jamais une modification d'une version publiée.
- **Suppression d'un exercice = suppression « douce »** (`deletedAt`) : il disparaît des listes mais reste en base pour l'historique des séances.
- Les écrans lisent la base avec `useLiveQuery` (voir `src/features/exercises/useExercises.ts` et `src/features/sessions/useSession.ts`) : l'affichage se met à jour tout seul.
- **Règles de la séance dans `src/lib/`** : `sessions.ts` (regroupement par exercice, volume — ×2 pour les haltères —, durées, formats français), `progression.ts` (pas de charge par variante, pré-remplissage et double progression de `docs/design/parcours.md` § 2), `records.ts` (record = charge max par exercice **et** variante ; reps pour le poids du corps). Les composants ne calculent pas.
- **Séance en cours** = séance sans `endedAt` ; une seule à la fois, retrouvée au lancement. « Terminer » supprime les séries non faites. Les onglets sont masqués sous `/seance` (`src/App.tsx`).
- **Repos (J4)** : `session.rest` = `{ endsAt, duration, extended? }` (`src/lib/rest.ts`), jamais de décompte. `validateSetAndRest` valide la série et lance le repos dans une seule transaction (et remplit les séries suivantes encore vides du même exercice). L'alarme (son, vibration, Wake Lock) est montée dans `App.tsx` via `useRestAlarm`, pour marcher depuis n'importe quel onglet ; elle ne sonne que si la fin est vue « en direct » (`shouldRing`). Le son (Web Audio, `src/features/timer/sound.ts`) doit être déverrouillé pendant un geste : `unlockAudio()` à l'appui sur « Valider la série ».
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
