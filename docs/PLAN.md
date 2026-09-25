# Plan — PWA de suivi musculation (usage perso, mobile)

## Contexte
Application personnelle installable sur téléphone pour suivre ses entraînements en salle.
Fonctionnalités voulues : séances & séries, programmes (routines), stats & progression,
minuteur de repos, et **calendrier de blocs de spécialisation** (périodisation : ex. bloc
« Force 4 sem. » → bloc « Hypertrophie 6 sem. »).
Contraintes : données **100 % locales** (hors-ligne), stack **React + Vite + TypeScript**,
développeur **débutant** → jalons courts, chacun livrant quelque chose d'utilisable.
Le design est traité comme une **phase dédiée (Phase D) avant le code**, puis comme la
**première étape de chaque jalon**.

## Outils
| Outil | Rôle dans le projet | Quand |
|---|---|---|
| **Claude Code** (app desktop, onglet Code) | Écrire le code, plan mode par jalon, tests, git, aperçu dans le Browser pane (émulation mobile), `/code-review`, `CLAUDE.md` via `/init` | J0 → J9 |
| **Claude Design** (canvas lancé depuis Claude Code) | Parcours, wireframes, direction visuelle, design system, maquettes haute fidélité ; retouche visuelle et export PNG/PDF (l'édition dépend du compte) | Phase D + début de chaque jalon |
| **Claude (chat, claude.ai)** | Questions métier : méthodologie des blocs, liste d'exercices à pré-remplir, formules (1RM, volume) | Phase D, J2, J6, J7 |
| **Figma** (gratuit, *optionnel*) | Seulement si tu veux retoucher finement à la main ou utiliser un kit UI iOS/Material. Le serveur MCP Figma permet à Claude Code de lire les maquettes. **Garder une seule source de vérité** : Claude Design *ou* Figma | Phase D si besoin |
| **GitHub** (+ GitHub Actions) | Versionner le code, déploiement automatique sur GitHub Pages | J0 → |
| **Netlify** (alternative) | Hébergement HTTPS en 1 clic avec aperçus par branche | J1 |
| **Lucide** (icônes), **Google Fonts** (ex. Inter) | Icônes et police cohérentes | Phase D, J1 |
| **@vite-pwa/assets-generator** | Générer toutes les icônes/splash de l'app à partir d'un seul SVG | J1 |
| **Chrome DevTools / Lighthouse**, `chrome://inspect` | Vérifier le manifest, le service worker, IndexedDB ; débogage à distance sur Android | Chaque jalon |

## Stack technique
| Besoin | Outil |
|---|---|
| Base | Vite + React + TypeScript |
| PWA (manifest, service worker, hors-ligne) | `vite-plugin-pwa` |
| Base de données locale | IndexedDB via **Dexie** + `dexie-react-hooks` (`useLiveQuery`) |
| Navigation | React Router |
| Style | Tailwind CSS, configuré avec les **tokens du design system** |
| Graphiques | SVG maison (`src/features/stats/charts.tsx`) ; Recharts écarté le 25/09/2026 |
| Dates / calendrier | `Date` natif (date-fns écarté le 21/09/2026) |
| Tests | Vitest (logique métier) |

## Modèle de données (Dexie)
> Mis à jour le 17/09/2026 après D1 (voir `docs/design/parcours.md` § 6) : variantes d'équipement, double progression, objectifs de bloc créés par l'utilisateur, semaines de deload, poids corporel.

- `exercises` : id, nom, groupe musculaire, type (charge/poids du corps/temps), variantes disponibles (barre/smith/haltères/machine/poulie)
- `programs` : id, nom, description
- `programDays` : id, programId, nom (ex. « Push »), ordre
- `programExercises` : id, programDayId, exerciseId, variante, séries cibles, repsMin, repsMax (fourchette de double progression), doubleProgression (booléen, vrai par défaut), repos (s)
- `blockGoals` : id, nom (créés par l'utilisateur ; « Force » fourni en exemple)
- `blocks` : id, nom, goalId, dateDébut, durée (semaines, deload compris), deloadWeeks (n° des semaines de deload), programId, notes
- `sessions` : id, date, programDayId?, blockId?, durée, notes
- `sets` : id, sessionId, exerciseId, variante, ordre, reps, charge, repsMin?, repsMax? (objectif en vigueur), RPE?, terminé
- `bodyWeights` : id, date, poids
- `settings` : unité (kg/lb), pas de charge par variante, repos par défaut, RPE affiché, objectifs perso (poids cible, séances/semaine ; plus d'objectif de séries par muscle depuis le 25/09/2026), version du schéma

## Structure du projet
```
CLAUDE.md      conventions, stack, lien vers les maquettes, « explique-moi en français, je débute »
docs/PLAN.md   ce plan
design/        exports PNG des maquettes + tokens.md (couleurs, typo, espacements)
src/
  db/          schema.ts (Dexie), seed.ts (exercices de base), backup.ts (export/import)
  features/    exercises/  sessions/  programs/  blocks/  stats/  timer/
  components/  UI partagée issue du design system : Button, Card, NumberStepper, SetRow, BottomNav, RestTimer
  lib/         calculs (1RM Epley, volume, PR), dates
  App.tsx, main.tsx, routes.tsx
```

---

## Cycle de travail pour chaque jalon
1. **Design** — maquetter les écrans du jalon dans le canvas Claude Design (ou vérifier qu'ils existent).
2. **Plan** — dans Claude Code, plan mode : « Implémente J3 selon le plan et les maquettes de `design/` ».
3. **Code + tests** — Claude Code écrit le code ; demande-lui d'expliquer chaque fichier pour apprendre.
4. **Vérification** — Browser pane en preset mobile, comparaison visuelle avec la maquette, Lighthouse.
5. **Relecture & livraison** — `/code-review`, commit, push → déploiement automatique.
6. **Test réel à la salle** — noter les frictions ; elles alimentent le design du jalon suivant.

## Jalons

### J0 — Préparation (½ journée) ✅ fait le 16/09/2026
> Vitest et oxlint ajoutés dès le J0 ; React Router est en v8 ; `CLAUDE.md` existait déjà (mis à jour au lieu de `/init`).
- Installer Node LTS, Git, VS Code ; créer un dépôt GitHub.
- Avec Claude Code : `npm create vite@latest` (react-ts), Tailwind, React Router, puis `/init` pour créer `CLAUDE.md`.
- **Objectif** : « Hello » s'affiche en local et le code est poussé sur GitHub.

### Phase D — Design de l'app (3–5 jours) 🎨 ✅ terminée le 19/09/2026
> Plan détaillé validé : [`PHASE-D.md`](PHASE-D.md) (cible iPhone 14, Claude Design seul). Résultat : deux thèmes automatiques clair/sombre, tokens dans [`design/tokens.md`](../design/tokens.md), icône [`public/icon.svg`](../public/icon.svg), maquettes MVP validées dans le canvas « Sportix — Maquettes D5 » (liens et choix dans [`design/README.md`](../design/README.md)).
- **D1. Parcours & écrans** (Claude chat / Claude Code) : liste des écrans et parcours clés : démarrer une séance → saisir une série → repos → terminer → voir le PR. Diagrammes Mermaid.
- **D2. Wireframes basse fidélité** (Claude Design) : 9 écrans clés au format téléphone (390×844) : Accueil, Séance en cours, Choix d'exercice, Historique, Programmes, Calendrier des blocs, Stats (vue d'ensemble), Stats d'un exercice, Réglages. Détail dans `docs/design/parcours.md`.
- **D3. Direction visuelle** : 2–3 variantes (ex. sombre à fort contraste, lisible en salle), en choisir une.
- **D4. Design system** : couleurs, typographie, espacements, arrondis ; composants Button, NumberStepper, SetRow, Card, BottomNav, RestTimer ; icône de l'app. Export dans `design/tokens.md`, repris dans la config Tailwind au J1.
- **D5. Maquettes haute fidélité du MVP** (écrans de J2 à J4). Règles d'ergonomie : cibles tactiles ≥ 48 px, actions principales dans la zone du pouce, gros chiffres lisibles à 1 m, contraste AA, utilisable en sueur et d'une main.
- (Optionnel) reprise dans Figma si tu veux affiner à la main.
- **Objectif** : maquettes MVP validées et tokens prêts. Le canvas devient la référence visuelle.

### J1 — Coquille PWA installable (1–2 jours) — ✅ validé le 21/09/2026 (testé sur l'iPhone)
> Hébergement : GitHub Pages (`https://ninninp.github.io/Sportix/`, `base: '/Sportix/'`). Icône source déplacée dans `public/icon.svg` (le générateur écrit les PNG à côté de la source). Hors-ligne vérifié en local (serveur coupé → l'app s'ouvre). Déployé et en ligne le 19/09/2026. Premier test iPhone : installé, marche en mode avion, barre d'état `default` gardée ; retours corrigés (barre d'onglets abaissée, accueil sans titre, service worker enregistré seulement avec du réseau contre le message iOS du mode avion). `/code-review` fait. Re-test iPhone du 21/09/2026 : le message iOS du mode avion reste ; mesuré : le navigateur revérifie `sw.js` à chaque ouverture, même sans JavaScript (norme des service workers), donc impossible à supprimer depuis l'app. Limite acceptée par l'utilisateur le 21/09/2026 (à la salle : données mobiles plutôt que mode avion).
- `vite-plugin-pwa` : manifest (nom, icônes générées depuis le SVG de D4, `display: standalone`, couleur du thème), service worker `autoUpdate`.
- Tokens du design system dans Tailwind ; composants de base (Button, Card, BottomNav) conformes aux maquettes.
- Barre de navigation en bas : Séance · Programmes · Calendrier · Stats · Réglages.
- Déploiement sur GitHub Pages ou Netlify.
- **Objectif** : l'app s'installe sur l'écran d'accueil et s'ouvre **en mode avion** avec le bon look.

### J2 — Base de données & exercices (2–3 jours) — ✅ validé le 21/09/2026 (testé sur l'iPhone)
> Dexie v1 (`exercises`), 32 exercices pré-remplis, bibliothèque (recherche sans accents, filtre par groupe, création, modification, suppression douce). Identifiants `crypto.randomUUID()`, stockage persistant demandé au navigateur. Variantes obligatoires seulement pour le type « charge ».
- Schéma Dexie + pré-remplissage d'une trentaine d'exercices (liste préparée avec Claude).
- Bibliothèque : lister, rechercher, ajouter, modifier, supprimer un exercice.
- **Objectif** : un exercice créé est toujours là après fermeture de l'app.

### J3 — Enregistrer une séance (MVP, 4–6 jours) ⭐ — ✅ validé le 21/09/2026 (test réel à la salle)
> Séance libre : ajout d'exercices (avec variante), séries pré-remplies avec la dernière fois, saisie au pavé − / +, validation immédiate, menu ⋯ (remplacer, variante, objectif, retirer), fin de séance avec records et proposition de charge, historique et détail. Record = charge max par exercice et variante. `/code-review` fait et corrigé, test de non-régression du rang d'exercice écrit. Retour de la salle : à la barre libre, la charge ne descend plus sous 20 kg (barre à vide, `minWeight` dans `src/lib/progression.ts`).
- Séance vide → ajout d'exercices → séries (reps, charge) avec NumberStepper +/−.
- Valeurs de la dernière séance reprises automatiquement ; double progression (objectif de reps, proposition d'augmenter la charge) ; remplacer un exercice ; cocher une série ; terminer ; historique.
- Sauvegarde automatique à chaque saisie.
- **Objectif** : **utiliser l'app pour de vrai à la salle** pendant 1 semaine.

### J4 — Minuteur de repos (1–2 jours) — code fait le 21/09/2026, à valider
> Repos = horodatage de fin enregistré dans la séance (`session.rest`, `src/lib/rest.ts`), lancé dans la même écriture que la validation de la série. Écrans repos actif / prolongé / terminé (plein écran `rest`), animation « +15 s » (View Transitions, iOS 18+), barre « Séance en cours » au-dessus des onglets. Son Web Audio déverrouillé au geste « Valider » (iOS : pas de son écran verrouillé, suit le bouton silencieux), Wake Lock pendant le repos, vibration Android. Réglages en base (Dexie v3, table `settings`) : repos par défaut (2:00), son, pas de charge par variante. Reste : test sur l'iPhone à la salle.
- Démarre en cochant une série ; +15 s / passer ; basé sur un horodatage de fin (reste juste écran verrouillé).
- Vibration (Android) + son ; Wake Lock pour garder l'écran allumé.
- **Objectif** : le timer reste exact après verrouillage/déverrouillage.
- Note : pas de vibration web sur iOS.

### J5 — Programmes / routines (3–4 jours) — ✅ validé le 21/09/2026
> Maquettes validées le 21/09/2026 (canvas « Sportix — Maquettes J5 »). Dexie v4 (`programs`, `programDays`, `programExercises`). Un seul programme actif (Réglages `activeProgramId`) ; séance du jour = jour suivant, dans l'ordre, le dernier fait (`nextDay`) ; « Autre séance » (jours + séance libre) ; démarrage = toutes les séries du jour créées et pré-remplies (`planDaySets`), repos par exercice, fourchette de reps seulement avec double progression (sinon reps fixes). Accueil façon Lyfta : séances / durée / volume de la semaine avec flèche d'évolution à date égale, pastilles des jours. Séance « en liste » (tableau N° · Dernière fois · Kg · Reps · ✓, exercices suivants repliés, pavé compact) pour toutes les séances. `/code-review` fait le 21/09/2026 : 8 remarques, toutes traitées (voir `CLAUDE.md`).
- **Design** : maquettes création de programme + lancement de séance.
- Programme → jours → exercices avec cibles ; « Démarrer la séance du jour ».
- **Objectif** : lancer une séance complète en 2 taps.

### J6 — Calendrier des blocs de spécialisation (4–5 jours) — maquettes validées le 21/09/2026, codé et validé le 22/09/2026
> Maquettes : canvas « Sportix — Maquettes J6 » (lien dans `design/README.md`), 7 écrans × 2 thèmes. Deux variantes ont été dessinées comme prévu, puis départagées le 21/09/2026 : **la vue mensuelle l'emporte**, la « frise des blocs » est écartée. Règle retenue : **un bloc commence un lundi et dure un nombre entier de semaines** (la semaine du bloc = la semaine du calendrier), deload facultatif. Dexie v5 (`blocks`, `blockGoals`) et `blockId` sur les séances. **date-fns abandonné** (décidé le 21/09/2026) : les calculs de semaines et la grille du mois tiennent en `Date` natif, comme `src/lib/week.ts` ; une dépendance de moins dans le bundle.
- **Design** : maquettes vue mensuelle, fiche bloc, bandeau « Bloc Force — semaine 2/4 ». ✅ fait (2 variantes, l'une retenue).
- Création/modification/suppression des blocs ; bloc actif sur l'accueil ; `blockId` sur les séances ; détection des chevauchements.
- **Objectif** : planifier 3 mois et voir où on en est d'un coup d'œil.

### J7 — Stats & progression (4–5 jours) — ✅ validé le 25/09/2026 (maquettes, code, test iPhone, `/code-review`)
> Maquettes : canvas « Sportix — Maquettes J7 » (7 écrans × 2 thèmes). Dexie v6 (`bodyWeights`), objectifs dans `settings`. Calculs dans `src/lib/stats.ts` et `src/lib/bodyWeight.ts` (testés), écrans dans `src/features/stats/`. **Recharts n'est pas utilisé** (décidé le 25/09/2026) : les maquettes demandent des choses qu'il fait mal ou pas (blocs en fond de leur couleur, semaines de deload hachurées, points creux hors de la courbe, bulle au toucher, graduations à droite) ; quelques composants SVG suffisent, suivent les deux thèmes par les variables CSS, et évitent une grosse dépendance dans une PWA hors ligne. Deload affiché mais exclu des courbes, moyennes et comparaisons ; records sur tout l'historique.
- **Design** : maquettes des graphiques (Claude Code suit sa skill `dataviz` pour des graphiques lisibles et cohérents).
- 1RM estimé (Epley), volume, PR 🏆, séries hebdo par muscle, comparaison entre blocs ; tests Vitest.
- Poids corporel (pesées, moyenne 7 jours) et séances/semaine, avec lignes d'objectif modifiables.
- **Objectif** : répondre à « ai-je progressé au squat pendant mon bloc force ? ».

### J8 — Sauvegarde & fiabilité (1–2 jours) — ✅ validé le 25/09/2026 (maquettes, code, test iPhone, `/code-review`)
> Maquettes : canvas « Sportix — Maquettes J8 ». Export d'un fichier JSON (toutes les tables + version de la base) par la feuille de partage d'iOS ; import qui **remplace** tout, dans une seule transaction, après une confirmation qui compare la sauvegarde et le téléphone ; fichier d'une version plus récente refusé. Rappel : pastille sur l'onglet Réglages (plus de 30 jours sans sauvegarde et des séances depuis), pas sur l'accueil. `navigator.storage.persist()` est demandé depuis le J2, sans affichage. Pas de migration Dexie nécessaire : les tables et champs ajoutés depuis le J2 sont facultatifs ; pour une sauvegarde ancienne, l'import refait ce que les mises à niveau auraient fait (v5 : l'objectif d'exemple « Force »).
- Export/import JSON (Web Share API), `navigator.storage.persist()`, rappel de sauvegarde, migrations Dexie.
- **Objectif** : changer de téléphone sans rien perdre.

### J9 — Finitions & revue design (continu)
- **Revue design** : captures de chaque écran (Browser pane) comparées aux maquettes ; corriger les écarts.
- Mode clair/sombre, kg/lb, supersets, échauffement, bannière « nouvelle version ».

### J10 — Animations (à la fin, une fois les écrans stabilisés)
> Décidé le 21/09/2026 : les animations se règlent quand tous les écrans sont en place, pour ne pas les refaire à chaque changement. D'ici là, seules des animations simples en CSS existent (fin de repos, « +15 s », `src/index.css`).
- Reprendre les animations du repos : fin du repos, « +15 s de repos » telle que décrite dans `design/README.md` (la charge rétrécit jusqu'à la carte « Ensuite », le chrono grandit à sa place).
- Transitions entre écrans (entrée / sortie de séance, panneaux), retour visuel à la validation d'une série, mise en valeur des records sur le récapitulatif.
- Durées et courbes des tokens (`design/tokens.md` § mouvement) ; « Réduire les animations » d'iOS respecté partout.
- Vérifier sur l'iPhone : fluidité, et rien ne reste affiché après une animation (voir la bande de la barre d'état, J4).
- **Objectif** : des animations qui aident à comprendre ce qui se passe, sans ralentir la saisie en salle.

## Ordre & durée indicative
J0 → **Phase D** → J1 → J2 → J3 (**MVP, ~3 semaines**) → J4 → J5 → J6 → J7 → J8 → J9 → J10.
Total ≈ 6–8 semaines à temps partiel.

## Vérification (à chaque jalon)
- `npm run dev` ; `npm run build && npm run preview` pour tester le mode PWA.
- Browser pane de Claude Code en preset mobile : comparaison avec la maquette.
- DevTools → Application (manifest, service worker, IndexedDB) ; Lighthouse.
- Test réel sur le téléphone via l'URL HTTPS ; test en mode avion.
- `npm test` (Vitest) pour les calculs et la logique des blocs.
