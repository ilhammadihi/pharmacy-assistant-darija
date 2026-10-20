/** Classement par magnitude (Top N) : une barre horizontale par ligne, meme
 *  teinte pour toutes (encodage sequentiel a une seule teinte -- la longueur
 *  porte la grandeur, pas la couleur). Valeur affichee au bout de la barre
 *  (etiquette directe), jamais seulement en legende. */
export default function BarreClassement({ titre, donnees, formaterValeur = (v) => v.toLocaleString('fr-FR') }) {
  const max = Math.max(...donnees.map((d) => d.valeur), 1)

  return (
    <div className="viz-bloc">
      <h3 className="viz-titre">{titre}</h3>
      <div className="viz-classement">
        {donnees.map((d) => (
          <div className="viz-ligne" key={d.libelle} title={`${d.libelle} : ${formaterValeur(d.valeur)}`}>
            <span className="viz-ligne-libelle">{d.libelle}</span>
            <div className="viz-ligne-piste">
              <div className="viz-ligne-barre" style={{ width: `${(d.valeur / max) * 100}%` }} />
            </div>
            <span className="viz-ligne-valeur">{formaterValeur(d.valeur)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
