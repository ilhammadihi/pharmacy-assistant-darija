/** Tuile chiffre-cle : une valeur unique, lisible d'un coup d'oeil.
 *  Pas de graphique pour une seule valeur -- voir le skill dataviz,
 *  "Is it even a chart?". */
export default function StatTile({ libelle, valeur, legende }) {
  return (
    <div className="stat-tuile">
      <div className="stat-valeur">{valeur}</div>
      <div className="stat-libelle">{libelle}</div>
      {legende && <div className="stat-legende">{legende}</div>}
    </div>
  )
}
