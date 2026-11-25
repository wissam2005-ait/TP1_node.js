// Service des mesures : les règles métier sur les mesures.
import { ValidationError } from "../errors.js";

export function createMeasuresService({ hivesService, measuresRepository }) {
  return {
    async listMeasures(hiveId, { limit, offset }) {
      const hive = await hivesService.getHive(hiveId);
      const items = await measuresRepository.findByHive(hive.id, { limit, offset });
      return { items, limit, offset };
    },

    async addMeasure(hiveId, data) {
      const hive = await hivesService.getHive(hiveId);

      // On garde uniquement la vérification métier : le hive_id du corps doit correspondre au chemin
      if (data.hive_id !== undefined && data.hive_id !== hive.id) {
        throw new ValidationError(
          `Le hive_id du corps (${data.hive_id}) ne correspond pas à la ruche du chemin (${hive.id}).`
        );
      }

      const measure = { ...data, hive_id: hive.id, site_id: hive.site_id };
      
      // Renvoie { measure, created }
      return measuresRepository.add(measure);
    },
  };
}