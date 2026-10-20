/** Part-du-tout : une seule barre empilee (100% de large), plus une legende
 *  -- jamais color-only, chaque segment porte son libelle et son
 *  pourcentage. Un ecart de 2px (couleur de la surface) separe les
 *  segments, comme prescrit pour une barre empilee. */
export default function RepartitionEmpilee({ titre, segments, note }) {
  const total = segments.reduce((s, x) => s + x.valeur, 0) || 1

  return (
    <div className="viz-bloc">
      <h3 className="viz-titre">{titre}</h3>
      <div className="viz-empilee" role="img" aria-label={segments.map((s) => `${s.libelle} ${Math.round((s.valeur / total) * 100)}%`).join(', ')}>
        {segments.map((s) => (
          <div
            key={s.libelle}
            className="viz-empilee-segment"
            style={{ width: `${(s.valeur / total) * 100}%`, background: s.couleur }}
            title={`${s.libelle} : ${Math.round((s.valeur / total) * 100)}%`}
          />
        ))}
      </div>
      <ul className="viz-legende">
        {segments.map((s) => (
          <li key={s.libelle}>
            <span className="viz-legende-puce" style={{ background: s.couleur }} aria-hidden="true" />
            <span className="viz-legende-libelle">{s.libelle}</span>
            <span className="viz-legende-valeur">{Math.round((s.valeur / total) * 100)}%</span>
          </li>
        ))}
      </ul>
      {note && <p className="viz-note">{note}</p>}
    </div>
  )
}
