# Design de Sportix

Référence visuelle du projet (voir [`docs/PHASE-D.md`](../docs/PHASE-D.md)). Les canvas sont des Artifacts privés sur claude.ai. Pour les retrouver : `/artifacts` dans le terminal Claude Code, ou `claude.ai/code/artifacts`.

## Canvas

| Étape | Canvas | Statut | Sources |
|---|---|---|---|
| D2 — Wireframes | [Sportix — Wireframes D2](https://claude.ai/artifact/3rXpyQCzW36QrhRe4dw1m1) | Premier jet publié le 17/09/2026, en relecture | [`wireframes-d2/`](wireframes-d2/) |

Les fichiers de `wireframes-d2/` sont une **copie** des sources du canvas, faite au moment de la publication. En cas d'écart, le canvas en ligne fait foi : si tu le retouches directement dans la page, je relis le canvas avant de modifier quoi que ce soit.

## Choix de design

- **D2** : 14 planches au format iPhone 14 (390×844 ; Stats et Réglages sont des pages plus hautes, qui défilent).
  - **Accueil** (refait le 18/09) : la carte « Séance du jour » domine (aperçu des exercices + gros bouton Démarrer en bas) ; bloc actif sur une ligne fine ; semaine en 7 pastilles ; poids en petit dans l'en-tête ; bouton « Séance libre » secondaire.
  - **Séance en cours** (refaite le 18/09, validée) : onglets masqués ; pastilles d'exercices en haut ; séries dont l'état se lit à la couleur de la ligne (faite / en cours / à venir), sans case à cocher ; barre de progression de la séance au milieu ; pavé Charge et Reps (chacun ses −/+, fourchette de reps affichée) ; bouton « Valider » séparé, en bas. Pas de repère « dernière fois » : les valeurs sont pré-remplies.
  - **Mode Play** : les onglets et les boutons principaux sont cliquables.
- **D3** : direction visuelle, à venir.

## Exports

Les PNG des planches validées vont dans [`exports/`](exports/).
