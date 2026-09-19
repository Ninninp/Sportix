// Bouton du design system (planche « Composants » de D4).
// - primary   : l'action principale de l'écran, couleur accent (un seul par écran)
// - secondary : contour, pour l'action d'à côté (+15 s, Annuler…)
// - danger    : suppression
// - link      : lien discret souligné (ex. « Terminer »)
// - hero      : bouton « Démarrer » posé sur une carte inversée (60 px)
// Avec `to`, le bouton devient un lien de navigation (React Router) au même style.
import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from 'react'
import { Link } from 'react-router'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'link' | 'hero'

const base =
  'inline-flex items-center justify-center gap-2 font-sans no-underline select-none ' +
  'transition-transform duration-[120ms] ease-out active:scale-[0.97] ' +
  'disabled:active:scale-100 disabled:cursor-not-allowed'

const variants: Record<ButtonVariant, string> = {
  primary:
    'min-h-14 w-full rounded-md border-[1.5px] border-accent bg-accent px-4 text-body-strong font-bold text-on-accent ' +
    'disabled:border-surface-2 disabled:bg-surface-2 disabled:text-faint',
  secondary:
    'min-h-14 w-full rounded-md border-[1.5px] border-text bg-transparent px-4 text-body-strong font-bold text-text ' +
    'disabled:border-surface-2 disabled:bg-surface-2 disabled:text-faint',
  danger: 'min-h-14 w-full rounded-md border-[1.5px] border-danger bg-danger px-4 text-body-strong font-bold text-on-danger',
  link: 'min-h-12 px-3 text-body font-semibold text-muted underline underline-offset-[3px]',
  // Désactivé : code « à venir » du design system (contour pointillé, texte atténué)
  hero:
    'min-h-15 w-full rounded-md border-[1.5px] border-hero-action bg-hero-action px-4 text-[20px] leading-6 font-extrabold text-on-hero-action ' +
    'disabled:border-dashed disabled:border-on-inverse-muted disabled:bg-transparent disabled:text-on-inverse-muted',
}

// onClick accepte un bouton comme un lien (le composant peut rendre l'un ou l'autre)
type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & {
  onClick?: MouseEventHandler<HTMLElement>
  variant?: ButtonVariant
  to?: string
  children: ReactNode
}

function Button({ variant = 'primary', to, className = '', children, ...rest }: Props) {
  const classes = `${base} ${variants[variant]} ${className}`
  // Un lien ne sait pas être « désactivé » : désactivé, on affiche un vrai bouton inerte.
  if (to && !rest.disabled) {
    const { onClick, id, title, 'aria-label': ariaLabel, 'aria-describedby': ariaDescribedBy } = rest
    return (
      <Link
        to={to}
        className={classes}
        onClick={onClick}
        id={id}
        title={title}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
      >
        {children}
      </Link>
    )
  }
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  )
}

export default Button
