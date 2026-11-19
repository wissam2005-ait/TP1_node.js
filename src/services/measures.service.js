// Service des mesures : les règles métier sur les mesures.
// Il reçoit ses dépendances en paramètre : il n'importe jamais de repository.

import { ValidationError } from "../errors.js";

// Plages physiques retenues pour le module (UC-CY02 du cahier des charges, champs du § 6.5).
export const PHYSICAL_RANGES = {
  position_lat: { min: -90, max: 90 },
  position_lon: { min: -180, max: 180 },
  weight_kg: { min: 0, max: 150 },
  temp_internal_c: { min: -10, max: 60 },
  temp_external_c: { min: -20, max: 60 },
  humidity_pct: { min: 0, max: 100 },
  acoustic_activity_score: { min: 0, max: 1 },
  battery_pct: { min: 0, max: 100 },
};

export function createMeasuresService({ hivesService, measuresRepository }) {
  return {
    // Une page de mesures d'une ruche. limit et offset sont déjà des entiers valides.
    async listMeasures(hiveId, { limit, offset }) {
      const hive = await hivesService.getHive(hiveId);
      const items = await measuresRepository.findByHive(hive.id, { limit, offset });
      return { items, limit, offset };
    },

    // Enregistre une mesure envoyée par la passerelle, après contrôle.
    async addMeasure(hiveId, data) {
      const hive = await hivesService.getHive(hiveId);

      // Seuls timestamp et weight_kg sont obligatoires.
      if (data.timestamp === undefined || data.weight_kg === undefined) {
        throw new ValidationError("Les champs timestamp et weight_kg sont obligatoires.");
      }

      // Si la trame contient un hive_id, ce doit être celui du chemin.
      if (data.hive_id !== undefined && data.hive_id !== hive.id) {
        throw new ValidationError(
          `Le hive_id du corps (${data.hive_id}) ne correspond pas à la ruche du chemin (${hive.id}).`
        );
      }

      // Chaque valeur présente doit être un nombre dans sa plage physique.
      for (const [field, { min, max }] of Object.entries(PHYSICAL_RANGES)) {
        const value = data[field];
        if (value === undefined || value === null) continue;
        if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
          throw new ValidationError(
            `Le champ ${field} doit être un nombre compris entre ${min} et ${max} (reçu : ${JSON.stringify(value)}).`
          );
        }
      }

      // On garde le timestamp de la trame (l'instant de la mesure), pas new Date().
      const measure = { ...data, hive_id: hive.id, site_id: hive.site_id };
      return measuresRepository.add(measure);
    },
  };
}