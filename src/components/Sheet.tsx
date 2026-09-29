// Panneau qui monte du bas de l'écran, par-dessus la page (menu, confirmation…).
// Un voile sombre couvre le reste : le toucher ferme le panneau, tout comme la touche Échap.
// Le focus est placé dans le panneau à l'ouverture (clavier et lecteurs d'écran).
// J10 : il glisse depuis le bas et redescend à la fermeture. L'entrée est la sortie passée à
// l'envers : même durée (200 ms) et courbe symétrique (ease-out `0.16, 1, 0.3, 1` face à ease-in
// `0.7, 0, 0.84, 0`, l'une est le miroir exact de l'autre). À la fermeture il reste affiché le temps
// de sa sortie, puis quitte la page. Il doit la quitter pour de bon : même invisible, un voile `fixed`
// qui couvre le haut de l'écran colore la barre d'état d'iOS (leçon du J4).
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { EXIT_MS, prefersReducedMotion } from '../features/motion/useMotion.ts'

type Props = { open: boolean; onClose: () => void; label: string; children: ReactNode }

function Sheet({ open, onClose, label, children }: Props) {
  const panel = useRef<HTMLElement>(null)
  // Pendant la sortie, le panneau montre ce qu'il affichait ouvert : les écrans vident souvent son
  // contenu (`{menu && …}`) au moment où ils le ferment, il redescendrait sinon tout vide.
  const [shown, setShown] = useState(children)
  if (open && shown !== children) setShown(children)
  // Fermeture en cours : le panneau reste le temps de son animation
  const [leaving, setLeaving] = useState(false)
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    setLeaving(!open)
  }

  useEffect(() => {
    if (open) panel.current?.focus()
  }, [open])

  // Retiré au bout du temps de l'animation, sans attendre `animationend` (l'iPhone ne le signale
  // pas toujours) ; avec « Réduire les animations », il part aussitôt.
  useEffect(() => {
    if (!leaving) return
    const timer = window.setTimeout(() => setLeaving(false), prefersReducedMotion() ? 0 : EXIT_MS + 30)
    return () => window.clearTimeout(timer)
  }, [leaving])

  if (!open && !leaving) return null

  return (
    <div className={`fixed inset-0 z-50 flex flex-col justify-end ${open ? '' : 'pointer-events-none'}`}>
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 ${
          open ? 'animate-[sx-voile-entre_200ms_var(--ease-out)]' : 'animate-[sx-effacer_200ms_var(--ease-in)_forwards]'
        }`}
      />
      <section
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        aria-hidden={open ? undefined : true}
        tabIndex={-1}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        className={`relative flex flex-col gap-4 rounded-t-lg bg-surface px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+16px)] text-text shadow-[0_-8px_24px_rgb(0_0_0/0.25)] outline-none ${
          open ? 'animate-[sx-panneau-entre_200ms_var(--ease-out)]' : 'animate-[sx-panneau-sort_200ms_var(--ease-in)_forwards]'
        }`}
      >
        <span aria-hidden="true" className="h-[5px] w-9 self-center rounded-full bg-border-strong" />
        {open ? children : shown}
      </section>
    </div>
  )
}

export default Sheet
