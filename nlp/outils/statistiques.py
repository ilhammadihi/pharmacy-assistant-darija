"""Statistiques agregees sur les bases de reference, pour la page Tableau de
bord de l'interface (exploration des donnees, pas evaluation du bot).

Calculees une fois par serveur (les CSV ne changent pas en cours de route) et
mises en cache, comme le matcher de medicaments (voir resolution.py).
"""
from functools import lru_cache

import pandas as pd

from nlp.config import DATA_CLEAN

TOP_N = 8

# Ordre du moins au plus precis : l'ordre du graphique (voir Dashboard.jsx)
# suit celui-ci, pas l'ordre alphabetique.
PRECISION_GPS_ORDRE = ["exacte", "rue", "quartier", "ville", "inconnue"]


def _repartition(serie: pd.Series, valeur_vide: str = "Non precise") -> list[dict]:
    """Une colonne categorielle -> liste {libelle, valeur} triee par effectif
    decroissant, les valeurs manquantes regroupees sous `valeur_vide`."""
    comptes = serie.fillna(valeur_vide).value_counts()
    return [{"libelle": libelle, "valeur": int(valeur)} for libelle, valeur in comptes.items()]


def _top(serie: pd.Series, n: int = TOP_N) -> list[dict]:
    """Comme `_repartition`, mais les valeurs manquantes sont ecartees (pas de
    sens a classer "non precise" parmi un Top 10) et limite a `n`."""
    comptes = serie.dropna().value_counts().head(n)
    return [{"libelle": libelle, "valeur": int(valeur)} for libelle, valeur in comptes.items()]


@lru_cache(maxsize=1)
def calculer_statistiques() -> dict:
    meds = pd.read_csv(DATA_CLEAN / "medicaments_reference.csv", dtype=str)
    pharmacies = pd.read_csv(DATA_CLEAN / "pharmacies_fusion.csv", dtype=str)

    total_meds = len(meds)
    precision = pharmacies["precision_gps"].fillna("inconnue")
    precision_comptes = precision.value_counts()

    return {
        "medicaments": {
            "total_lignes": total_meds,
            "produits_uniques": int(meds["nom"].nunique()),
            "couverture_cnops": round(100 * meds["taux_remboursement_cnops"].notna().mean(), 1),
            "couverture_cnss": round(100 * meds["taux_remboursement_cnss"].notna().mean(), 1),
            "top_classes_therapeutiques": _top(meds["classe_therapeutique"]),
            "top_laboratoires": _top(meds["laboratoire"]),
            "par_source": _repartition(meds["source"]),
        },
        "pharmacies": {
            "total": len(pharmacies),
            "part_gps_exacte": round(100 * (precision == "exacte").mean(), 1),
            "precision_gps": [
                {"libelle": cle, "valeur": int(precision_comptes.get(cle, 0))}
                for cle in PRECISION_GPS_ORDRE
            ],
            "top_villes": _top(pharmacies["ville"]),
        },
    }
