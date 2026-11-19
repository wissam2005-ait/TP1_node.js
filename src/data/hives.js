// Données en mémoire : quelques ruches de deux sites, copiées du jeu de données.
// Pas encore de base de données : tout ce qui est ajouté est perdu au redémarrage.

import { readFileSync } from "node:fs";
import { join } from "node:path";

export const hives = [
  { id: "SN-CASA-001", site_id: "SN-CASA", status: "active" },
  { id: "SN-CASA-002", site_id: "SN-CASA", status: "active" },
  { id: "SN-CASA-003", site_id: "SN-CASA", status: "active" },
  { id: "SN-SEDH-001", site_id: "SN-SEDH", status: "active" },
  { id: "SN-SEDH-002", site_id: "SN-SEDH", status: "active" },
];

// Mesures : chargées au démarrage depuis le fichier d'une journée (96 mesures par ruche
// SN-CASA, une toutes les 15 minutes), pour avoir de quoi paginer.
// readFileSync est acceptable ici : on est au démarrage, aucune requête n'attend.
const FICHIER = join(import.meta.dirname, "..", "..", "data", "mesures-SN-CASA-2026-10-31.ndjson");
const ids = new Set(hives.map((h) => h.id));

export const measures = readFileSync(FICHIER, "utf8")
  .split("\n")
  .filter((ligne) => ligne.trim() !== "")
  .map((ligne) => JSON.parse(ligne))
  .filter((m) => ids.has(m.hive_id));

// Inspections saisies sur le terrain. L'identifiant est un UUID choisi par l'application mobile.
export const inspections = [
  {
    id: "0b6c4a0e-6f1f-4d8e-9a3b-1c2d3e4f5a6b",
    hive_id: "SN-CASA-001",
    inspected_at: "2026-10-28T09:30:00Z",
    colony_status: "forte",
    queen_present: true,
    observations: "Couvain compact, bonnes réserves de miel.",
  },
  {
    id: "7d1e2f3a-4b5c-4d6e-8f7a-9b0c1d2e3f4a",
    hive_id: "SN-CASA-001",
    inspected_at: "2026-10-14T10:00:00Z",
    colony_status: "normale",
    queen_present: true,
    observations: null,
  },
];