# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## État actuel du dépôt

**Sportix** est échafaudé (J0 terminé) : Vite + React + TypeScript, Tailwind CSS, React Router et Vitest sont en place, avec une page d'accueil « Hello Sportix » et une page « introuvable ». Prochaine étape : **Phase D** (design), dont le plan détaillé validé est dans [`docs/PHASE-D.md`](docs/PHASE-D.md) — reprendre à l'étape non cochée (D1, D2 et D3 faits, reprendre à D4 ; deux thèmes clair/sombre, voir `design/README.md`). Puis J1 (coquille PWA).

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

Installé (J0) : Vite 8 + React 19 + TypeScript 6 · Tailwind CSS v4 (plugin `@tailwindcss/vite`) · React Router v8 (paquet `react-router`, pas `react-router-dom`) · Vitest 5 · oxlint (linter du template Vite, config `.oxlintrc.json`). Node ≥ 24 (`.nvmrc`).

À ajouter avec les jalons concernés : `vite-plugin-pwa` (J1) · Dexie + `dexie-react-hooks` (J2) · date-fns (J6) · Recharts (J7).

Notes :
- **Tailwind v4 n'a pas de `tailwind.config.js`** : les tokens de `design/tokens.md` se déclarent dans un bloc `@theme { … }` de `src/index.css`.
- Routes déclarées dans `src/routes.tsx` (`createBrowserRouter`) ; `src/App.tsx` est le layout racine (`<Outlet />`), où viendra la BottomNav au J1.

## Commandes

```bash
npm run dev          # serveur de développement
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

Dépôt `Ninninp/sportix`, branche `main`. Le projet est travaillé depuis plusieurs machines : commencer par `git pull`, et pousser en fin de session de travail.
