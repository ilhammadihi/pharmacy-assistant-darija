"""Statistiques agregees pour la page Tableau de bord."""
from nlp.outils.statistiques import PRECISION_GPS_ORDRE, calculer_statistiques


def test_totaux_coherents_avec_les_sous_comptes():
    s = calculer_statistiques()
    assert s["medicaments"]["total_lignes"] > s["medicaments"]["produits_uniques"] > 0
    assert sum(x["valeur"] for x in s["medicaments"]["par_source"]) == s["medicaments"]["total_lignes"]


def test_couverture_remboursement_en_pourcentage():
    s = calculer_statistiques()
    assert 0 <= s["medicaments"]["couverture_cnops"] <= 100
    assert 0 <= s["medicaments"]["couverture_cnss"] <= 100


def test_top_classes_triees_et_sans_valeur_manquante():
    s = calculer_statistiques()
    top = s["medicaments"]["top_classes_therapeutiques"]
    assert len(top) <= 8
    assert all(x["libelle"] for x in top)  # pas de "nan" ou de case vide
    valeurs = [x["valeur"] for x in top]
    assert valeurs == sorted(valeurs, reverse=True)


def test_precision_gps_dans_l_ordre_du_moins_au_plus_precis():
    s = calculer_statistiques()
    precision = s["pharmacies"]["precision_gps"]
    assert [x["libelle"] for x in precision] == PRECISION_GPS_ORDRE
    assert sum(x["valeur"] for x in precision) == s["pharmacies"]["total"]


def test_api_statistiques(client):
    d = client.get("/statistiques").json()
    assert d["medicaments"]["total_lignes"] > 0
    assert d["pharmacies"]["total"] > 0
