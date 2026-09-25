# Sportix

PWA personnelle de suivi d'entraînement en salle, pensée pour le téléphone (iPhone, installée sur l'écran d'accueil) et utilisable hors ligne, avec un calendrier de blocs de spécialisation (périodisation). Toutes les données restent sur l'appareil : aucun serveur, aucun compte.

**App en ligne : https://ninninp.github.io/Sportix/**
Pour l'installer sur iPhone : l'ouvrir dans Safari → Partager → « Sur l'écran d'accueil ».

## Ce que fait l'app

- **Bibliothèque d'exercices** : 32 exercices fournis, ajout, modification et suppression.
- **Séances** : séance libre ou tirée d'un programme, saisie série par série avec un pavé − / +, charges pré-remplies et double progression, records, récapitulatif et historique.
- **Minuteur de repos** : lancé à chaque série validée, juste même écran verrouillé, son en fin de repos, écran gardé allumé.
- **Programmes** : jours d'entraînement en rotation (A → B → A…), accueil avec les chiffres de la semaine.
- **Calendrier des blocs** : vue mensuelle, blocs colorés d'une durée en semaines avec objectif, programme et semaine de deload facultative ; les séances sont rattachées au bloc en cours.
- **Stats** : progression par exercice (1RM estimé, charges, volume), records, séances par semaine, séries par muscle, comparaison de deux blocs, suivi du poids de corps et objectifs.
- **Sauvegarde** : export des données dans un fichier JSON (partage iOS ou téléchargement) et import ; une pastille rappelle de sauvegarder.

## Avancement

Jalons J1 à J8 codés et validés sur l'iPhone, sauf le son du minuteur (J4) qui reste à tester. Prochain jalon : **J9, finitions et revue design**. Le détail est dans [`docs/PLAN.md`](docs/PLAN.md), la source de vérité du projet.

## Démarrer

Prérequis : Node 24 (voir `.nvmrc`).

```bash
npm install          # installe les dépendances
npm run dev          # lance l'app en local → http://localhost:5173/Sportix/
npm test             # lance les tests (npm test -- --run pour une seule exécution)
npm run lint         # vérifie le code (oxlint)
npm run build        # vérifie TypeScript et construit la version de production dans dist/
npm run preview      # sert dist/ — pour tester le mode hors ligne (service worker)
```

Chaque push sur `main` relance lint, tests et build, puis redéploie l'app sur GitHub Pages (`.github/workflows/deploy.yml`).

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · React Router · Dexie (IndexedDB) · `vite-plugin-pwa` · Vitest. Graphiques en SVG maison, dates en `Date` natif.

## Organisation du code

```
src/lib/         calculs purs et testés (progression, records, repos, semaines, blocs, stats, sauvegarde)
src/db/          base Dexie : schéma et migrations versionnées, lecture/écriture, export/import
src/features/    écrans par fonctionnalité : exercises, sessions, timer, programs, home, blocks, stats, backup, settings
src/components/  composants d'interface partagés (boutons, cartes, pavés − / +, barre d'onglets…)
design/          tokens de design, maquettes et liens des canvas
docs/            plan du projet et phase de design
```

Les règles de développement (conventions, pièges connus) sont détaillées dans [`CLAUDE.md`](CLAUDE.md).
