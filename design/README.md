# Design de Sportix

Référence visuelle du projet (voir [`docs/PHASE-D.md`](../docs/PHASE-D.md)). Les canvas sont des Artifacts privés sur claude.ai. Pour les retrouver : `/artifacts` dans le terminal Claude Code, ou `claude.ai/code/artifacts`.

## Canvas

| Étape | Canvas | Statut | Sources |
|---|---|---|---|
| D2 — Wireframes | [Sportix — Wireframes D2](https://claude.ai/artifact/3rXpyQCzW36QrhRe4dw1m1) | Validé le 18/09/2026 | [`wireframes-d2/`](wireframes-d2/) |
| D3 — Directions visuelles | [Sportix — Directions D3](https://claude.ai/artifact/41NwjzST7hReMtjdy2jfyb) | Validé le 18/09/2026 | [`directions-d3/`](directions-d3/) |
| D4 — Design system | [Sportix — Design system D4](https://claude.ai/artifact/GiTgJ8PJXS3Psz1BkCaWej) | Validé le 19/09/2026 | [`design-system-d4/`](design-system-d4/) · [`tokens.md`](tokens.md) · [`icon.svg`](../public/icon.svg) |
| D5 — Maquettes MVP | [Sportix — Maquettes D5](https://claude.ai/artifact/97yLtU5WwzEf6hWSRHqJRq) | Validé le 19/09/2026 — **référence visuelle des jalons J1 à J4** | [`maquettes-d5/`](maquettes-d5/) |
| J5 — Programmes | [Sportix — Maquettes J5](https://claude.ai/artifact/YVb56UsegHkqsWQcj4eFQK) | Validé le 21/09/2026 — **référence du J5** (séance « en liste », accueil façon Lyfta) | [`maquettes-j5/`](maquettes-j5/) |
| J6 — Calendrier des blocs | [Sportix — Maquettes J6](https://claude.ai/artifact/9KuXG1SEWTr4adp429qfNB) | Écran principal choisi le 21/09/2026 (vue mensuelle) ; **reste à valider** | [`maquettes-j6/`](maquettes-j6/) |

Les planches D5, J5 et J6 sont produites par [`maquettes-d5/generer.mjs`](maquettes-d5/generer.mjs) (les J5 dans `maquettes-j5/`, les J6 dans `maquettes-j6/`, chacun avec son `canvas.json`) : chaque écran y est décrit une fois, puis généré dans les deux thèmes à partir des tokens (`node design/maquettes-d5/generer.mjs`). Les planches `S-…` sont en thème sombre, `C-…` en clair ; `Main.dc.html` est l'accueil sombre.

Les fichiers de `wireframes-d2/`, `directions-d3/` et `design-system-d4/` sont une **copie** des sources du canvas, faite au moment de la publication. En cas d'écart, le canvas en ligne fait foi : si tu le retouches directement dans la page, je relis le canvas avant de modifier quoi que ce soit.

## Choix de design

- **D2** : 14 planches au format iPhone 14 (390×844 ; Stats et Réglages sont des pages plus hautes, qui défilent).
  - **Accueil** (refait le 18/09) : la carte « Séance du jour » domine (aperçu des exercices + gros bouton Démarrer en bas) ; bloc actif sur une ligne fine ; semaine en 7 pastilles ; poids en petit dans l'en-tête ; bouton « Séance libre » secondaire.
  - **Séance en cours** (refaite le 18/09, validée) : onglets masqués ; pastilles d'exercices en haut ; séries dont l'état se lit à la couleur de la ligne (faite / en cours / à venir), sans case à cocher ; barre de progression de la séance au milieu ; pavé Charge et Reps (chacun ses −/+, fourchette de reps affichée) ; bouton « Valider » séparé, en bas. Pas de repère « dernière fois » : les valeurs sont pré-remplies.
  - **Mode Play** : les onglets et les boutons principaux sont cliquables.
- **D3** (validé le 18/09/2026) : **deux thèmes, choisis automatiquement selon le réglage clair/sombre de l'iPhone** (`prefers-color-scheme`).
  - **Sombre = A · Nuit + Énergie** : fond #0E0F0C, surfaces #181A16, texte #F2F3EE ; citron #C6F432 réservé à l'action principale et à la fin de repos ; orange #FF8A4C pour la progression ↑ et les PR ; neutre inversé (#F2F3EE) pour « en cours » et la carte du jour. Police Archivo, chiffres en Archivo étroit (largeur 72 %).
  - **Clair = B · Énergie corrigée** : fond crème #FFF4E8, encre #1A1030 ; orange #FF4B1F (texte encre) réservé à l'action principale et à la fin de repos ; jaune #FFD23F pour la progression et les PR ; encre inversée pour « en cours » et la carte du jour. Barlow Condensed (titres en capitales, chiffres) + Barlow.
  - Règles communes issues de la critique impeccable (validées une par une) : chiffres de saisie en 38 px étroits et gras, blocs −/+ de 60 px ; fin de repos = la série suivante en héros (« Squat · série 3 », « 102,5 kg » en 104 px, bouton « C'est parti ») ; contrastes AA partout (contours ≥ 3:1, texte ≥ 4,5:1, 12 px minimum) ; séries à venir en pointillés ; bloc en barre fine S1…S5 avec « S2 » (en cours) et « D » (deload) ; « Terminer » en lien discret ; pas d'étiquette au-dessus des titres ; carte du jour avec les 5 exercices.
  - Polices : tranché en D4, une seule police pour les deux thèmes, **SF Pro** (police système Apple ; Inter en aperçu sur le canvas). Reste à régler au J1 : la barre d’état iOS sur la fin de repos.

- **D4** (validé le 19/09/2026) : tokens de `tokens.md` et composants acceptés tels quels. **Icône** : disque de fonte vu de face (trois poignées, trou central), orange `#FF4B1F` sur fond encre `#1A1030`. Une seule icône pour les deux thèmes (une PWA iOS n'en a qu'une). Les variantes écartées restent visibles sur la planche « Icône — variantes du disque ».

- **D5** (en relecture) — **Accueil**, validé le 19/09/2026 : trois états qui gardent tous la structure D3 (en-tête, ligne fine, semaine en pastilles, grande carte inversée avec le bouton « Démarrer la séance » en bas).
  - *Premier lancement* : ligne fine « Installer Sportix », carte « Première séance » avec 3 étapes numérotées (à revoir plus tard si besoin).
  - *J3, sans programme* : ligne fine « dernière séance » vers l'historique, carte « Séance libre » listant les dernières charges par exercice (↑ si hausse prévue).
  - *Complet (J5–J7)* : celui de D3 (poids, bloc, séance du jour, bouton secondaire « Séance libre »).
- **D5 — reste de la page J3**, validé le 19/09/2026 sans retouche. Choix entérinés : séance libre désignée par ses exercices dans l'historique (« Squat, Presse à cuisses +3 ») ; fin de séance avec carte inversée des records et « La prochaine fois : +2,5 kg » ; onglets masqués sur tous les écrans de séance.
- **D5 — pages J2 (exercices) et Réglages**, validées le 19/09/2026 sans retouche. Un exercice supprimé n'est plus proposé mais reste dans l'historique des séances passées. La bibliothèque étant pré-remplie, son état « vide » est la recherche sans résultat.
- **D5 — page J4 (repos)**, validée le 19/09/2026 sans retouche : repos actif (chrono 88 px, carte « Ensuite », +15 s / Passer), repos terminé plein écran (accent), repos prolongé, barre compacte « séance en cours » au-dessus des onglets quand la séance est réduite.

- **Retours du premier test sur iPhone (19/09/2026, J1)**, reportés dans le canvas D5 et `tokens.md` : barre d'onglets de 56 px posée 8 px plus bas que la zone de sécurité ; plus de titre ni de date en haut des accueils (seul l'accueil complet garde le poids, à droite).
- **Retours après le test à la salle (21/09/2026, J3)**, codés mais pas encore reportés dans le canvas D5 : à la barre libre la charge ne descend pas sous 20 kg ; toucher le nombre du pavé − / + ouvre le clavier numérique ; exercice fini → « + Série » et « + Exercice » (contour) au-dessus de « Terminer la séance », et terminer passe toujours par un panneau de confirmation (« Abandonner la séance » si aucune série n'est validée) ; « 3 séries » au lieu de « 3 × — reps » sans objectif ; la première fois sur un exercice n'est plus un record.
- **J4 codé (21/09/2026)** d'après la page J4 du canvas, avec ces précisions : la barre « Séance en cours » s'affiche sur tous les onglets (accueil compris), avec le chrono de la séance hors repos, le décompte et « +15 s » pendant le repos, et passe en couleur `rest` (« Repos terminé ») à la fin ; « Unité » et « Afficher le RPE » de la maquette Réglages attendent les jalons qui s'en servent ; le pas de charge se choisit parmi 0,5 / 1 / 1,25 / 2 / 2,5 / 5 kg ; le repos par défaut va de 0:15 à 10:00 par pas de 15 s. Retours du test iPhone (21/09/2026) : plus de mention « Son à la fin · l'écran reste allumé » sous le décompte ; à la fin du repos, l'aplat `rest` jaillit depuis le décompte (320 ms) ; « +15 s de repos » : l'aplat s'efface, le chrono grandit, la carte « Ensuite » se range (approche en CSS de l'animation décrite ci-dessous).

- **J6 (21/09/2026)** — 7 écrans × 2 thèmes. **Décisions prises le 21/09/2026** :
  - **L'onglet Calendrier est une vue mensuelle**, et elle seule : vrai calendrier, colonne S1/S2/… à gauche pour les semaines du bloc, jours du bloc sur fond plein, point sous les jours travaillés, case du jour cerclée, légende, et rappel du bloc en cours en bas. La variante « frise des blocs » est écartée, le sélecteur Frise / Mois retiré : on retrouve les autres blocs en changeant de mois.
  - **Un bloc commence un lundi et dure un nombre entier de semaines** : la semaine du bloc et celle du calendrier sont la même chose (S2 = du 21 au 27 septembre). C'est ce qui rend justes la barre S1…S5, le « semaine 2/5 » et la comparaison entre blocs du J7.
  - Retouches faites directement dans le canvas : le bloc en cours affiche « 6/15 séances » (faites / prévues) au lieu de « 6 séances faites · deload en semaine 4 » ; sur l'accueil, la ligne du bloc passe **sous** les chiffres de la semaine, juste avant la grande carte ; sur « Nouveau bloc », les dates calculées se lisent **au-dessus** du bouton « Créer le bloc ».
  - **Précisions prises en codant (22/09/2026)** : un nouveau bloc part du lundi de cette semaine, ou enchaîne sur la fin du dernier bloc ; 4 semaines sans deload par défaut, programme actif présélectionné ; une date choisie en milieu de semaine est ramenée au lundi ; « séances prévues » = jours du programme × semaines (sans programme : seulement le nombre de séances faites) ; « + Semaine de deload » ouvre d'abord un panneau pour choisir la place (après la semaine en cours par défaut) ; enregistrer un bloc qui en croise un autre ouvre un avertissement (« Enregistrer quand même » / « Changer les dates ») ; tous les blocs ont la même couleur dans la grille (deux blocs qui se suivent se distinguent par le retour à S1), légende en une seule entrée ; le rappel du bas montre le bloc en cours, sinon le prochain.
  - Autres écrans : calendrier vide, nouveau bloc (nom, objectif, premier jour, durée, deload, programme), nouvel objectif (panneau), détail d'un bloc (semaines, séances par semaine, « + Semaine de deload »), avertissement de chevauchement, accueil avec la ligne du bloc.

## Notes pour plus tard

- **Animation « +15 s après la fin du repos »** (idée du 18/09/2026, à dessiner en D5 et coder au J4) : si l'utilisateur touche « +15 s de repos » alors que le repos est déjà terminé, l'écran repasse en repos actif avec une transition animée. Le gros texte de la série suivante (« 102,5 kg ») rétrécit et le chrono grandit pour redevenir l'élément principal (0:15 qui décompte).

## Exports

Les PNG des planches validées vont dans [`exports/`](exports/).
