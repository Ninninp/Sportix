// Choix d'un exercice à ajouter à un jour du programme (même liste que pendant la séance).
// Une fois l'exercice choisi, retour au programme avec son panneau ouvert pour le régler.
import { useNavigate, useParams } from 'react-router'
import { addDayExercise } from '../../db/programs.ts'
import ExercisePicker from '../exercises/ExercisePicker.tsx'
import { useHistorySets } from '../sessions/useSession.ts'

function ProgramExercisePickerPage() {
  const { id, dayId } = useParams()
  const navigate = useNavigate()
  const history = useHistorySets()
  if (history === undefined || !id || !dayId) return null

  return (
    <ExercisePicker
      title="Ajouter un exercice"
      backTo={`/programmes/${id}`}
      backLabel="Retour au programme"
      history={history}
      onChoose={async (exercise, variant) => {
        const exerciseId = await addDayExercise(dayId, exercise.id, variant)
        navigate(`/programmes/${id}?exercice=${exerciseId}`, { replace: true })
      }}
    />
  )
}

export default ProgramExercisePickerPage
