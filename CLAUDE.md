# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## État actuel du dépôt

**Sportix** n'est pas encore échafaudé : le dépôt ne contient que `README.md`, `.gitignore` (modèle Node) et `docs/PLAN.md`. Il n'y a ni `package.json`, ni `src/`, ni dépendances installées.

Avant toute action, **lire [`docs/PLAN.md`](docs/PLAN.md)** : c'est la source de vérité du projet (contexte, stack, modèle de données, jalons J0 → J9). Toute décision d'architecture doit s'y conformer ou mettre le plan à jour explicitement.

## Contexte du projet

PWA personnelle de suivi d'entraînement en salle, utilisée sur téléphone (installée sur l'écran d'accueil, utilisable hors-ligne). Spécificité par rapport aux apps du genre : un **calendrier de blocs de spécialisation** (périodisation — un bloc = un objectif + une date de début + une durée en semaines + un programme associé), auquel les séances sont rattachées pour comparer la progression d'un bloc à l'autre.

Contraintes structurantes :
- **Aucun backend, aucune donnée hors de l'appareil.** Tout est en IndexedDB (Dexie). La synchronisation multi-appareils n'est pas au programme ; la portabilité des données passe par un export/import JSON (jalon J8).
- **Mobile-first strict**, conçu pour une utilisation en salle : cibles tactiles ≥ 48 px, actions principales dans la zone du pouce, chiffres lisibles à 1 m, usage à une main.
- Le **design précède le code** : les maquettes (Claude Design, exportées dans `design/`) et les tokens de `design/tokens.md` font foi pour l'UI ; la config Tailwind dérive de ces tokens.

## Communication

L'auteur est **débutant en développement web** et travaille **en français**. Répondre en français, expliquer les choix et le rôle des fichiers créés plutôt que livrer du code sans commentaire.

## Stack prévue (à mettre en place au jalon J0/J1)

Vite + React + TypeScript · `vite-plugin-pwa` · Dexie + `dexie-react-hooks` · React Router · Tailwind CSS · Recharts · date-fns · Vitest.

Une fois le projet échafaudé, les commandes seront :

```bash
npm run dev          # développement
npm run build        # build de production
npm run preview      # tester le service worker / mode PWA (ne fonctionne pas en dev)
npm test             # Vitest
npm test -- src/lib/oneRepMax.test.ts   # un seul fichier de test
```

Tenir cette section à jour lors du J0 (scripts réels de `package.json`).

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
