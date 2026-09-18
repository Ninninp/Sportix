# Design de Sportix

Référence visuelle du projet (voir [`docs/PHASE-D.md`](../docs/PHASE-D.md)). Les canvas sont des Artifacts privés sur claude.ai. Pour les retrouver : `/artifacts` dans le terminal Claude Code, ou `claude.ai/code/artifacts`.

## Canvas

| Étape | Canvas | Statut | Sources |
|---|---|---|---|
| D2 — Wireframes | [Sportix — Wireframes D2](https://claude.ai/artifact/3rXpyQCzW36QrhRe4dw1m1) | Validé le 18/09/2026 | [`wireframes-d2/`](wireframes-d2/) |
| D3 — Directions visuelles | [Sportix — Directions D3](https://claude.ai/artifact/41NwjzST7hReMtjdy2jfyb) | Validé le 18/09/2026 | [`directions-d3/`](directions-d3/) |

Les fichiers de `wireframes-d2/` et `directions-d3/` sont une **copie** des sources du canvas, faite au moment de la publication. En cas d'écart, le canvas en ligne fait foi : si tu le retouches directement dans la page, je relis le canvas avant de modifier quoi que ce soit.

## Choix de design

- **D2** : 14 planches au format iPhone 14 (390×844 ; Stats et Réglages sont des pages plus hautes, qui défilent).
  - **Accueil** (refait le 18/09) : la carte « Séance du jour » domine (aperçu des exercices + gros bouton Démarrer en bas) ; bloc actif sur une ligne fine ; semaine en 7 pastilles ; poids en petit dans l'en-tête ; bouton « Séance libre » secondaire.
  - **Séance en cours** (refaite le 18/09, validée) : onglets masqués ; pastilles d'exercices en haut ; séries dont l'état se lit à la couleur de la ligne (faite / en cours / à venir), sans case à cocher ; barre de progression de la séance au milieu ; pavé Charge et Reps (chacun ses −/+, fourchette de reps affichée) ; bouton « Valider » séparé, en bas. Pas de repère « dernière fois » : les valeurs sont pré-remplies.
  - **Mode Play** : les onglets et les boutons principaux sont cliquables.
- **D3** (validé le 18/09/2026) : **deux thèmes, choisis automatiquement selon le réglage clair/sombre de l'iPhone** (`prefers-color-scheme`).
  - **Sombre = A · Nuit + Énergie** : fond #0E0F0C, surfaces #181A16, texte #F2F3EE ; citron #C6F432 réservé à l'action principale et à la fin de repos ; orange #FF8A4C pour la progression ↑ et les PR ; neutre inversé (#F2F3EE) pour « en cours » et la carte du jour. Police Archivo, chiffres en Archivo étroit (largeur 72 %).
  - **Clair = B · Énergie corrigée** : fond crème #FFF4E8, encre #1A1030 ; orange #FF4B1F (texte encre) réservé à l'action principale et à la fin de repos ; jaune #FFD23F pour la progression et les PR ; encre inversée pour « en cours » et la carte du jour. Barlow Condensed (titres en capitales, chiffres) + Barlow.
  - Règles communes issues de la critique impeccable (validées une par une) : chiffres de saisie en 38 px étroits et gras, blocs −/+ de 60 px ; fin de repos = la série suivante en héros (« Squat · série 3 », « 102,5 kg » en 104 px, bouton « C'est parti ») ; contrastes AA partout (contours ≥ 3:1, texte ≥ 4,5:1, 12 px minimum) ; séries à venir en pointillés ; bloc en barre fine S1…S5 avec « S2 » (en cours) et « D » (deload) ; « Terminer » en lien discret ; pas d'étiquette au-dessus des titres ; carte du jour avec les 5 exercices.
  - Point ouvert pour D4 : garder deux familles de polices (une par thème) ou unifier ; régler la barre d'état iOS pour la fin de repos (J1).

## Exports

Les PNG des planches validées vont dans [`exports/`](exports/).
