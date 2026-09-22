# Tokens de Sportix (D4)

Source de vérité des couleurs, de la typographie, des espacements, des arrondis et des mouvements. **Toute couleur change d'abord ici**, puis dans `src/index.css` et le canvas.

Deux thèmes, choisis automatiquement selon le réglage de l'iPhone (`prefers-color-scheme`) :
- **clair** = « Énergie corrigée » (crème, encre, orange) ;
- **sombre** = « Nuit + Énergie » (quasi noir, citron, orange).

Les noms de tokens sont les **mêmes dans les deux thèmes** : un composant écrit `bg-surface` ou `text-muted` et prend automatiquement la bonne couleur.

Canvas de référence : [Sportix — Design system D4](https://claude.ai/artifact/GiTgJ8PJXS3Psz1BkCaWej).

## 1. Couleurs (par rôle)

| Token | Rôle | Clair | Sombre |
|---|---|---|---|
| `bg` | Fond de l'écran | `#FFF4E8` | `#0E0F0C` |
| `surface` | Cartes, pavé de saisie, barre d'onglets (clair) | `#FFFFFF` | `#181A16` |
| `surface-2` | Fond des boutons −/+, séries faites, zones enfoncées | `#FFE8D2` | `#23261F` |
| `border` | Contour décoratif des cartes (pas d'exigence de contraste) | `#E8C9AA` | `#2E322B` |
| `border-strong` | Contours qui portent une information : pavé −/+, séries à venir, cercles des jours, barres | `#9C8672` | `#6B6F66` |
| `text` | Texte principal, chiffres | `#1A1030` | `#F2F3EE` |
| `text-muted` | Texte secondaire (sous-titres, unités, libellés) | `#5E5470` | `#A3A79C` |
| `text-faint` | Valeurs des séries à venir | `#6B6280` | `#8A8E83` |
| `accent` | **Action principale** (Valider, Démarrer, C'est parti) **et fin de repos** — rien d'autre | `#FF4B1F` | `#C6F432` |
| `on-accent` | Texte posé sur `accent` | `#1A1030` | `#0E0F0C` |
| `accent-2` | **Progression ↑ et PR** — rien d'autre | `#FFD23F` | `#FF8A4C` |
| `on-accent-2` | Texte posé sur `accent-2` | `#1A1030` | `#0E0F0C` |
| `inverse` | « Ici, maintenant » : série en cours, pastille d'exercice active, semaine en cours, carte « Séance du jour » | `#1A1030` | `#F2F3EE` |
| `on-inverse` | Texte posé sur `inverse` | `#FFFFFF` | `#0E0F0C` |
| `on-inverse-muted` | Texte secondaire sur `inverse` | `#C9C2D6` | `#4A4E45` |
| `hero-action` | Bouton principal posé sur une carte `inverse` | `#FF4B1F` | `#0E0F0C` |
| `on-hero-action` | Texte de ce bouton | `#1A1030` | `#C6F432` |
| `danger` | Supprimer, abandonner la séance | `#B42318` | `#FF6B5E` |
| `on-danger` | Texte posé sur `danger` | `#FFFFFF` | `#0E0F0C` |
| `block-sable` | Couleur de bloc « sable » (J6) | `#FFE8D2` | `#23261F` |
| `block-orange` | Couleur de bloc « orange » (J6) | `#FFD3BF` | `#4A2616` |
| `block-jaune` | Couleur de bloc « jaune » (J6) | `#FFEBA3` | `#3F3A12` |
| `block-vert` | Couleur de bloc « vert » (J6) | `#D4EDC4` | `#1E3A1C` |
| `block-bleu` | Couleur de bloc « bleu » (J6) | `#CFE0F7` | `#1A2B45` |
| `block-violet` | Couleur de bloc « violet » (J6) | `#E3D6F5` | `#33224D` |
| `block-rose` | Couleur de bloc « rose » (J6) | `#F8D0DF` | `#4A1F33` |

**Couleurs des blocs (ajoutées le 22/09/2026, J6)** : chaque bloc du calendrier a la sienne, choisie à sa création, pour voir d'un coup d'œil où finit un bloc et où commence le suivant, et deux blocs qui se chevauchent (jour coupé en deux couleurs). Teintes pâles en clair, sourdes en sombre : `text` y fait 10,3 à 15,3:1 et `text-muted` 4,7 à 6,3:1 ; `text-faint` pouvant descendre à 3,4:1, les jours hors du mois posés sur un bloc passent en `text-muted`. `sable` = `surface-2` (couleur par défaut, et celle des blocs créés avant). Les pastilles de choix de couleur ont un contour `border-strong` (les teintes seules ne font que 1,1 à 1,7:1 contre le fond).
| `rest-bg` | Fond plein écran de la fin de repos (= `accent`) | `#FF4B1F` | `#C6F432` |
| `on-rest` | Tout le texte, les contours et le bouton sur la fin de repos | `#1A1030` | `#0E0F0C` |

Règles d'usage :
- **Un seul aplat `accent` par écran** : le bouton principal. L'écran de fin de repos est l'exception voulue (tout l'écran).
- **État d'une série** : faite = fond `surface-2` + texte `text-muted` ; en cours = fond `inverse` + texte `on-inverse` ; à venir = contour **pointillé** `border-strong` + texte `text-faint`. Jamais de coche.
- La couleur ne porte jamais seule une information : un second indice (pointillés, étiquette « S2 » / « D », icône) l'accompagne.

### Contrastes vérifiés (WCAG 2.1)

Texte : 4,5:1 minimum (3:1 à partir de 24 px, ou 18,66 px en gras). Contours et icônes : 3:1.

| Couple | Clair | Sombre |
|---|---|---|
| `text` sur `bg` | 16,7 | 17,2 |
| `text` sur `surface` | 18,1 | 15,7 |
| `text` sur `surface-2` | 15,3 | 13,8 |
| `text-muted` sur `bg` | 6,5 | 7,8 |
| `text-muted` sur `surface` | 7,1 | 7,2 |
| `text-muted` sur `surface-2` | 6,0 | 6,3 |
| `text-faint` sur `surface` | 5,7 | 5,2 |
| `on-accent` sur `accent` | 5,4 | 15,0 |
| `on-accent-2` sur `accent-2` | 12,5 | 8,2 |
| `on-inverse` sur `inverse` | 18,1 | 17,2 |
| `on-inverse-muted` sur `inverse` | 10,5 | 7,6 |
| `danger` sur `surface` | 6,6 | 6,3 |
| `on-danger` sur `danger` | 6,6 | 6,9 |
| `border-strong` sur `surface` (contour) | 3,5 | 3,4 |
| `border-strong` sur `bg` (contour) | 3,2 | 3,8 |
| `accent` sur `bg` (bord du bouton) | 3,1 | 15,0 |

## 2. Typographie

**Police : SF Pro, la police système d'Apple**, appelée par la pile système. Rien à télécharger : l'app marche hors ligne dès le premier lancement et a le rendu d'une app iOS native.

```
--font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, "Inter", "Segoe UI", sans-serif;
```

Sur iPhone, Safari choisit seul SF Pro Text (petites tailles) ou SF Pro Display (grandes tailles). Hors Apple (canvas vu sur PC), c'est **Inter** qui s'affiche : le canvas la charge uniquement pour que les maquettes ressemblent au rendu iPhone. L'app ne la charge pas.

**Chiffres** : toujours `font-variant-numeric: tabular-nums` (tous les chiffres ont la même largeur, les colonnes ne bougent pas quand une valeur change) et graisse 700.

| Token | Taille / interligne | Graisse | Usage |
|---|---|---|---|
| `text-caption` | 12 / 16 | 600 | Onglets, jours, badges, libellés de champ (CHARGE, REPS en capitales, espacement 0,06em) — **12 px est le minimum de l'app** |
| `text-small` | 13 / 18 | 400–600 | Compteurs secondaires (« 1 / 15 séries ») |
| `text-body` | 15 / 20 | 400–600 | Texte courant, sous-titres |
| `text-body-strong` | 17 / 22 | 600 | Noms d'exercices dans les listes, « Squat · série 3 » |
| `text-title` | 22 / 26 | 700 | Titres de section |
| `text-title-l` | 28 / 32 | 800 | Titre d'écran (« Squat »), titre de carte (« Force A — Jambes ») |
| `text-display` | 34 / 38 | 800 | « Sportix » sur l'accueil |
| `num-s` | 18 / 22 | 700 | Chiffres dans les listes (3 × 4–6, 102,5 kg) |
| `num-m` | 22 / 26 | 700 | Lignes de séries |
| `num-l` | 38 / 40 | 700 | Charge et reps du pavé de saisie (validé en D3) |
| `num-xl` | 88 / 88 | 700 | Décompte du repos actif |
| `num-hero` | 104 / 100 | 700 | Charge de la série suivante sur la fin de repos |

Espacement des lettres : `-0.02em` à partir de 28 px, 0 en dessous.

## 3. Espacements, tailles, arrondis

Grille de 4 px.

| Token | Valeur | Usage |
|---|---|---|
| `space-1` | 4 px | Entre deux lignes de séries |
| `space-2` | 8 px | Dans un groupe (icône + texte, pastilles) |
| `space-3` | 12 px | Entre deux blocs d'un écran |
| `space-4` | 16 px | Marge latérale de l'écran, padding des cartes |
| `space-6` | 24 px | Séparation forte |
| `touch-min` | 48 px | Hauteur minimale de toute cible tactile |
| `row` | 48 px | Ligne de série |
| `stepper` | 60 px | Bloc −/+ (boutons de 56 px de large) |
| `button` | 56 px | Bouton principal (Valider, +15 s…) |
| `button-hero` | 60 px | Démarrer la séance, C'est parti |
| `nav` | 56 px | Barre d'onglets (posée 8 px sous la zone de sécurité : `max(0px, env(safe-area-inset-bottom) - 8px)` en dessous) |
| `safe-top` / `safe-bottom` | `env(safe-area-inset-top)` / `env(safe-area-inset-bottom)` | ≈ 47 / 34 pt sur l'iPhone 14 |

| Token | Valeur | Usage |
|---|---|---|
| `radius-sm` | 8 px | Lignes de séries, segments du bloc, badges |
| `radius-md` | 12 px | Boutons, blocs −/+ |
| `radius-lg` | 16 px | Cartes, feuille du menu ⋯ (coins du haut) |
| `radius-pill` | 999 px | Pastilles d'exercices, badges ↑ / PR |

**Élévation** : l'app est plate. Les cartes ont un contour `border`, sans ombre. Seule la feuille qui monte du bas (menu ⋯, pesée) a une ombre : `0 -8px 24px rgb(0 0 0 / 0.25)`, avec un voile `rgb(0 0 0 / 0.5)` derrière.

## 4. Mouvement

| Token | Valeur | Usage |
|---|---|---|
| `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Toutes les entrées |
| `duration-fast` | 120 ms | Appui sur un bouton (léger enfoncement, `scale(0.97)`) |
| `duration-base` | 200 ms | Changement d'état d'une série, remplissage de la barre de progression |
| `duration-slow` | 320 ms | Passage à l'écran de fin de repos, animation « +15 s » (voir `README.md`) |

Avec le réglage iOS « Réduire les animations » (`prefers-reduced-motion`), toutes les durées passent à 0 sauf les fondus.

## 5. À recopier au J1 dans `src/index.css` (Tailwind v4)

```css
@import "tailwindcss";

/* Valeurs du thème clair, remplacées par celles du thème sombre si l'iPhone est en mode sombre */
:root {
  color-scheme: light dark;
  --sx-bg: #FFF4E8; --sx-surface: #FFFFFF; --sx-surface-2: #FFE8D2;
  --sx-border: #E8C9AA; --sx-border-strong: #9C8672;
  --sx-text: #1A1030; --sx-text-muted: #5E5470; --sx-text-faint: #6B6280;
  --sx-accent: #FF4B1F; --sx-on-accent: #1A1030;
  --sx-accent-2: #FFD23F; --sx-on-accent-2: #1A1030;
  --sx-inverse: #1A1030; --sx-on-inverse: #FFFFFF; --sx-on-inverse-muted: #C9C2D6;
  --sx-hero-action: #FF4B1F; --sx-on-hero-action: #1A1030;
  --sx-danger: #B42318; --sx-on-danger: #FFFFFF;
  /* Couleurs des blocs (J6) : fond des jours du calendrier, pastille du bloc */
  --sx-block-sable: #FFE8D2; --sx-block-orange: #FFD3BF; --sx-block-jaune: #FFEBA3; --sx-block-vert: #D4EDC4;
  --sx-block-bleu: #CFE0F7; --sx-block-violet: #E3D6F5; --sx-block-rose: #F8D0DF;
}
@media (prefers-color-scheme: dark) {
  :root {
    --sx-bg: #0E0F0C; --sx-surface: #181A16; --sx-surface-2: #23261F;
    --sx-border: #2E322B; --sx-border-strong: #6B6F66;
    --sx-text: #F2F3EE; --sx-text-muted: #A3A79C; --sx-text-faint: #8A8E83;
    --sx-accent: #C6F432; --sx-on-accent: #0E0F0C;
    --sx-accent-2: #FF8A4C; --sx-on-accent-2: #0E0F0C;
    --sx-inverse: #F2F3EE; --sx-on-inverse: #0E0F0C; --sx-on-inverse-muted: #4A4E45;
    --sx-hero-action: #0E0F0C; --sx-on-hero-action: #C6F432;
    --sx-danger: #FF6B5E; --sx-on-danger: #0E0F0C;
    --sx-block-sable: #23261F; --sx-block-orange: #4A2616; --sx-block-jaune: #3F3A12; --sx-block-vert: #1E3A1C;
    --sx-block-bleu: #1A2B45; --sx-block-violet: #33224D; --sx-block-rose: #4A1F33;
  }
}

/* « inline » : Tailwind génère bg-surface, text-muted… qui lisent les variables ci-dessus */
@theme inline {
  --color-bg: var(--sx-bg);
  --color-surface: var(--sx-surface);
  --color-surface-2: var(--sx-surface-2);
  --color-border: var(--sx-border);
  --color-border-strong: var(--sx-border-strong);
  --color-text: var(--sx-text);
  --color-muted: var(--sx-text-muted);
  --color-faint: var(--sx-text-faint);
  --color-accent: var(--sx-accent);
  --color-on-accent: var(--sx-on-accent);
  --color-accent-2: var(--sx-accent-2);
  --color-on-accent-2: var(--sx-on-accent-2);
  --color-inverse: var(--sx-inverse);
  --color-on-inverse: var(--sx-on-inverse);
  --color-on-inverse-muted: var(--sx-on-inverse-muted);
  --color-hero-action: var(--sx-hero-action);
  --color-on-hero-action: var(--sx-on-hero-action);
  --color-danger: var(--sx-danger);
  --color-on-danger: var(--sx-on-danger);
  --color-rest: var(--sx-accent);
  --color-on-rest: var(--sx-on-accent);
  --color-block-sable: var(--sx-block-sable);
  --color-block-orange: var(--sx-block-orange);
  --color-block-jaune: var(--sx-block-jaune);
  --color-block-vert: var(--sx-block-vert);
  --color-block-bleu: var(--sx-block-bleu);
  --color-block-violet: var(--sx-block-violet);
  --color-block-rose: var(--sx-block-rose);
}

@theme {
  --font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, "Inter", "Segoe UI", sans-serif;

  --text-caption: 12px;  --text-caption--line-height: 16px;
  --text-small: 13px;    --text-small--line-height: 18px;
  --text-body: 15px;     --text-body--line-height: 20px;
  --text-body-strong: 17px; --text-body-strong--line-height: 22px;
  --text-title: 22px;    --text-title--line-height: 26px;
  --text-title-l: 28px;  --text-title-l--line-height: 32px;
  --text-display: 34px;  --text-display--line-height: 38px;
  --text-num-s: 18px;    --text-num-s--line-height: 22px;
  --text-num-m: 22px;    --text-num-m--line-height: 26px;
  --text-num-l: 38px;    --text-num-l--line-height: 40px;
  --text-num-xl: 88px;   --text-num-xl--line-height: 88px;
  --text-num-hero: 104px; --text-num-hero--line-height: 100px;

  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px;

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

La grille d'espacement de Tailwind (`p-1` = 4 px, `p-4` = 16 px…) correspond déjà à la section 3 : rien à déclarer.
