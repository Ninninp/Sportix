// Générateur des maquettes D5 : chaque écran est écrit une fois et produit dans les deux thèmes.
import { writeFileSync, mkdirSync } from 'node:fs';

const OUT = new URL('./', import.meta.url); // écrit les planches à côté de ce script
mkdirSync(OUT, { recursive: true });

// Tokens de design/tokens.md
const THEMES = [
  { key: 'S', name: 'sombre', bg: '#0E0F0C', surface: '#181A16', surface2: '#23261F', border: '#2E322B', strong: '#6B6F66',
    text: '#F2F3EE', muted: '#A3A79C', faint: '#8A8E83', accent: '#C6F432', onAccent: '#0E0F0C', accent2: '#FF8A4C', onAccent2: '#0E0F0C',
    inverse: '#F2F3EE', onInverse: '#0E0F0C', onInverseMuted: '#4A4E45', invLine: '#D5D8CF', hero: '#0E0F0C', onHero: '#C6F432',
    danger: '#FF6B5E', onDanger: '#0E0F0C', knob: '#F2F3EE' },
  { key: 'C', name: 'clair', bg: '#FFF4E8', surface: '#FFFFFF', surface2: '#FFE8D2', border: '#E8C9AA', strong: '#9C8672',
    text: '#1A1030', muted: '#5E5470', faint: '#6B6280', accent: '#FF4B1F', onAccent: '#1A1030', accent2: '#FFD23F', onAccent2: '#1A1030',
    inverse: '#1A1030', onInverse: '#FFFFFF', onInverseMuted: '#C9C2D6', invLine: '#3A3050', hero: '#FF4B1F', onHero: '#1A1030',
    danger: '#B42318', onDanger: '#FFFFFF', knob: '#FFFFFF' },
];

const file = (t, id) => (t.key === 'S' && id === 'Accueil' ? 'Main.dc.html' : `${t.key}-${id}.dc.html`);

// ---------- Icônes (tracés Lucide) ----------
const P = {
  chevL: '<path d="M15 18l-6-6 6-6"></path>',
  chevR: '<path d="M9 6l6 6-6 6"></path>',
  chevD: '<path d="M6 9l6 6 6-6"></path>',
  plus: '<path d="M12 5v14M5 12h14"></path>',
  x: '<path d="M18 6L6 18M6 6l12 12"></path>',
  search: '<circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path>',
  more: '<circle cx="5" cy="12" r="1.5"></circle><circle cx="12" cy="12" r="1.5"></circle><circle cx="19" cy="12" r="1.5"></circle>',
  up: '<path d="M12 19V5M5 12l7-7 7 7"></path>',
  swap: '<path d="M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16"></path>',
  trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>',
  share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"></path>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.7V17c0 .6-.5 1-1 1.2C7.9 18.8 7 20.2 7 22M14 14.7V17c0 .6.5 1 1 1.2 1.1.6 2 2 2 3.8M18 2H6v7a6 6 0 0 0 12 0V2z"></path>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M12 7v5l4 2"></path>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>',
  bell: '<path d="M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 0 1 0 7"></path>',
  dumbbell: '<path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"></path>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"></path>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M3 10h18M8 3v4M16 3v4"></path>',
  stats: '<path d="M4 20V10M10 20V4M16 20v-7M2 20h20"></path>',
  gear: '<circle cx="12" cy="12" r="3"></circle><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"></path>',
};
const ic = (name, size = 24, sw = 2) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name]}</svg>`;

// ---------- Briques du design system (D4) ----------
const H1 = 'margin: 0; font-size: 28px; line-height: 32px; font-weight: 800; letter-spacing: -0.02em;';
const lbl = (t, s) => `<span style="font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: ${t.muted};">${s}</span>`;
const card = (t, inner, extra = '') => `<div style="box-sizing: border-box; background: ${t.surface}; border: 1px solid ${t.border}; border-radius: 16px; ${extra}">${inner}</div>`;

const btn = {
  pri: (t, label, href, extra = '') => `<a href="${href}" style="box-sizing: border-box; flex-shrink: 0; min-height: 56px; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 12px; background: ${t.accent}; color: ${t.onAccent}; font-size: 17px; font-weight: 700; text-decoration: none; ${extra}">${label}</a>`,
  off: (t, label) => `<button disabled style="box-sizing: border-box; flex-shrink: 0; width: 100%; min-height: 56px; border-radius: 12px; border: 0; background: ${t.surface2}; color: ${t.faint}; font: inherit; font-size: 17px; font-weight: 700;">${label}</button>`,
  sec: (t, label, href, extra = '') => `<a href="${href}" style="box-sizing: border-box; flex-shrink: 0; min-height: 56px; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 12px; border: 1.5px solid ${t.text}; color: ${t.text}; font-size: 17px; font-weight: 700; text-decoration: none; ${extra}">${label}</a>`,
  danger: (t, label, href) => `<a href="${href}" style="box-sizing: border-box; flex-shrink: 0; min-height: 56px; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 12px; background: ${t.danger}; color: ${t.onDanger}; font-size: 17px; font-weight: 700; text-decoration: none;">${label}</a>`,
  link: (t, label, href, color = t.muted) => `<a href="${href}" style="min-height: 48px; display: inline-flex; align-items: center; justify-content: center; padding: 0 12px; font-size: 15px; font-weight: 600; color: ${color}; text-decoration: underline; text-underline-offset: 3px;">${label}</a>`,
};
const iconBtn = (t, name, label, href, extra = '') =>
  `<a href="${href}" aria-label="${label}" style="box-sizing: border-box; width: 48px; height: 48px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 12px; color: ${t.text}; text-decoration: none; ${extra}">${ic(name)}</a>`;

const chip = (t, label, on = false, extra = '') =>
  `<button aria-pressed="${on}" style="box-sizing: border-box; flex-shrink: 0; min-height: 48px; padding: 0 16px; display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; ${on ? `background: ${t.inverse}; color: ${t.onInverse}; border: 1.5px solid ${t.inverse};` : `background: transparent; color: ${t.text}; border: 1.5px solid ${t.strong};`} ${extra}">${label}</button>`;
const chips = (t, items, onIdx = [], scroll = false) =>
  `<div style="display: flex; gap: 8px; ${scroll ? 'overflow: hidden; margin-right: -16px;' : 'flex-wrap: wrap;'}">${items.map((s, i) => chip(t, s, onIdx.includes(i))).join('')}</div>`;

const seg = (t, items, on, label) =>
  `<div role="group" aria-label="${label}" style="display: grid; grid-template-columns: repeat(${items.length}, minmax(0, 1fr)); gap: 4px; padding: 4px; border-radius: 12px; background: ${t.surface2};">${items
    .map((s, i) => `<button aria-pressed="${i === on}" style="box-sizing: border-box; min-height: 48px; border-radius: 9px; border: 0; font: inherit; font-size: 15px; cursor: pointer; ${i === on ? `background: ${t.inverse}; color: ${t.onInverse}; font-weight: 700;` : `background: transparent; color: ${t.text}; font-weight: 500;`}">${s}</button>`)
    .join('')}</div>`;

const search = (t, value = '', ph = 'Rechercher un exercice') =>
  `<label style="position: relative; display: block; flex-shrink: 0;"><span style="position: absolute; left: 14px; top: 14px; color: ${t.muted}; display: flex;">${ic('search', 20)}</span><input type="search" value="${value}" placeholder="${ph}" aria-label="${ph}" style="box-sizing: border-box; width: 100%; height: 48px; padding: 0 14px 0 44px; border-radius: 12px; border: 1.5px solid ${t.strong}; background: ${t.surface}; color: ${t.text}; font: inherit; font-size: 17px;"></label>`;

const field = (t, label, value, ph = '') =>
  `<label style="display: flex; flex-direction: column; gap: 6px;">${lbl(t, label)}<input type="text" value="${value}" placeholder="${ph}" style="box-sizing: border-box; width: 100%; height: 52px; padding: 0 14px; border-radius: 12px; border: 1.5px solid ${t.strong}; background: ${t.surface}; color: ${t.text}; font: inherit; font-size: 17px; font-weight: 600;"></label>`;
const fieldset = (t, legend, inner) => `<fieldset style="margin: 0; padding: 0; border: 0; display: flex; flex-direction: column; gap: 8px;"><legend style="padding: 0; margin-bottom: 8px;">${lbl(t, legend)}</legend>${inner}</fieldset>`;

const badgeUp = (t, s) => `<span style="display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 700; padding: 3px 9px; border-radius: 999px; background: ${t.accent2}; color: ${t.onAccent2};">${ic('up', 14, 3)}${s}</span>`;
const badgePR = (t) => `<span style="flex-shrink: 0; font-size: 12px; font-weight: 800; padding: 2px 8px; border-radius: 999px; background: ${t.accent2}; color: ${t.onAccent2};">PR</span>`;

const header = (t, title, back, backLabel, right = '', size = 28) =>
  `<header style="display: flex; align-items: center; gap: 4px; margin: 0 -8px; flex-shrink: 0;">${iconBtn(t, 'chevL', backLabel, back)}<h1 style="${H1} font-size: ${size}px; line-height: ${size + 4}px; flex-grow: 1;">${title}</h1>${right}</header>`;

// En-tête de séance (onglets masqués pendant la séance)
const seanceHeader = (t, chrono, color = t.text, sub = t.muted) =>
  `<header style="display: flex; align-items: center; gap: 4px; margin: 0 -8px; flex-shrink: 0;">${iconBtn(t, 'chevD', 'Réduire la séance (elle continue)', file(t, 'Seance-reduite'), `color: ${color};`)}<div style="flex-grow: 1;"><div style="font-size: 15px; font-weight: 700; color: ${color};">Séance libre</div><div class="num" style="font-size: 15px; color: ${sub};">${chrono}</div></div>${btn.link(t, 'Terminer', file(t, 'Recap'), sub)}</header>`;

const progress = (t, done, total, fills, line = t.strong, fill = t.text, txt = t.muted, strong = t.text) =>
  `<div style="display: flex; flex-direction: column; gap: 8px; flex-shrink: 0;"><div style="display: flex; justify-content: space-between; align-items: baseline;"><span style="font-size: 13px; font-weight: 600; color: ${txt};">Séance</span><span style="font-size: 13px; color: ${txt};"><span class="num" style="font-size: 16px; color: ${strong};">${done} / ${total}</span> séries</span></div><div role="progressbar" aria-label="Progression de la séance" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}" style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 4px;">${fills
    .map((f) => `<div style="box-sizing: border-box; height: 8px; border-radius: 4px; border: 1.5px solid ${line}; overflow: hidden;"><div style="width: ${f}%; height: 100%; background: ${fill};"></div></div>`)
    .join('')}</div></div>`;

const nav = (t, active) => {
  const tabs = [['seance', 'Séance', 'dumbbell', file(t, 'Accueil-J3')], ['prog', 'Programmes', 'list', '#'], ['cal', 'Calendrier', 'cal', '#'], ['stats', 'Stats', 'stats', '#'], ['reglages', 'Réglages', 'gear', file(t, 'Reglages')]];
  return `<nav aria-label="Navigation principale" style="flex-shrink: 0; height: 56px; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); background: ${t.surface}; border-top: 1px solid ${t.border};">${tabs
    .map(([k, l, i, h]) => `<a href="${h}"${k === active ? ' aria-current="page"' : ''} style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; font-size: 12px; font-weight: ${k === active ? 700 : 500}; color: ${k === active ? t.text : t.muted}; text-decoration: none;"><span style="width: 24px; height: 3px; border-radius: 2px; background: ${k === active ? t.text : 'transparent'};"></span>${ic(i)}<span>${l}</span></a>`)
    .join('')}</nav>`;
};

// Feuille qui monte du bas (menu ⋯, création rapide, confirmation)
const sheet = (t, label, inner) =>
  `<div aria-hidden="true" style="position: absolute; top: 0; right: 0; bottom: 0; left: 0; background: rgb(0 0 0 / 0.5);"></div><section role="dialog" aria-label="${label}" style="position: absolute; left: 0; right: 0; bottom: 0; box-sizing: border-box; padding: 8px 16px 50px; border-radius: 16px 16px 0 0; background: ${t.surface}; color: ${t.text}; box-shadow: 0 -8px 24px rgb(0 0 0 / 0.25); display: flex; flex-direction: column; gap: 16px;"><div aria-hidden="true" style="align-self: center; width: 36px; height: 5px; border-radius: 3px; background: ${t.strong};"></div>${inner}</section>`;

const frame = (t, { main, navActive = null, overlay = '', bg = t.bg, color = t.text, pad = '8px 16px 16px', gap = 12, h = 844, bar = '' }) =>
  `<div style="width: 390px; height: ${h}px; position: relative; display: flex; flex-direction: column; background: ${bg}; color: ${color}; overflow: hidden;"><div aria-hidden="true" style="height: 47px; flex-shrink: 0;"></div><main style="flex-grow: 1; min-height: 0; overflow: hidden; box-sizing: border-box; padding: ${pad}; display: flex; flex-direction: column; gap: ${gap}px;">${main}</main>${bar}${navActive ? nav(t, navActive) : ''}<div aria-hidden="true" style="height: ${navActive ? 26 : 34}px; flex-shrink: 0; background: ${navActive ? t.surface : 'transparent'};"></div>${overlay}</div>`;

const listRow = (t, name, sub, href, right = ic('chevR', 20), first = false) =>
  `<a href="${href}" style="display: flex; align-items: center; gap: 12px; min-height: 64px; padding: 0 12px 0 16px; text-decoration: none; color: ${t.text}; ${first ? '' : `border-top: 1px solid ${t.border};`}"><span style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 17px; font-weight: 600;">${name}</span><span style="font-size: 13px; color: ${t.muted};">${sub}</span></span><span style="color: ${t.muted}; display: flex;">${right}</span></a>`;

// ---------- Écrans ----------
const S = {};

// ===== J2 · Bibliothèque d'exercices =====
const BIB = [
  ['Jambes', [['Squat', 'Barre · Smith · Machine'], ['Presse à cuisses', 'Machine'], ['Leg curl', 'Machine'], ['Fentes bulgares', 'Haltères · Smith'], ['Soulevé de terre roumain', 'Barre · Haltères']]],
  ['Pectoraux', [['Développé couché', 'Barre · Haltères · Machine'], ['Développé incliné', 'Haltères · Smith']]],
];
S['Biblio'] = { title: 'Bibliothèque', page: 'j2', render: (t) => frame(t, { navActive: 'reglages', main:
  header(t, 'Exercices', file(t, 'Reglages'), 'Retour aux réglages', `<span class="num" style="padding-right: 12px; font-size: 15px; color: ${t.muted};">32</span>`) +
  search(t) +
  chips(t, ['Tous', 'Jambes', 'Pectoraux', 'Dos', 'Épaules', 'Bras'], [0], true) +
  `<div style="flex-grow: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; gap: 8px;">${BIB.map(([g, xs]) => `${lbl(t, g)}${card(t, xs.map(([n, v], i) => listRow(t, n, v, file(t, 'Exercice-modifier'), ic('chevR', 20), i === 0)).join(''), 'flex-shrink: 0; overflow: hidden;')}`).join('')}</div>` +
  btn.pri(t, `${ic('plus', 20)}Nouvel exercice`, file(t, 'Exercice-nouveau')) }) };

S['Biblio-vide'] = { title: 'Bibliothèque · aucun résultat', page: 'j2', render: (t) => frame(t, { navActive: 'reglages', main:
  header(t, 'Exercices', file(t, 'Reglages'), 'Retour aux réglages', `<span class="num" style="padding-right: 12px; font-size: 15px; color: ${t.muted};">32</span>`) +
  search(t, 'hack sq') +
  chips(t, ['Tous', 'Jambes', 'Pectoraux', 'Dos', 'Épaules', 'Bras'], [0], true) +
  `<div style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center; padding: 0 16px;"><span style="width: 64px; height: 64px; border-radius: 32px; background: ${t.surface2}; color: ${t.muted}; display: flex; align-items: center; justify-content: center;">${ic('search', 28)}</span><h2 style="margin: 8px 0 0; font-size: 22px; line-height: 26px; font-weight: 700;">Aucun exercice « hack sq »</h2><p style="margin: 0; font-size: 15px; line-height: 20px; color: ${t.muted};">Vérifie l'orthographe, ou crée-le : il sera ensuite proposé partout.</p></div>` +
  btn.pri(t, `${ic('plus', 20)}Créer « Hack sq »`, file(t, 'Exercice-nouveau')) }) };

const exForm = (t, { name, group, type, variants, used }) =>
  field(t, 'Nom', name, 'Ex. Hack squat') +
  fieldset(t, 'Groupe musculaire', chips(t, ['Jambes', 'Pectoraux', 'Dos', 'Épaules', 'Bras', 'Abdos'], group)) +
  fieldset(t, 'Type', seg(t, ['Charge', 'Poids du corps', 'Temps'], type, 'Type')) +
  fieldset(t, 'Variantes possibles', chips(t, ['Barre', 'Smith', 'Haltères', 'Machine', 'Poulie'], variants)) +
  (used ? `<p style="margin: 0; font-size: 13px; color: ${t.muted};">${used}</p>` : '');

S['Exercice-nouveau'] = { title: 'Nouvel exercice · vide', page: 'j2', render: (t) => frame(t, { gap: 20, main:
  header(t, 'Nouvel exercice', file(t, 'Biblio'), 'Annuler', '', 22).replace(ic('chevL'), ic('x')) +
  exForm(t, { name: '', group: [], type: 0, variants: [] }) +
  `<div style="flex-grow: 1;"></div>` +
  `<div style="display: flex; flex-direction: column; gap: 6px;">${btn.off(t, 'Enregistrer')}<span style="text-align: center; font-size: 13px; color: ${t.muted};">Donne un nom et au moins une variante</span></div>` }) };

S['Exercice-modifier'] = { title: 'Modifier un exercice', page: 'j2', render: (t) => frame(t, { gap: 20, main:
  header(t, 'Squat', file(t, 'Biblio'), 'Retour à la bibliothèque', '', 22) +
  exForm(t, { name: 'Squat', group: [0], type: 0, variants: [0, 1, 3], used: 'Utilisé dans 18 séances.' }) +
  `<div style="flex-grow: 1;"></div>` +
  `<div style="display: flex; flex-direction: column; gap: 4px;">${btn.pri(t, 'Enregistrer', file(t, 'Biblio'))}${btn.link(t, `Supprimer l'exercice`, file(t, 'Exercice-supprimer'), t.danger)}</div>` }) };

S['Exercice-supprimer'] = { title: 'Confirmation de suppression', page: 'j2', render: (t) => frame(t, { gap: 20, main:
  header(t, 'Squat', file(t, 'Biblio'), 'Retour à la bibliothèque', '', 22) +
  exForm(t, { name: 'Squat', group: [0], type: 0, variants: [0, 1, 3], used: 'Utilisé dans 18 séances.' }),
  overlay: sheet(t, 'Supprimer le squat ?',
    `<div style="display: flex; flex-direction: column; gap: 6px;"><h2 style="margin: 0; font-size: 22px; line-height: 26px; font-weight: 700;">Supprimer « Squat » ?</h2><p style="margin: 0; font-size: 15px; line-height: 20px; color: ${t.muted};">Il ne sera plus proposé. Tes 18 séances passées le gardent dans l'historique.</p></div>` +
    `<div style="display: flex; flex-direction: column; gap: 8px;">${btn.danger(t, `${ic('trash', 20)}Supprimer l'exercice`, file(t, 'Biblio'))}${btn.sec(t, 'Annuler', file(t, 'Exercice-modifier'))}</div>`) }) };

// ===== J3 · Accueil =====
// En-tête de l'accueil : la date seule, en discret (retour du test sur iPhone, 19/09/2026)
const today = (t) => `<div style="font-size: 15px; color: ${t.muted};">Jeudi 17 septembre</div>`;
const heroCard = (t, title, sub, cta, href) =>
  `<section aria-label="${title}" style="flex-shrink: 0; box-sizing: border-box; padding: 16px; border-radius: 16px; background: ${t.inverse}; color: ${t.onInverse}; display: flex; flex-direction: column; gap: 14px;"><div><h2 style="margin: 0; font-size: 28px; line-height: 32px; font-weight: 800; letter-spacing: -0.02em;">${title}</h2><p style="margin: 6px 0 0; font-size: 15px; line-height: 20px; color: ${t.onInverseMuted};">${sub}</p></div><a href="${href}" style="box-sizing: border-box; min-height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background: ${t.hero}; color: ${t.onHero}; font-size: 20px; font-weight: 800; text-decoration: none;">${cta}</a></section>`;

const week = (t, empty = false) => {
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  return card(t, `<div style="display: flex; justify-content: space-between; align-items: center;"><span style="font-size: 15px; font-weight: 700;">Cette semaine</span><span style="display: flex; align-items: center; gap: 6px; font-size: 13px; color: ${t.muted};">${empty ? 'aucune séance' : `1 séance · mar. ${badgePR(t)}`}</span></div><div style="display: flex; justify-content: space-between;">${days
    .map((d, i) => {
      const done = !empty && i === 1, now = i === 3;
      const dot = done ? `background: ${t.inverse}; border: 2px solid ${t.inverse};` : now ? `border: 3px solid ${t.text};` : `border: 1.5px solid ${t.strong};`;
      return `<div style="display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 12px; font-weight: ${now ? 800 : 600}; color: ${done || now ? t.text : t.muted};"><span style="box-sizing: border-box; width: 30px; height: 30px; border-radius: 15px; ${dot}"></span>${d}</div>`;
    })
    .join('')}</div>`, 'padding: 12px 16px 14px; display: flex; flex-direction: column; gap: 10px; flex-shrink: 0;');
};

// Structure validée en D3 : en-tête (date, Sportix, poids) · ligne fine (bloc) · semaine · grande carte inversée qui domine
const homeHeader = (t, weight = true) =>
  `<header style="display: flex; justify-content: space-between; align-items: flex-end; flex-shrink: 0;">${today(t)}${weight ? `<a href="#" aria-label="Poids 78,4 kg, ajouter une pesée" style="min-height: 48px; display: flex; align-items: center; gap: 6px; padding: 0 4px; text-decoration: none; color: ${t.muted};"><span class="num" style="font-size: 18px;">78,4 kg</span>${ic('plus', 20)}</a>` : ''}</header>`;
const thinRow = (t, inner, href, label) =>
  `<a href="${href}" aria-label="${label}" style="box-sizing: border-box; flex-shrink: 0; min-height: 52px; padding: 0 12px 0 16px; display: flex; align-items: center; gap: 12px; border-radius: 16px; background: ${t.surface}; border: 1px solid ${t.border}; color: ${t.text}; text-decoration: none;">${inner}<span style="display: flex; color: ${t.muted};">${ic('chevR', 18)}</span></a>`;
const blocRow = (t) => {
  const seg = (st, txt = '') => `<span style="box-sizing: border-box; height: 16px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; ${st}">${txt}</span>`;
  return thinRow(t, `<span style="font-size: 15px; white-space: nowrap;"><span style="color: ${t.muted};">Bloc</span> <strong>Force</strong></span><span style="flex-grow: 1; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 3px;">${seg(`background: ${t.strong};`)}${seg(`background: ${t.inverse}; color: ${t.onInverse};`, 'S2')}${seg(`border: 1.5px solid ${t.strong};`)}${seg(`border: 1.5px dashed ${t.strong}; color: ${t.muted};`, 'D')}${seg(`border: 1.5px solid ${t.strong};`)}</span>`, '#', 'Bloc Force, semaine 2 sur 5, deload en semaine 4');
};
// Grande carte « ici, maintenant » : titre, sous-titre, lignes, bouton en bas (zone du pouce)
const heroBig = (t, { title, sub, rows, cta, href }) =>
  `<section aria-label="${title}" style="flex-grow: 1; box-sizing: border-box; padding: 16px; border-radius: 16px; background: ${t.inverse}; color: ${t.onInverse}; display: flex; flex-direction: column; gap: 8px;"><div><h2 style="margin: 0; font-size: 28px; line-height: 32px; font-weight: 800; letter-spacing: -0.02em;">${title}</h2><div style="font-size: 14px; line-height: 18px; color: ${t.onInverseMuted}; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${sub}</div></div><div style="display: flex; flex-direction: column;">${rows
    .map((r, i) => `<div style="display: flex; align-items: center; gap: 8px; min-height: 38px; ${i ? `border-top: 1px solid ${t.invLine};` : ''}">${r}</div>`).join('')}</div><div style="flex-grow: 1;"></div><a href="${href}" style="box-sizing: border-box; flex-shrink: 0; min-height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background: ${t.hero}; color: ${t.onHero}; font-size: 20px; font-weight: 800; text-decoration: none;">${cta}</a></section>`;
const exLine = (t, name, right, up = false) => `<span style="flex-grow: 1; font-size: 17px; font-weight: 600;">${name}</span>${up ? `<span aria-label="charge en hausse" style="display: inline-flex; padding: 2px 6px; border-radius: 999px; background: ${t.accent2}; color: ${t.onAccent2};">${ic('up', 14, 3)}</span>` : ''}<span class="num" style="font-size: 18px;">${right}</span>`;
const stepLine = (t, n, s) => `<span class="num" style="width: 28px; height: 28px; flex-shrink: 0; border-radius: 14px; border: 1.5px solid ${t.onInverseMuted}; display: flex; align-items: center; justify-content: center; font-size: 15px;">${n}</span><span style="flex-grow: 1; font-size: 15px; line-height: 20px; padding: 8px 0;">${s}</span>`;

S['Accueil-vide'] = { title: 'Accueil · premier lancement', page: 'j3', render: (t) => frame(t, { navActive: 'seance', main:
  homeHeader(t, false) +
  thinRow(t, `<span style="display: flex; color: ${t.muted};">${ic('share', 20)}</span><span style="flex-grow: 1; font-size: 15px;"><strong>Installer Sportix</strong> <span style="color: ${t.muted};">· Partager → Sur l'écran d'accueil</span></span>`, file(t, 'Reglages'), `Installer Sportix : voir comment dans les réglages`) +
  week(t, true) +
  heroBig(t, { title: 'Première séance', sub: 'Pas besoin de programme pour commencer.', href: file(t, 'Seance-vide'), cta: 'Démarrer la séance',
    rows: [stepLine(t, 1, 'Ajoute tes exercices au fil de la séance'), stepLine(t, 2, 'Règle charge et reps avec − / +, puis valide la série'), stepLine(t, 3, 'La fois suivante, tout est pré-rempli')] }) }) };

S['Accueil-J3'] = { title: 'Accueil · J3 (sans programme)', page: 'j3', render: (t) => frame(t, { navActive: 'seance', main:
  homeHeader(t, false) +
  thinRow(t, `<span style="display: flex; color: ${t.muted};">${ic('history', 20)}</span><span style="flex-grow: 1; font-size: 15px;"><strong>Mardi</strong> <span style="color: ${t.muted};">· 48 min · 6 240 kg</span></span>${badgePR(t)}`, file(t, 'Historique'), 'Dernière séance mardi, voir l’historique') +
  week(t) +
  heroBig(t, { title: 'Séance libre', sub: 'Tes dernières charges, reprises automatiquement', href: file(t, 'Seance-vide'), cta: 'Démarrer la séance',
    rows: [exLine(t, 'Squat', '102,5 kg', true), exLine(t, 'Développé couché', '80 kg'), exLine(t, 'Tractions', '× 9'), exLine(t, 'Presse à cuisses', '140 kg'), exLine(t, 'Développé militaire', '22 kg')] }) }) };

S['Accueil'] = { title: 'Accueil · complet (validé en D3, J5 à J7)', page: 'j3', render: (t) => frame(t, { navActive: 'seance', pad: '8px 16px 12px', main:
  homeHeader(t) + blocRow(t) + week(t) +
  heroBig(t, { title: 'Force A — Jambes', sub: `Aujourd'hui · Force A/B · 5 exercices`, href: file(t, 'Seance'), cta: 'Démarrer la séance',
    rows: [exLine(t, 'Squat', '3 × 4–6 · 102,5 kg', true), exLine(t, 'Presse à cuisses', '3 × 8–12 · 140 kg'), exLine(t, 'Leg curl', '3 × 10–15 · 45 kg'), exLine(t, 'Fentes bulgares', '3 × 8–10 · 16 kg'), exLine(t, 'Mollets debout', '4 × 12–15 · 60 kg')] }) +
  btn.sec(t, `${ic('plus', 20)}Séance libre`, file(t, 'Seance-vide'), `min-height: 52px; border-color: ${t.strong};`) }) };

// ===== J3 · Séance en cours =====
const PILLS = [['Squat', '1/3', true], ['Presse', '0/3'], ['Leg curl', '0/3'], ['Fentes', '0/3'], ['Mollets', '0/4']];
const pills = (t) =>
  `<nav aria-label="Exercices de la séance" style="display: flex; align-items: center; gap: 8px; margin-right: -16px; flex-shrink: 0;"><div style="flex-grow: 1; display: flex; gap: 8px; overflow: hidden;">${PILLS.map(([n, c, on]) => `<a href="${file(t, 'Seance')}"${on ? ' aria-current="step"' : ''} style="box-sizing: border-box; flex-shrink: 0; min-height: 48px; padding: 0 14px; display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; font-size: 15px; font-weight: 600; text-decoration: none; white-space: nowrap; ${on ? `background: ${t.inverse}; color: ${t.onInverse}; border: 1.5px solid ${t.inverse};` : `color: ${t.text}; border: 1.5px solid ${t.strong};`}">${n} <span class="num" style="opacity: .8;">${c}</span></a>`).join('')}</div>${iconBtn(t, 'plus', 'Ajouter un exercice', file(t, 'Choix-exercice'), `border: 1.5px solid ${t.strong}; border-radius: 999px; margin-right: 16px;`)}</nav>`;

const setRow = (t, n, kg, reps, state) => {
  const st = state === 'done' ? `background: ${t.surface2}; color: ${t.muted}; border: 1.5px solid ${t.surface2};` : state === 'now' ? `background: ${t.inverse}; color: ${t.onInverse}; border: 1.5px solid ${t.inverse};` : `background: transparent; color: ${t.faint}; border: 1.5px dashed ${t.strong};`;
  const lab = state === 'done' ? 'faite' : state === 'now' ? 'en cours' : 'à faire';
  return `<button aria-label="Série ${n}, ${lab} : ${kg}, ${reps} reps"${state === 'now' ? ' aria-current="true"' : ''} style="box-sizing: border-box; width: 100%; min-height: 48px; display: grid; grid-template-columns: 24px minmax(0, 1fr) 72px; column-gap: 12px; align-items: center; padding: 0 14px; border-radius: 8px; font: inherit; text-align: left; cursor: pointer; ${st}"><span class="num" style="font-size: 15px;">${n}</span><span class="num" style="font-size: 22px;">${kg}</span><span class="num" style="font-size: 22px; text-align: right;">× ${reps}</span></button>`;
};

const stepper = (t, label, value, unit, aria, minus, plus) =>
  `<div role="group" aria-label="${aria}" style="display: flex; align-items: stretch; height: 60px; border: 1.5px solid ${t.strong}; border-radius: 12px; overflow: hidden; background: ${t.surface};"><button aria-label="${minus}" style="box-sizing: border-box; width: 56px; flex-shrink: 0; border: 0; background: ${t.surface2}; color: ${t.text}; font: inherit; font-size: 26px; font-weight: 700; cursor: pointer;">−</button><div style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;"><span style="font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: ${t.muted};">${label}</span><span><span class="num" style="font-size: 38px; line-height: 40px; letter-spacing: -0.02em;">${value}</span> <span style="font-size: 15px; font-weight: 600; color: ${t.muted};">${unit}</span></span></div><button aria-label="${plus}" style="box-sizing: border-box; width: 56px; flex-shrink: 0; border: 0; background: ${t.surface2}; color: ${t.text}; font: inherit; font-size: 26px; font-weight: 700; cursor: pointer;">+</button></div>`;

const seanceMain = (t) =>
  seanceHeader(t, '24:10') + pills(t) +
  `<div style="display: flex; align-items: flex-start; gap: 8px; flex-shrink: 0;"><div style="flex-grow: 1;"><h1 style="${H1}">Squat</h1><div style="font-size: 15px; margin-top: 2px; color: ${t.muted};"><span class="num" style="font-size: 18px; color: ${t.text};">3 × 4–6 reps</span> · Barre · repos <span class="num">3:00</span></div></div>${iconBtn(t, 'more', `Options de l'exercice`, file(t, 'Seance-menu'), 'margin-right: -8px;')}</div>` +
  card(t, setRow(t, 1, '102,5 kg', 5, 'done') + setRow(t, 2, '102,5 kg', 5, 'now') + setRow(t, 3, '102,5 kg', 5, 'next') +
    `<div style="display: flex; justify-content: space-between; align-items: center;"><button style="min-height: 48px; padding: 0 10px; border: 0; background: transparent; color: ${t.text}; font: inherit; font-size: 15px; font-weight: 600; cursor: pointer;">+ Série</button><a href="${file(t, 'Seance')}" style="min-height: 48px; display: flex; align-items: center; gap: 4px; padding: 0 6px 0 10px; text-decoration: none; font-size: 15px; color: ${t.text};"><span style="color: ${t.muted};">Ensuite :</span> <span style="font-weight: 600;">Presse</span>${ic('chevR', 18)}</a></div>`,
    'flex-shrink: 0; padding: 4px; display: flex; flex-direction: column; gap: 4px;') +
  `<div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">${progress(t, 1, 15, [33, 0, 0, 0, 0])}</div>` +
  card(t, `<div style="display: flex; justify-content: space-between; align-items: center;"><span style="font-size: 17px; font-weight: 700;">Série 2</span>${badgeUp(t, 'charge +2,5 kg')}</div>` +
    stepper(t, 'Charge', '102,5', 'kg', 'Charge', 'Retirer 2,5 kg', 'Ajouter 2,5 kg') +
    stepper(t, `Reps · <span style="color: ${t.text};">objectif 4–6</span>`, '5', 'reps', 'Répétitions, objectif 4 à 6', 'Retirer une rep', 'Ajouter une rep'),
    'flex-shrink: 0; padding: 12px; display: flex; flex-direction: column; gap: 10px;') +
  btn.pri(t, 'Valider la série', file(t, 'Repos'), 'font-size: 20px; font-weight: 800;');

S['Seance-vide'] = { title: 'Séance · vide', page: 'j3', render: (t) => frame(t, { pad: '4px 16px 16px', main:
  seanceHeader(t, '0:12') +
  `<div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center; gap: 8px; padding: 0 8px;"><h1 style="${H1}">Séance libre</h1><p style="margin: 0; font-size: 15px; line-height: 20px; color: ${t.muted};">Ajoute ton premier exercice. Ses séries seront pré-remplies avec ta dernière fois.</p></div>` +
  card(t, `${lbl(t, 'Récents')}<div style="display: flex; flex-wrap: wrap; gap: 8px;">${['Squat', 'Développé couché', 'Tractions', 'Presse à cuisses'].map((n) => `<a href="${file(t, 'Seance')}" style="box-sizing: border-box; min-height: 48px; padding: 0 14px; display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; border: 1.5px solid ${t.strong}; color: ${t.text}; font-size: 15px; font-weight: 600; text-decoration: none;">${ic('plus', 16)}${n}</a>`).join('')}</div>`, 'flex-shrink: 0; padding: 14px; display: flex; flex-direction: column; gap: 10px;') +
  btn.pri(t, `${ic('plus', 22)}Ajouter un exercice`, file(t, 'Choix-exercice'), 'font-size: 20px; font-weight: 800;') }) };

S['Seance'] = { title: 'Séance en cours', page: 'j3', render: (t) => frame(t, { pad: '4px 16px 16px', main: seanceMain(t) }) };

S['Seance-menu'] = { title: 'Séance · menu ⋯', page: 'j3', render: (t) => frame(t, { pad: '4px 16px 16px', main: seanceMain(t),
  overlay: sheet(t, `Options de l'exercice Squat`,
    `<div><div style="font-size: 22px; line-height: 26px; font-weight: 700;">Squat</div><div style="font-size: 15px; color: ${t.muted};">1 série faite sur 3</div></div>` +
    btn.sec(t, `${ic('swap', 20)}Remplacer l'exercice`, file(t, 'Choix-exercice'), 'justify-content: flex-start; padding: 0 16px;') +
    `<div style="display: flex; flex-direction: column; gap: 8px;">${lbl(t, 'Variante')}${chips(t, ['Barre', 'Smith', 'Machine'], [0])}</div>` +
    `<div style="display: flex; flex-direction: column; gap: 8px;">${lbl(t, 'Objectif du jour')}<div style="display: flex; align-items: center; justify-content: space-between; min-height: 52px; padding: 0 4px 0 16px; border-radius: 12px; background: ${t.surface2};"><span style="font-size: 17px;"><span class="num">3</span> séries · <span class="num">4</span> à <span class="num">6</span> reps</span>${btn.link(t, 'Modifier', file(t, 'Seance-menu'), t.text)}</div></div>` +
    `<div style="display: flex; justify-content: space-between; align-items: center;"><a href="${file(t, 'Seance')}" style="min-height: 48px; display: inline-flex; align-items: center; gap: 8px; padding: 0 4px; font-size: 15px; font-weight: 600; color: ${t.danger}; text-decoration: none;">${ic('trash', 20)}Retirer de la séance</a>${btn.link(t, 'Fermer', file(t, 'Seance'), t.text)}</div>`) }) };

// ===== J3 · Choix d'exercice et création rapide =====
const addBtn = (t, label, href) => `<a href="${href}" aria-label="${label}" style="box-sizing: border-box; width: 48px; height: 48px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; border: 1.5px solid ${t.strong}; color: ${t.text}; text-decoration: none;">${ic('plus', 20)}</a>`;
const addRow = (t, n, v, first = false) => `<div style="display: flex; align-items: center; gap: 12px; min-height: 64px; padding: 0 8px 0 16px; ${first ? '' : `border-top: 1px solid ${t.border};`}"><span style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 17px; font-weight: 600;">${n}</span><span style="font-size: 13px; color: ${t.muted};">${v}</span></span>${addBtn(t, `Ajouter ${n}`, file(t, 'Seance'))}</div>`;
const choixMain =(t, q = '') =>
  header(t, 'Ajouter un exercice', file(t, 'Seance'), 'Retour à la séance', '', 22) + search(t, q);

S['Choix-exercice'] = { title: `Choix d'exercice`, page: 'j3', render: (t) => frame(t, { pad: '4px 16px 16px', main:
  choixMain(t) + chips(t, ['Tous', 'Jambes', 'Pectoraux', 'Dos', 'Épaules', 'Bras'], [0], true) + lbl(t, 'Récents') +
  card(t,
    addRow(t, 'Presse à cuisses', 'Jambes · Machine', true) +
    `<div style="padding: 12px 12px 14px 16px; border-top: 1px solid ${t.border}; background: ${t.surface2}; display: flex; flex-direction: column; gap: 10px;"><div><div style="font-size: 17px; font-weight: 600;">Fentes bulgares</div><div style="font-size: 13px; color: ${t.muted};">Jambes · choisis la variante</div></div><div style="display: flex; gap: 8px;">${['Haltères', 'Smith'].map((v) => `<a href="${file(t, 'Seance')}" style="box-sizing: border-box; min-height: 48px; padding: 0 16px; display: inline-flex; align-items: center; border-radius: 999px; border: 1.5px solid ${t.text}; color: ${t.text}; font-size: 15px; font-weight: 700; text-decoration: none;">${v}</a>`).join('')}</div></div>` +
    [['Leg curl', 'Jambes · Machine'], ['Mollets debout', 'Jambes · Smith, Machine'], ['Soulevé de terre roumain', 'Jambes · Barre, Haltères']].map(([n, v]) => addRow(t, n, v)).join(''),
    'flex-shrink: 0; overflow: hidden;') +
  `<div style="flex-grow: 1;"></div>` +
  btn.sec(t, `${ic('plus', 20)}Créer un exercice`, file(t, 'Creation-rapide')) }) };

S['Creation-rapide'] = { title: 'Création rapide (panneau)', page: 'j3', render: (t) => frame(t, { pad: '4px 16px 16px', main:
  choixMain(t, 'hack sq') + `<p style="margin: 8px 0 0; font-size: 15px; color: ${t.muted};">Aucun exercice « hack sq »</p>`,
  overlay: sheet(t, 'Nouvel exercice',
    `<h2 style="margin: 0; font-size: 22px; line-height: 26px; font-weight: 700;">Nouvel exercice</h2>` +
    field(t, 'Nom', 'Hack squat') +
    fieldset(t, 'Groupe musculaire', chips(t, ['Jambes', 'Pectoraux', 'Dos', 'Épaules', 'Bras', 'Abdos'], [0])) +
    fieldset(t, 'Type', seg(t, ['Charge', 'Poids du corps', 'Temps'], 0, 'Type')) +
    fieldset(t, 'Variantes possibles', chips(t, ['Barre', 'Smith', 'Haltères', 'Machine', 'Poulie'], [3])) +
    btn.pri(t, 'Créer et ajouter à la séance', file(t, 'Seance'))) }) };

// ===== J3 · Fin de séance, historique =====
const tile = (t, label, value) => `<div style="box-sizing: border-box; padding: 12px; border-radius: 12px; background: ${t.surface}; border: 1px solid ${t.border}; display: flex; flex-direction: column; gap: 4px;">${lbl(t, label)}<span class="num" style="font-size: 22px; line-height: 26px;">${value}</span></div>`;

S['Recap'] = { title: 'Fin de séance · récapitulatif', page: 'j3', render: (t) => frame(t, { gap: 16, main:
  `<header style="flex-shrink: 0; padding-top: 12px;"><div style="font-size: 15px; color: ${t.muted};">Jeudi 17 septembre · Séance libre</div><h1 style="margin: 0; font-size: 34px; line-height: 38px; font-weight: 800; letter-spacing: -0.02em;">Séance terminée</h1></header>` +
  `<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; flex-shrink: 0;">${tile(t, 'Durée', '52:14')}${tile(t, 'Volume', '9 240 kg')}${tile(t, 'Séries', '15')}</div>` +
  `<section style="flex-shrink: 0; box-sizing: border-box; padding: 16px; border-radius: 16px; background: ${t.inverse}; color: ${t.onInverse}; display: flex; flex-direction: column; gap: 10px;"><div style="display: flex; align-items: center; gap: 10px;">${ic('trophy', 28)}<h2 style="margin: 0; font-size: 22px; line-height: 26px; font-weight: 700;">2 records</h2></div>${[['Squat', 'Barre', '105 kg × 5'], ['Presse à cuisses', 'Machine', '150 kg × 10']].map(([n, v, s], i) => `<div style="display: flex; align-items: center; gap: 8px; min-height: 44px; ${i ? `border-top: 1px solid ${t.invLine};` : ''}"><span style="flex-grow: 1;"><span style="font-size: 17px; font-weight: 600;">${n}</span> <span style="font-size: 13px; color: ${t.onInverseMuted};">${v}</span></span><span class="num" style="font-size: 18px;">${s}</span>${badgePR(t)}</div>`).join('')}</section>` +
  card(t, `${lbl(t, 'La prochaine fois')}<div style="display: flex; align-items: center; gap: 8px; min-height: 40px;"><span style="flex-grow: 1; font-size: 17px; font-weight: 600;">Squat</span>${badgeUp(t, '+2,5 kg')}</div><p style="margin: 0; font-size: 13px; line-height: 18px; color: ${t.muted};">Les 3 séries ont atteint 6 reps : la charge montera à 107,5 kg.</p>`, 'flex-shrink: 0; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px;') +
  `<div style="flex-grow: 1;"></div>` +
  `<div style="display: flex; flex-direction: column; gap: 4px;">${btn.pri(t, 'Fermer', file(t, 'Accueil-J3'), 'font-size: 20px; font-weight: 800;')}${btn.link(t, 'Voir le détail', file(t, 'Detail-seance'), t.text)}</div>` }) };

S['Historique-vide'] = { title: 'Historique · vide', page: 'j3', render: (t) => frame(t, { navActive: 'seance', main:
  header(t, 'Historique', file(t, 'Accueil-J3'), `Retour à l'accueil`) +
  `<div style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center; padding: 0 24px;"><span style="width: 64px; height: 64px; border-radius: 32px; background: ${t.surface2}; color: ${t.muted}; display: flex; align-items: center; justify-content: center;">${ic('history', 28)}</span><h2 style="margin: 8px 0 0; font-size: 22px; line-height: 26px; font-weight: 700;">Aucune séance pour l'instant</h2><p style="margin: 0; font-size: 15px; line-height: 20px; color: ${t.muted};">Chaque séance terminée s'ajoute ici, avec ses records.</p></div>` +
  btn.pri(t, 'Démarrer une séance', file(t, 'Seance-vide')) }) };

const HIST = [
  ['Septembre 2026', [['15', 'MAR.', 'Développé couché, Tractions +3', '48 min · 6 240 kg', true], ['12', 'SAM.', 'Squat, Presse à cuisses +3', '55 min · 9 180 kg', true], ['10', 'JEU.', 'Développé couché, Tractions +3', '51 min · 6 050 kg'], ['08', 'MAR.', 'Squat, Presse à cuisses +3', '57 min · 8 960 kg']]],
  ['Août 2026', [['29', 'SAM.', 'Squat, Développé couché +5', '58 min · 10 900 kg'], ['27', 'JEU.', 'Squat, Développé couché +5', '60 min · 11 150 kg']]],
];
S['Historique'] = { title: 'Historique', page: 'j3', render: (t) => frame(t, { navActive: 'seance', main:
  header(t, 'Historique', file(t, 'Accueil-J3'), `Retour à l'accueil`) +
  HIST.map(([m, xs]) => `${lbl(t, m)}${card(t, xs.map(([d, w, n, s, pr], i) => `<a href="${file(t, 'Detail-seance')}" style="display: flex; align-items: center; gap: 14px; min-height: 68px; padding: 8px 12px 8px 14px; text-decoration: none; color: ${t.text}; ${i ? `border-top: 1px solid ${t.border};` : ''}"><span style="width: 40px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center;"><span class="num" style="font-size: 22px; line-height: 24px;">${d}</span><span style="font-size: 12px; font-weight: 600; color: ${t.muted};">${w}</span></span><span style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 17px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${n}</span><span class="num" style="font-size: 13px; font-weight: 500; color: ${t.muted};">${s}</span></span>${pr ? badgePR(t) : ''}<span style="color: ${t.muted}; display: flex;">${ic('chevR', 20)}</span></a>`).join(''), 'flex-shrink: 0; overflow: hidden;')}`).join('') }) };

const doneSet = (t, n, v, pr = false) => `<div style="display: grid; grid-template-columns: 20px minmax(0, 1fr) auto; column-gap: 12px; align-items: center; min-height: 40px; padding: 0 12px; border-radius: 8px; background: ${t.surface2};"><span class="num" style="font-size: 15px; color: ${t.muted};">${n}</span><span class="num" style="font-size: 18px;">${v}</span>${pr ? badgePR(t) : '<span></span>'}</div>`;
S['Detail-seance'] = { title: `Détail d'une séance`, page: 'j3', render: (t) => frame(t, { navActive: 'seance', main:
  header(t, 'Mardi 15 sept.', file(t, 'Historique'), `Retour à l'historique`, '', 22) +
  `<div class="num" style="flex-shrink: 0; font-size: 15px; font-weight: 500; color: ${t.muted}; margin-top: -8px; padding-left: 40px;">48 min · 5 exercices · 6 240 kg</div>` +
  [['Développé couché', 'Barre · objectif 8–12', [['80 kg × 12'], ['80 kg × 11'], ['80 kg × 10']]], ['Tractions', 'Poids du corps · objectif 6–10', [['× 9'], ['× 8'], ['× 7']]], ['Développé militaire', 'Haltères · kg par haltère', [['22 kg × 10', true], ['22 kg × 9']]]]
    .map(([n, s, sets]) => card(t, `<div style="display: flex; align-items: baseline; justify-content: space-between; gap: 8px;"><span style="font-size: 17px; font-weight: 700;">${n}</span><span style="font-size: 13px; color: ${t.muted};">${s}</span></div>${sets.map(([v, pr], i) => doneSet(t, i + 1, v, pr)).join('')}`, 'flex-shrink: 0; padding: 12px; display: flex; flex-direction: column; gap: 4px;')).join('') }) };

// ===== J4 · Repos =====
const nextSet = (t) => card(t, `<div style="font-size: 13px; color: ${t.muted};">Ensuite</div><div style="display: flex; justify-content: space-between; align-items: baseline;"><span style="font-size: 17px; font-weight: 600;">Squat · série 3</span><span class="num" style="font-size: 22px;">102,5 kg × 5</span></div><div style="font-size: 13px; color: ${t.muted};">objectif <span class="num">4–6</span> reps</div>`, 'flex-shrink: 0; padding: 12px 16px; display: flex; flex-direction: column; gap: 2px;');
const restMain = (t, { time, of, pct, label, chipTxt = '' }) =>
  seanceHeader(t, '26:35') +
  `<div role="timer" aria-label="Repos restant ${time}" style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;"><span style="display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; color: ${t.muted};">${label}${chipTxt}</span><a href="${file(t, 'Repos-termine')}" class="num" style="font-size: 88px; line-height: 88px; letter-spacing: -0.02em; color: ${t.text}; text-decoration: none;">${time}</a><span class="num" style="font-size: 15px; font-weight: 500; color: ${t.muted};">sur ${of}</span><div style="box-sizing: border-box; width: 100%; height: 10px; margin-top: 12px; border-radius: 5px; border: 1.5px solid ${t.strong}; overflow: hidden;"><div style="width: ${pct}%; height: 100%; background: ${t.text};"></div></div><span style="font-size: 13px; color: ${t.muted};">Son à la fin · l'écran reste allumé</span></div>` +
  progress(t, 2, 15, [67, 0, 0, 0, 0]) + nextSet(t) +
  `<div style="display: grid; grid-template-columns: 2fr 3fr; gap: 12px; flex-shrink: 0;">${btn.sec(t, '+15 s', file(t, 'Repos-prolonge'))}${btn.pri(t, 'Passer', file(t, 'Seance'), 'font-size: 20px; font-weight: 800;')}</div>`;

S['Repos'] = { title: 'Repos actif', page: 'j4', render: (t) => frame(t, { pad: '4px 16px 16px', main: restMain(t, { time: '1:24', of: '3:00', pct: 47, label: 'Repos' }) }) };

S['Repos-termine'] = { title: 'Repos terminé', page: 'j4', render: (t) => frame(t, { bg: t.accent, color: t.onAccent, pad: '4px 16px 16px', main:
  seanceHeader(t, '27:59', t.onAccent, t.onAccent) +
  `<div role="status" style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center; gap: 6px;"><div style="font-size: 17px; font-weight: 800;">Repos terminé · <span class="num">3:00</span></div><h1 style="margin: 16px 0 0; font-size: 40px; line-height: 44px; font-weight: 800; letter-spacing: -0.02em;">Squat · série 3</h1><div class="num" style="font-size: 104px; line-height: 100px; letter-spacing: -0.03em;">102,5<span style="font-size: 40px;"> kg</span></div><div style="font-size: 22px; font-weight: 700;"><span class="num" style="font-size: 30px;">× 5</span> reps · objectif <span class="num" style="font-size: 30px;">4–6</span></div></div>` +
  progress(t, 2, 15, [67, 0, 0, 0, 0], t.onAccent, t.onAccent, t.onAccent, t.onAccent) +
  `<div style="display: grid; grid-template-columns: 2fr 3fr; gap: 12px; flex-shrink: 0;">${btn.sec(t, '+15 s de repos', file(t, 'Repos-prolonge'), `min-height: 60px; border-color: ${t.onAccent}; color: ${t.onAccent};`)}<a href="${file(t, 'Seance')}" style="box-sizing: border-box; min-height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background: ${t.onAccent}; color: ${t.accent}; font-size: 20px; font-weight: 800; text-decoration: none;">C'est parti</a></div>` }) };

S['Repos-prolonge'] = { title: 'Repos prolongé (+15 s après la fin)', page: 'j4', render: (t) => frame(t, { pad: '4px 16px 16px', main:
  restMain(t, { time: '0:14', of: '0:15', pct: 7, label: 'Repos prolongé', chipTxt: `<span class="num" style="font-size: 13px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: ${t.surface2}; color: ${t.text};">+15 s</span>` }) }) };

// Séance réduite : on navigue ailleurs, une barre compacte ramène à la séance
const reglagesMain = (t) =>
  `<h1 style="${H1} flex-shrink: 0;">Réglages</h1>` +
  card(t, `<span style="width: 44px; height: 44px; flex-shrink: 0; border-radius: 12px; background: ${t.surface2}; display: flex; align-items: center; justify-content: center;">${ic('share', 22)}</span><div style="flex-grow: 1; display: flex; flex-direction: column; gap: 6px;"><div style="font-size: 17px; font-weight: 600;">Installer Sportix sur l'iPhone</div><ol style="margin: 0; padding-left: 18px; font-size: 15px; line-height: 21px; color: ${t.muted};"><li>Dans Safari, touche <strong style="color: ${t.text};">Partager</strong>.</li><li>Choisis <strong style="color: ${t.text};">Sur l'écran d'accueil</strong>.</li><li>Ouvre Sportix depuis son icône : l'app marche hors connexion.</li></ol></div>`, 'padding: 14px; display: flex; align-items: flex-start; gap: 12px; flex-shrink: 0;') +
  `<div style="display: flex; flex-direction: column; gap: 8px; flex-shrink: 0;">${lbl(t, 'Unité')}${seg(t, ['kg', 'lb'], 0, 'Unité de poids')}</div>` +
  `<div style="display: flex; flex-direction: column; gap: 8px; flex-shrink: 0;">${lbl(t, 'Séance')}${card(t,
    `<a href="#" style="display: flex; align-items: center; justify-content: space-between; min-height: 56px; padding: 0 12px 0 16px; color: ${t.text}; text-decoration: none;"><span style="font-size: 17px;">Repos par défaut</span><span style="display: flex; align-items: center; gap: 4px; color: ${t.muted};"><span class="num" style="font-size: 17px;">2:00</span>${ic('chevR', 20)}</span></a>` +
    `<label style="display: flex; align-items: center; justify-content: space-between; min-height: 56px; padding: 0 16px; border-top: 1px solid ${t.border};"><span style="font-size: 17px;">Son de fin de repos</span><input class="sw" type="checkbox" role="switch" checked></label>` +
    `<label style="display: flex; align-items: center; justify-content: space-between; min-height: 64px; padding: 0 16px; border-top: 1px solid ${t.border};"><span style="display: flex; flex-direction: column;"><span style="font-size: 17px;">Afficher le RPE</span><span style="font-size: 13px; color: ${t.muted};">Effort ressenti, noté de 1 à 10</span></span><input class="sw" type="checkbox" role="switch"></label>`, 'overflow: hidden;')}</div>`;
const reglagesMore = (t) =>
  `<div style="display: flex; flex-direction: column; gap: 8px; flex-shrink: 0;">${lbl(t, 'Pas de charge (boutons − / +)')}${card(t, [['Barre', '2,5 kg'], ['Smith', '2,5 kg'], ['Haltères <span style="font-size: 13px; color: ' + t.muted + ';">(par haltère)</span>', '2 kg'], ['Machine', '5 kg'], ['Poulie', '2,5 kg']].map(([n, v], i) => `<a href="#" style="display: flex; align-items: center; justify-content: space-between; min-height: 52px; padding: 0 12px 0 16px; color: ${t.text}; text-decoration: none; ${i ? `border-top: 1px solid ${t.border};` : ''}"><span style="font-size: 17px;">${n}</span><span style="display: flex; align-items: center; gap: 4px; color: ${t.muted};"><span class="num" style="font-size: 17px;">${v}</span>${ic('chevR', 20)}</span></a>`).join(''), 'overflow: hidden;')}</div>` +
  `<div style="display: flex; flex-direction: column; gap: 8px; flex-shrink: 0;">${lbl(t, 'Exercices')}${card(t, `<a href="${file(t, 'Biblio')}" style="display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 0 12px 0 16px; color: ${t.text}; text-decoration: none;"><span style="display: flex; color: ${t.muted};">${ic('book', 20)}</span><span style="flex-grow: 1; font-size: 17px;">Bibliothèque d'exercices</span><span class="num" style="font-size: 17px; color: ${t.muted};">32</span><span style="display: flex; color: ${t.muted};">${ic('chevR', 20)}</span></a>`, 'overflow: hidden;')}</div>` +
  `<p style="margin: 4px 0 0; font-size: 13px; line-height: 18px; color: ${t.muted}; text-align: center; flex-shrink: 0;">Tes données restent sur ce téléphone.</p>`;

S['Reglages'] = { title: 'Réglages (page qui défile)', page: 'reglages', h: 1180, render: (t) => frame(t, { h: 1180, navActive: 'reglages', gap: 16, main: reglagesMain(t) + reglagesMore(t) }) };

S['Seance-reduite'] = { title: 'Séance réduite (barre compacte)', page: 'j4', render: (t) => frame(t, { navActive: 'reglages', gap: 16, main: reglagesMain(t),
  bar: `<div style="flex-shrink: 0; padding: 8px 8px; background: ${t.bg};"><a href="${file(t, 'Repos')}" aria-label="Revenir à la séance, repos 1:24" style="box-sizing: border-box; min-height: 56px; padding: 0 6px 0 16px; border-radius: 16px; background: ${t.inverse}; color: ${t.onInverse}; display: flex; align-items: center; gap: 12px; text-decoration: none;"><span style="flex-grow: 1; display: flex; flex-direction: column;"><span style="font-size: 15px; font-weight: 700;">Séance en cours · repos</span><span style="font-size: 13px; color: ${t.onInverseMuted};">Squat · série 3 ensuite</span></span><span class="num" style="font-size: 22px;">1:24</span><span style="min-height: 44px; min-width: 64px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; border: 1.5px solid ${t.onInverse}; font-size: 15px; font-weight: 700;">+15 s</span></a></div>` }) };

// ---------- Écriture des fichiers ----------
const page = (t, title, h, body) => `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>${title} — ${t.name}</title>
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..800&amp;display=swap" rel="stylesheet">
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', system-ui, sans-serif; background: #d9d9d6; }
    a { color: inherit; } a:hover { color: inherit; }
    .num { font-variant-numeric: tabular-nums; font-weight: 700; }
    input::placeholder { color: ${t.faint}; }
    .sw { appearance: none; -webkit-appearance: none; flex-shrink: 0; width: 52px; height: 32px; margin: 0; border-radius: 16px; background: ${t.strong}; position: relative; cursor: pointer; }
    .sw::after { content: ""; position: absolute; top: 3px; left: 3px; width: 26px; height: 26px; border-radius: 13px; background: ${t.knob}; }
    .sw:checked { background: ${t.inverse}; }
    .sw:checked::after { left: 23px; background: ${t.onInverse}; }
  </style>
</helmet>
${body}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":390,"height":${h}}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
`;

const PAGES = [
  { id: 'j2', name: 'J2 · Exercices', order: ['Biblio', 'Biblio-vide', 'Exercice-nouveau', 'Exercice-modifier', 'Exercice-supprimer'] },
  { id: 'j3', name: 'J3 · Séance', order: ['Accueil-vide', 'Accueil-J3', 'Accueil', 'Seance-vide', 'Seance', 'Seance-menu', 'Choix-exercice', 'Creation-rapide', 'Recap', 'Historique-vide', 'Historique', 'Detail-seance'] },
  { id: 'j4', name: 'J4 · Repos', order: ['Repos', 'Repos-termine', 'Repos-prolonge', 'Seance-reduite'] },
  { id: 'reglages', name: 'Réglages', order: ['Reglages'] },
];

const boards = {}, order = [], notes = {};
for (const pg of PAGES) {
  const rowH = Math.max(...pg.order.map((id) => S[id].h || 844));
  THEMES.forEach((t, row) => {
    const y = row * (rowH + 420);
    notes[`${pg.id}-${t.key}`] = { x: 0, y: y - 300, text: `${pg.name} — thème ${t.name}`, kind: 'title1', page: pg.id, maxW: Math.max(1200, pg.order.length * 470 - 80) };
    pg.order.forEach((id, i) => {
      const s = S[id], h = s.h || 844, f = file(t, id);
      writeFileSync(new URL(f, OUT), page(t, s.title, h, s.render(t)));
      boards[f] = { x: i * 470, y, w: 390, h, title: `${s.title} — ${t.name}`, page: pg.id, is_interactive: true };
      order.push(f);
    });
  });
}
notes['j4-anim'] = { x: 4 * 470, y: 0, w: 380, page: 'j4', color: 'orange', size: 's',
  text: 'Animation « +15 s » (à coder au J4) : si on touche « +15 s de repos » sur l’écran de fin de repos, il repasse en repos actif en 320 ms : le « 102,5 kg » rétrécit jusqu’à la carte « Ensuite », le chrono grandit à sa place et décompte depuis 0:15.' };

writeFileSync(new URL('canvas.json', OUT), JSON.stringify({
  v: 3, attachments: {}, createdOnFiles: { v: 1, at: '2026-09-19T13:17:10Z' }, title: 'Sportix — Maquettes D5',
  launch: { view: 'canvas', page: 'j3' }, pages: PAGES.map(({ id, name }) => ({ id, name })), boards, order, notes, designSystems: [],
}, null, 2) + '\n');
console.log(order.length, 'planches');
