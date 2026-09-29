// Scène des pages avec vrai fondu enchaîné (J10). Quand l'adresse change, l'ancienne page est
// copiée (DOM, avec sa position de défilement) juste avant que React la retire, puis posée par-
// dessus la nouvelle : figée, non cliquable, invisible pour les lecteurs d'écran. Elle glisse un
// peu dans le sens opposé et s'efface pendant que la nouvelle arrive : les deux opacités sont
// complémentaires (l'une est `1 −` l'autre, même durée, même courbe), leur somme reste 1.
//
// Pourquoi un composant `class` : `getSnapshotBeforeUpdate` est le seul moment où l'on peut lire le
// DOM de l'ancienne page avant qu'il change (un `useLayoutEffect` arrive trop tard : la page a déjà
// été retirée). React n'a pas d'équivalent en hook.
//
// La copie est retirée de la page dès la fin de l'animation : un élément qui traîne, même invisible,
// colorerait la barre d'état d'iOS (leçon du J4). Elle est `absolute`, pas `fixed`.
import { Component, createRef, type ReactNode } from 'react'
import type { PageAnimation } from '../../lib/motion.ts'
import { prefersReducedMotion } from './useMotion.ts'

/** Durée du fondu (les deux pages), en ms. */
const CROSSFADE_MS = 280
/** Durée du glissement de l'ancienne page, en ms (comme l'arrivée de la nouvelle). */
const SLIDE_MS = 400

type Props = { path: string; animation: PageAnimation | null; children: ReactNode }
type Ghost = { node: HTMLElement; scrollTop: number; width: number; height: number }

/** Animation de départ de l'ancienne page selon le sens de la navigation. */
function ghostAnimation(animation: PageAnimation): string {
  const fade = `sx-effacer ${CROSSFADE_MS}ms ease-in-out forwards`
  // Un niveau plus bas : la page qu'on quitte part vers la gauche, en remontant elle part vers la droite
  if (animation === 'droite') return `sx-deplace-gauche ${SLIDE_MS}ms var(--ease-glisse) forwards, ${fade}`
  if (animation === 'gauche') return `sx-deplace-droite ${SLIDE_MS}ms var(--ease-glisse) forwards, ${fade}`
  return fade
}

class PageStage extends Component<Props> {
  private stage = createRef<HTMLDivElement>()
  private timers: number[] = []

  getSnapshotBeforeUpdate(previous: Props): Ghost | null {
    const stage = this.stage.current
    const { path, animation } = this.props
    if (!stage || previous.path === path || !animation || prefersReducedMotion()) return null
    const page = stage.querySelector<HTMLElement>(':scope > [data-page]')
    if (!page) return null
    const box = page.getBoundingClientRect()
    return { node: page.cloneNode(true) as HTMLElement, scrollTop: page.scrollTop, width: box.width, height: box.height }
  }

  componentDidUpdate(_previous: Props, _state: unknown, ghost: Ghost | null) {
    const stage = this.stage.current
    if (!stage) return
    // Une copie encore présente (deux navigations rapprochées) part tout de suite
    stage.querySelectorAll(':scope > [data-ghost]').forEach((old) => old.remove())
    if (!ghost || !this.props.animation) return
    const { node } = ghost
    node.removeAttribute('data-page')
    node.setAttribute('data-ghost', '')
    node.setAttribute('aria-hidden', 'true')
    node.inert = true
    node.classList.add('sx-fantome')
    // Même taille que l'ancienne page (l'écran a pu changer de taille : onglets masqués…), posée
    // dans le coin ; l'animation d'arrivée copiée avec elle est remplacée par celle du départ.
    Object.assign(node.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: `${ghost.width}px`,
      height: `${ghost.height}px`,
      pointerEvents: 'none',
      animation: ghostAnimation(this.props.animation),
    })
    stage.appendChild(node)
    node.scrollTop = ghost.scrollTop
    const timer = window.setTimeout(() => node.remove(), Math.max(SLIDE_MS, CROSSFADE_MS) + 40)
    this.timers.push(timer)
  }

  componentWillUnmount() {
    this.timers.forEach((timer) => window.clearTimeout(timer))
  }

  render() {
    return (
      <div ref={this.stage} className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {this.props.children}
      </div>
    )
  }
}

export default PageStage
