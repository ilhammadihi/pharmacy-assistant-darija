import { useEffect, useState } from 'react'
import Header from '../components/Header'
import StatTile from '../components/StatTile'
import BarreClassement from '../components/BarreClassement'
import RepartitionEmpilee from '../components/RepartitionEmpilee'
import LoadingState from '../components/LoadingState'
import { ApiError, obtenirStatistiques } from '../lib/api'

const COULEURS_CATEGORIELLES = ['viz-1', 'viz-2', 'viz-3', 'viz-4', 'viz-5', 'viz-6', 'viz-7']
  .map((v) => `var(--${v})`)

// Du plus au moins precis ; "inconnue" est hors echelle (gris neutre, pas
// "pire que ville" -- on ne sait juste pas).
const COULEURS_PRECISION = {
  exacte: 'var(--viz-ordinal-4)',
  rue: 'var(--viz-ordinal-3)',
  quartier: 'var(--viz-ordinal-2)',
  ville: 'var(--viz-ordinal-1)',
  inconnue: 'var(--encre-pale)',
}

const LIBELLES_PRECISION = {
  exacte: 'Position exacte',
  rue: 'Rue',
  quartier: 'Quartier',
  ville: 'Centre-ville (approximatif)',
  inconnue: 'Inconnue',
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    const controleur = new AbortController()
    obtenirStatistiques({ signal: controleur.signal })
      .then(setStats)
      .catch((err) => {
        if (err.name === 'AbortError') return
        setErreur(err instanceof ApiError ? err.message : 'Statistiques indisponibles pour le moment.')
      })
    return () => controleur.abort()
  }, [])

  if (erreur) {
    return (
      <div className="page">
        <Header titre="Tableau de bord" sousTitre="Vue d'ensemble des donnees qui alimentent DwaTalk." />
        <div className="vide" style={{ marginTop: 28 }}>
          <div className="vide-glyphe" aria-hidden="true">🔌</div>
          <h3>Tableau de bord indisponible</h3>
          <p>{erreur}</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="page">
        <Header titre="Tableau de bord" sousTitre="Vue d'ensemble des donnees qui alimentent DwaTalk." />
        <div style={{ marginTop: 28 }}>
          <LoadingState variante="fiches" nombre={4} />
        </div>
      </div>
    )
  }

  const { medicaments, pharmacies } = stats

  const segmentsSource = medicaments.par_source.map((s, i) => ({
    libelle: s.libelle,
    valeur: s.valeur,
    couleur: COULEURS_CATEGORIELLES[i % COULEURS_CATEGORIELLES.length],
  }))

  const segmentsPrecision = pharmacies.precision_gps.map((s) => ({
    libelle: LIBELLES_PRECISION[s.libelle] ?? s.libelle,
    valeur: s.valeur,
    couleur: COULEURS_PRECISION[s.libelle] ?? 'var(--encre-pale)',
  }))

  return (
    <div className="page">
      <Header titre="Tableau de bord" sousTitre="Vue d'ensemble des donnees qui alimentent DwaTalk." />

      <h2 className="section-titre">Medicaments</h2>
      <div className="stat-rangee">
        <StatTile
          libelle="Produits uniques"
          valeur={medicaments.produits_uniques.toLocaleString('fr-FR')}
          legende={`${medicaments.total_lignes.toLocaleString('fr-FR')} lignes (AMMPS + CNOPS + CNSS)`}
        />
        <StatTile
          libelle="Couverture remboursement CNOPS"
          valeur={`${medicaments.couverture_cnops}%`}
          legende="des produits ont un taux CNOPS connu"
        />
        <StatTile
          libelle="Couverture remboursement CNSS"
          valeur={`${medicaments.couverture_cnss}%`}
          legende="des produits ont un taux CNSS connu"
        />
      </div>

      <div className="viz-grille">
        <BarreClassement titre="Classes therapeutiques les plus representees" donnees={medicaments.top_classes_therapeutiques} />
        <BarreClassement titre="Laboratoires les plus representees" donnees={medicaments.top_laboratoires} />
      </div>

      <RepartitionEmpilee
        titre="D'ou vient chaque produit"
        segments={segmentsSource}
        note="Un produit peut venir d'une seule source (ex. « ammps ») ou de plusieurs a la fois quand elles le documentent toutes (ex. « ammps+cnops+cnss »)."
      />

      <h2 className="section-titre" style={{ marginTop: 44 }}>Pharmacies</h2>
      <div className="stat-rangee">
        <StatTile
          libelle="Pharmacies repertoriees"
          valeur={pharmacies.total.toLocaleString('fr-FR')}
          legende="OpenStreetMap + annuaire"
        />
        <StatTile
          libelle="Position exacte connue"
          valeur={`${pharmacies.part_gps_exacte}%`}
          legende="le reste est approximatif ou inconnu"
        />
      </div>

      <div className="viz-grille">
        <RepartitionEmpilee
          titre="Precision de la position GPS"
          segments={segmentsPrecision}
          note="Seule une position « exacte » designe l'officine elle-meme : les autres niveaux centrent sur la rue, le quartier ou la ville, faute de mieux."
        />
        <BarreClassement titre="Villes les mieux couvertes" donnees={pharmacies.top_villes} />
      </div>
    </div>
  )
}
