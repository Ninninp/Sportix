// Choix d'un exercice à ajouter à la séance (maquette D5 « Choix d'exercice »).
// Sert aussi au remplacement : /seance/exercices?remplace=<rang de l'exercice>.
// La liste elle-même est le composant partagé ExercisePicker.
import { useNavigate, useSearchParams } from 'react-router'
import { addExerciseToSession, replaceExercise } from '../../db/sessions.ts'
import ExercisePicker from '../exercises/ExercisePicker.tsx'
import { useActiveSession, useHistorySets } from './useSession.ts'

function ExercisePickerPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const replaceOrder = params.get('remplace') ? Number(params.get('remplace')) : null
  const session = useActiveSession()
  const history = useHistorySets(session?.id ?? undefined)

  if (!session || history === undefined) return null

  return (
    <ExercisePicker
      title={replaceOrder !== null ? 'Remplacer l’exercice' : 'Ajouter un exercice'}
      backTo="/seance"
      backLabel="Retour à la séance"
      history={history}
      onChoose={async (exercise, variant) => {
        if (replaceOrder !== null) await replaceExercise(session.id, replaceOrder, exercise.id, variant)
        else await addExerciseToSession(session.id, exercise.id, variant)
        navigate('/seance', { replace: true })
      }}
    />
  )
}

export default ExercisePickerPage
