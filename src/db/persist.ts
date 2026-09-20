// Demande au navigateur de garder les données de Sportix pour de bon.
// Sans cela, un navigateur à court de place peut effacer les données d'un site
// (Safari le fait aussi pour les sites peu visités). Une app installée l'obtient généralement.
export async function requestPersistentStorage(): Promise<void> {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist()
    }
  } catch {
    // Non disponible sur ce navigateur : les données restent tout de même enregistrées.
  }
}
