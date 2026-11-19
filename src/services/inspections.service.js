// Service des inspections : les règles métier sur les inspections.

import { ValidationError, ConflictError } from "../errors.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Date ISO 8601 : 2026-10-31, 2026-10-31T10:00:00Z, 2026-10-31T10:00:00.000+01:00…
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?$/;
export const COLONY_STATUSES = ["forte", "normale", "faible", "morte"];

export function createInspectionsService({ hivesService, inspectionsRepository }) {
  return {
    async listInspections(hiveId) {
      const hive = await hivesService.getHive(hiveId);
      const items = await inspectionsRepository.findByHive(hive.id);
      return { items };
    },

    async addInspection(hiveId, data) {
      const hive = await hivesService.getHive(hiveId);
      const { id, inspected_at, colony_status, queen_present, observations } = data;

      // id : UUID choisi par l'application mobile, obligatoire
      if (typeof id !== "string" || !UUID_REGEX.test(id)) {
        throw new ValidationError("Le champ id est obligatoire et doit être un UUID.");
      }

      // inspected_at : date ISO 8601, obligatoire
      if (
        typeof inspected_at !== "string" ||
        !ISO_DATE_REGEX.test(inspected_at) ||
        Number.isNaN(Date.parse(inspected_at))
      ) {
        throw new ValidationError(
          "Le champ inspected_at est obligatoire et doit être une date ISO 8601, par exemple 2026-10-31T10:00:00Z."
        );
      }

      // colony_status : une valeur de la liste, obligatoire
      if (!COLONY_STATUSES.includes(colony_status)) {
        throw new ValidationError(
          `Le champ colony_status est obligatoire et doit valoir ${COLONY_STATUSES.join(", ")}.`
        );
      }

      // queen_present : booléen, facultatif
      if (queen_present !== undefined && typeof queen_present !== "boolean") {
        throw new ValidationError("Le champ queen_present doit être un booléen (true ou false).");
      }

      // observations : texte, facultatif
      if (observations !== undefined && observations !== null && typeof observations !== "string") {
        throw new ValidationError("Le champ observations doit être un texte.");
      }

      // Un même UUID ne peut pas désigner deux inspections.
      if (await inspectionsRepository.findById(id)) {
        throw new ConflictError(`Une inspection porte déjà l'identifiant ${id}.`);
      }

      return inspectionsRepository.add({
        id,
        hive_id: hive.id,
        inspected_at,
        colony_status,
        queen_present: queen_present ?? null,
        observations: observations ?? null,
      });
    },
  };
}