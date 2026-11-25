// Service des inspections : les règles métier sur les inspections.
import { ValidationError, ConflictError, AppError } from "../errors.js";

// L'application mobile envoie son propre UUID. On construit l'objet propre ici.
function toInspection(user, hive, data) {
  return {
    id: data.id,
    hive_id: hive.id,
    author_id: user.id, // L'auteur vient du jeton JWT (req.user)
    inspected_at: data.inspected_at,
    colony_status: data.colony_status,
    queen_present: data.queen_present ?? null,
    observations: data.observations ?? null,
  };
}

export function createInspectionsService({ hivesService, inspectionsRepository }) {
  return {
    async listInspections(user, hiveId) {
      const hive = await hivesService.getHive(user, hiveId);
      const items = await inspectionsRepository.findByHive(hive.id);
      return { items };
    },

    async addInspection(user, hiveId, data) {
      const hive = await hivesService.getHive(user, hiveId);

      if (data.hive_id !== undefined && data.hive_id !== hive.id) {
        throw new ValidationError(`Le hive_id du corps (${data.hive_id}) ne correspond pas à la ruche ${hive.id}.`);
      }

      const result = await inspectionsRepository.insertIfAbsent(toInspection(user, hive, data));

      if (!result.created && result.inspection.hive_id !== hive.id) {
        throw new ConflictError(`L'identifiant ${data.id} est déjà utilisé par une inspection d'une autre ruche.`);
      }

      return result; // { inspection, created }
    },

    // --- LOGIQUE DE SYNCHRONISATION (TP 8) ---
    async syncInspections(user, items) {
      const results = [];
      
      for (const item of items) {
        try {
          // 1. On vérifie que la ruche existe et qu'on y a accès (lève 404 ou 403)
          const hive = await hivesService.getHive(user, item.hive_id);
          const inspection = toInspection(user, hive, item);

          // 2. Si c'est une nouvelle inspection (pas de version fournie)
          if (item.version === undefined) {
            const { inspection: stored, created } = await inspectionsRepository.insertIfAbsent(inspection);
            
            if (created) {
              results.push({ id: item.id, status: "created", version: stored.version });
            } else if (stored.hive_id !== hive.id) {
              results.push({ id: item.id, status: "rejected", detail: "Cet identifiant est déjà utilisé par une inspection d'une autre ruche." });
            } else {
              results.push({ id: item.id, status: "unchanged", version: stored.version });
            }
            continue;
          }

          // 3. Si c'est une modification (version fournie), on tente de mettre à jour
          const updated = await inspectionsRepository.updateIfVersion(inspection, item.version);
          
          if (updated) {
            results.push({ id: item.id, status: "updated", version: updated.version });
          } else {
            // Si updateIfVersion échoue, c'est soit un conflit de version, soit l'ID n'existe pas
            const current = await inspectionsRepository.findById(item.id);
            if (!current || current.hive_id !== hive.id) {
              results.push({ id: item.id, status: "rejected", detail: "Inspection inconnue pour cette ruche : envoyez-la sans version pour la créer." });
            } else {
              results.push({
                id: item.id,
                status: "conflict",
                detail: `L'inspection a été modifiée entre-temps : version ${current.version} sur le serveur, ${item.version} sur l'appareil.`,
                current,
              });
            }
          }
        } catch (err) {
          // Si on a une erreur métier (404, 403...), on la met dans "rejected" sans arrêter le lot
          if (err instanceof AppError) {
            results.push({ id: item.id, status: "rejected", detail: err.message });
          } else {
            throw err; // Erreur technique (bug), on laisse remonter
          }
        }
      }

      // On calcule le résumé
      const summary = { created: 0, unchanged: 0, updated: 0, conflict: 0, rejected: 0 };
      for (const result of results) {
        summary[result.status] += 1;
      }

      return { summary, results };
    },
  };
}