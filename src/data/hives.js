// Données en mémoire pour le TP 2 : quelques ruches de deux sites, copiées du jeu de données.
// Pas encore de base de données : tout est perdu au redémarrage du serveur.

export const hives = [
  { id: "SN-CASA-001", site_id: "SN-CASA", status: "active" },
  { id: "SN-CASA-002", site_id: "SN-CASA", status: "active" },
  { id: "SN-CASA-003", site_id: "SN-CASA", status: "active" },
  { id: "SN-SEDH-001", site_id: "SN-SEDH", status: "active" },
  { id: "SN-SEDH-002", site_id: "SN-SEDH", status: "active" },
];

// Les mesures reçues, ajoutées par POST /api/hives/:id/measures.
export const measures = [];
