---
target: 3 directions D3
total_score: 22
max_score: 36
na_heuristics: 9
p0_count: 1
p1_count: 2
target_identity: "file:C:\\Users\\a2v-b\\_Antonin\\_perso\\dev\\design\\directions-d3"
timestamp: 2026-09-18T11-53-07Z
slug: design-directions-d3
---
# Critique D3 — Directions Nuit / Énergie / Clair (Sportix)

Méthode : double évaluation (A revue de design, B détecteur + contrastes), indépendantes.

## Heuristiques (design commun) — 22/36 (9 = n/a, aucun état d'erreur dessiné)
1 État du système 3 · 2 Monde réel 3 · 3 Contrôle 3 · 4 Cohérence 2 · 5 Prévention 2 · 6 Reconnaissance 3 · 7 Efficacité 2 · 8 Minimalisme 2 · 9 n/a · 10 Aide 2

## Spécificité
Nuit : cliché « fitness dark + lime » mais le plus adapté au terrain (fin de repos 15:1). Énergie : la seule qui semble conçue pour ce produit (affiche sportive, carte du jour inversée, jaune réservé à la progression). Clair : interchangeable (appli santé), hiérarchie plate, signal de fin de repos faible. Aucune ne donne de signature à la périodisation (bande de 6 px).
Détecteur : 19 constats (12 cramped-padding, faux positifs sur les pavés −/+ et en partie sur les lignes d'exercices ; 3 repeating-stripes-gradient, avis de style ; 4 low-contrast réels sur Repos terminé Énergie et Clair). Nuit : aucun constat de contraste.

## Problèmes prioritaires
- [P0] Chiffres de séance illisibles à 1 m (28 px saisie, 22 px lignes, Clair en graisse 500). → 44–48 px gras, chiffres étroits.
- [P1] Repos terminé : le héros est « 0:00 » ; la série suivante (17–22 px) et « Repos terminé » (14 px) sont petits. → série suivante en héros 56–64 px ; « Reprendre » → « Série 3 ».
- [P1] Accent surchargé de sens (pastille, série en cours, bouton, PR, jours, fin de repos). → réserver l'aplat au bouton principal et à la fin de repos.
- [P2] Contrastes : Énergie PR orange 3,08–3,34, série à venir 3,96, texte secondaire fin de repos 4,35 ; Clair série à venir 3,58, texte fin de repos 4,02, faux gras DM Mono ; Nuit n° série à venir 4,35 ; bordures des pavés et cercles 1,2–1,5 (seuil 3:1).
- [P2] Périodisation invisible (bande 6 px, semaine en cours moins visible que la semaine faite, hachures deload invisibles).
- [P3] « Terminer » 44 px ; pastilles d'exercices coupées sans indice de défilement ; textes 11 px (jours, badge ↑, onglets).

## Personas
Casey : Terminer 44 px, pastilles coupées, ligne en cours aussi forte que Valider. Sam : contrastes, état des séries par la couleur seule (Nuit : deux gris proches), bordures invisibles. Pratiquant à 1 m : rien de lisible en séance hormis « Squat » ; fin de repos : sait que c'est fini, pas quoi faire.

## Recommandation
Base Nuit + deux emprunts à Énergie (chiffres étroits et gras, 2e accent réservé à la progression / PR, carte du jour inversée). Écarter Clair. Si rendu clair voulu : Énergie corrigée.
