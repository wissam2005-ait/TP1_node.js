// Contrôleur des ruches. Sa question : que dit la requête, que répondre ?
// Il lit req (params, query, body), appelle un service, puis écrit res.
// Il n'importe JAMAIS un repository et ne contient aucune règle métier.
//
// Les erreurs levées par les services (NotFoundError, ValidationError…) ne sont pas
// attrapées ici : Express 5 les transmet à l'intergiciel d'erreur.

import { ValidationError } from "../errors.js";

// Les paramètres de requête arrivent toujours en texte : "10" est accepté,
// "abc", "1.5" ou "-1" ne le sont pas. Renvoie la valeur par défaut si le paramètre est absent.
function parseInteger(value, defaultValue, min, max, message) {
  if (value === undefined) return defaultValue;
  const n = /^\d+$/.test(value) ? Number(value) : NaN;
  if (Number.isNaN(n) || n < min || n > max) {
    throw new ValidationError(message);
  }
  return n;
}

export function createHivesController({ hivesService, measuresService, inspectionsService }) {
  return {
    // GET /api/hives?site_id=SN-CASA
    async listHives(req, res) {
      const hives = await hivesService.listHives({ siteId: req.query.site_id });
      res.json(hives);
    },

    // GET /api/hives/:id
    async getHive(req, res) {
      const hive = await hivesService.getHive(req.params.id);
      res.json(hive);
    },

    // GET /api/hives/:id/measures?limit=50&offset=0
    async listMeasures(req, res) {
      const limit = parseInteger(
        req.query.limit, 50, 1, 500,
        "Le paramètre limit doit être un entier compris entre 1 et 500."
      );
      const offset = parseInteger(
        req.query.offset, 0, 0, Number.MAX_SAFE_INTEGER,
        "Le paramètre offset doit être un entier positif ou nul."
      );
      const page = await measuresService.listMeasures(req.params.id, { limit, offset });
      res.json(page);
    },

    // POST /api/hives/:id/measures
    async addMeasure(req, res) {
      // En Express 5, req.body vaut undefined s'il n'y a pas de corps.
      const measure = await measuresService.addMeasure(req.params.id, req.body ?? {});
      res.status(201).json(measure);
    },

    // GET /api/hives/:id/inspections
    async listInspections(req, res) {
      const result = await inspectionsService.listInspections(req.params.id);
      res.json(result);
    },

    // POST /api/hives/:id/inspections
    async addInspection(req, res) {
      const inspection = await inspectionsService.addInspection(req.params.id, req.body ?? {});
      res.status(201).json(inspection);
    },
  };
}