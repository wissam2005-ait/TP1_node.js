// Service des ruches : les règles métier sur les ruches.
// Il reçoit son repository en paramètre : il ne l'importe jamais.

import { NotFoundError } from "../errors.js";

export function createHivesService({ hivesRepository }) {
  return {
    // Toutes les ruches, ou celles d'un site. Un site_id vide veut dire « pas de filtre ».
    async listHives({ siteId } = {}) {
      if (siteId === undefined || siteId === "") {
        return hivesRepository.findAll();
      }
      return hivesRepository.findAll({ siteId });
    },

    // Une ruche, ou NotFoundError. Utilisé aussi par les services des mesures et des inspections.
    async getHive(id) {
      const hive = await hivesRepository.findById(id);
      if (!hive) {
        throw new NotFoundError(`Aucune ruche ne porte l'identifiant ${id}.`);
      }
      return hive;
    },
  };
}