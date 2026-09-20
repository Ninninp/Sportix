// Panneau qui monte du bas de l'écran, par-dessus la page (menu, confirmation…).
// Un voile sombre couvre le reste : le toucher ferme le panneau, tout comme la touche Échap.
// Le focus est placé dans le panneau à l'ouverture (clavier et lecteurs d'écran).
import { useEffect, useRef, type ReactNode } from 'react'

type Props = { open: boolean; onClose: () => void; label: string; children: ReactNode }

function Sheet({ open, onClose, label, children }: Props) {
  const panel = useRef<HTMLElement>(null)

  useEffect(() => {
    if (open) panel.current?.focus()
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button type="button" aria-label="Fermer" onClick={onClose} className="absolute inset-0 bg-black/50" />
      <section
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        className="relative flex flex-col gap-4 rounded-t-lg bg-surface px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+16px)] text-text shadow-[0_-8px_24px_rgb(0_0_0/0.25)] outline-none"
      >
        <span aria-hidden="true" className="h-[5px] w-9 self-center rounded-full bg-border-strong" />
        {children}
      </section>
    </div>
  )
}

export default Sheet
