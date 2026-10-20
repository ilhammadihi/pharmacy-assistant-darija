import { useEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import MedicineCard from '../components/MedicineCard'
import MedicineDetails from '../components/MedicineDetails'
import LoadingState from '../components/LoadingState'
import SafetyNotice from '../components/SafetyNotice'
import { ApiError, reconnaitreBoite } from '../lib/api'

const TYPES_ACCEPTES = 'image/jpeg,image/png,image/webp'

function Appareil() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
        stroke="currentColor" strokeWidth="2" strokeLinejoin="round"
      />
      <circle cx="12" cy="13.5" r="3.4" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

export default function Scan() {
  const [fichier, setFichier] = useState(null)
  const [apercu, setApercu] = useState(null)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [reponse, setReponse] = useState(null)
  const [ouvert, setOuvert] = useState(null)
  const [survol, setSurvol] = useState(false)

  const entreeRef = useRef(null)
  const abandonRef = useRef(null)

  // l'URL de previsualisation est a liberer explicitement (object URL), sinon
  // elle reste en memoire tant que l'onglet vit
  useEffect(() => () => apercu && URL.revokeObjectURL(apercu), [apercu])
  useEffect(() => () => abandonRef.current?.abort(), [])

  function accepterFichier(f) {
    if (!f) return
    if (!TYPES_ACCEPTES.split(',').includes(f.type)) {
      setErreur('Format non supporte. Utilise une image JPEG, PNG ou WEBP.')
      return
    }
    setApercu((avant) => {
      if (avant) URL.revokeObjectURL(avant)
      return URL.createObjectURL(f)
    })
    setFichier(f)
    setReponse(null)
    setErreur(null)
    setOuvert(null)
  }

  function choisir(e) {
    accepterFichier(e.target.files?.[0])
  }

  function deposer(e) {
    e.preventDefault()
    setSurvol(false)
    accepterFichier(e.dataTransfer.files?.[0])
  }

  function reprendre() {
    setFichier(null)
    setApercu((avant) => {
      if (avant) URL.revokeObjectURL(avant)
      return null
    })
    setReponse(null)
    setErreur(null)
    setOuvert(null)
    if (entreeRef.current) entreeRef.current.value = ''
  }

  async function analyser() {
    if (!fichier) return
    abandonRef.current?.abort()
    const controleur = new AbortController()
    abandonRef.current = controleur

    setEnCours(true)
    setErreur(null)
    setOuvert(null)
    try {
      const data = await reconnaitreBoite(fichier, { signal: controleur.signal })
      setReponse(data)
    } catch (err) {
      if (err.name === 'AbortError') return
      setErreur(err instanceof ApiError ? err.message : "L'analyse n'a pas abouti.")
    } finally {
      if (!controleur.signal.aborted) setEnCours(false)
    }
  }

  return (
    <div className="page">
      <Header
        titre="Scanner une boite"
        sousTitre="Prends en photo une boite de medicament : DwaTalk lit le texte (arabe ou francais) et cherche le produit dans la base."
      />

      {!apercu && (
        <label
          className={`scan-zone ${survol ? 'scan-zone-survol' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setSurvol(true) }}
          onDragLeave={() => setSurvol(false)}
          onDrop={deposer}
        >
          <input
            ref={entreeRef}
            type="file"
            accept={TYPES_ACCEPTES}
            capture="environment"
            onChange={choisir}
            className="invisible"
          />
          <span className="scan-zone-icone" aria-hidden="true"><Appareil /></span>
          <span className="scan-zone-titre">Prendre, choisir ou glisser une photo</span>
          <span className="scan-zone-aide">JPEG, PNG ou WEBP — 10 Mo maximum</span>
        </label>
      )}

      {erreur && !apercu && (
        <p className="champ-aide" role="alert" style={{ marginTop: 10 }}>{erreur}</p>
      )}

      {apercu && (
        <div className="scan-apercu">
          <img src={apercu} alt="Photo de la boite a analyser" />
          <div className="scan-apercu-actions">
            <button className="bouton-doux" onClick={reprendre} disabled={enCours}>
              ↺ Reprendre une photo
            </button>
            {!reponse && (
              <button className="bouton-principal" onClick={analyser} disabled={enCours}>
                {enCours ? 'Analyse en cours…' : 'Analyser la photo'}
              </button>
            )}
          </div>
        </div>
      )}

      {enCours && (
        <div style={{ marginTop: 28 }}>
          <LoadingState variante="fiches" nombre={3} />
        </div>
      )}

      {erreur && apercu && (
        <div className="vide" style={{ marginTop: 28 }}>
          <div className="vide-glyphe" aria-hidden="true">🔌</div>
          <h3>Analyse indisponible</h3>
          <p>{erreur}</p>
        </div>
      )}

      {!enCours && !erreur && reponse && !reponse.reussite && (
        <div className="vide" style={{ marginTop: 28 }}>
          <div className="vide-glyphe" aria-hidden="true">🔍</div>
          <h3>Aucun texte detecte</h3>
          <p>{reponse.message}</p>
        </div>
      )}

      {!enCours && !erreur && reponse?.reussite && reponse.resultats.length === 0 && (
        <div className="vide" style={{ marginTop: 28 }}>
          <div className="vide-glyphe" aria-hidden="true">💊</div>
          <h3>Medicament non reconnu</h3>
          <p>{reponse.message}</p>
          {reponse.texte_detecte.length > 0 && (
            <p className="scan-texte-lu">Texte lu sur la photo : {reponse.texte_detecte.join(' · ')}</p>
          )}
        </div>
      )}

      {!enCours && ouvert && (
        <div style={{ marginTop: 28 }}>
          <button className="bouton-doux" onClick={() => setOuvert(null)} style={{ marginBottom: 16 }}>
            ← Retour aux resultats
          </button>
          <MedicineDetails resultat={ouvert} />
        </div>
      )}

      {!enCours && !ouvert && reponse?.reussite && reponse.resultats.length > 0 && (
        <>
          <h2 className="section-titre">
            {reponse.resultats.length > 1 ? 'Medicaments possibles' : 'Medicament reconnu'}
          </h2>
          {reponse.texte_detecte.length > 0 && (
            <p className="scan-texte-lu">Texte lu sur la photo : {reponse.texte_detecte.join(' · ')}</p>
          )}
          <div className="grille-fiches" style={{ marginTop: 14 }}>
            {reponse.resultats.map((r, i) => (
              <MedicineCard key={`${r.nom_candidat}-${i}`} resultat={r} onOuvrir={setOuvert} />
            ))}
          </div>
        </>
      )}

      {!apercu && (
        <div style={{ marginTop: 34 }}>
          <SafetyNotice />
        </div>
      )}
    </div>
  )
}
