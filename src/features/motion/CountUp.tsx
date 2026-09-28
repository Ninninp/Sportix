// Chiffre qui défile jusqu'à sa valeur à l'arrivée sur l'écran (J10) : chiffres de la semaine sur
// l'accueil, tuiles du récapitulatif. `format` met en forme la valeur du moment (« 1 h 04 », « 9 240 kg ») ;
// les lecteurs d'écran lisent directement la valeur finale.
import { useCountUp } from './useMotion.ts'

type Props = { value: number; format: (value: number) => string }

function CountUp({ value, format }: Props) {
  const shown = useCountUp(value)
  return (
    <>
      <span aria-hidden="true">{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  )
}

export default CountUp
