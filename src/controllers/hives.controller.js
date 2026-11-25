// Contrôleur des ruches. Sa question : que dit la requête, que répondre ?
// Il lit req (params, query, body), appelle un service, puis écrit res.
// Il n'importe JAMAIS un repository et ne contient aucune règle métier.
//
// Les erreurs levées par les services (NotFoundError, ValidationError…) ne sont pas
// attrapées ici : Express 5 les transmet à l'intergiciel d'erreur.

export function createHivesController({ hivesService, measuresService, inspectionsService }) {
  return {
    // GET /api/hives?site_id=SN-CASA
    async listHives(req, res) {
      // req.validated contient la query nettoyée par Joi (ex: { site_id: "SN-CASA" })
      const hives = await hivesService.listHives({ siteId: req.validated.site_id });
      res.json(hives);
    },

    // GET /api/hives/:id
    async getHive(req, res) {
      // req.params.id n'est pas validé par Joi ici, on le lit directement
      const hive = await hivesService.getHive(req.params.id);
      res.json(hive);
    },

    // GET /api/hives/:id/measures?limit=50&offset=0
    async listMeasures(req, res) {
      // req.validated contient { limit: 50, offset: 0 } avec les valeurs par défaut appliquées
      const page = await measuresService.listMeasures(req.params.id, req.validated);
      res.json(page);
    },

    // POST /api/hives/:id/measures
        async addMeasure(req, res) {
      // Le service renvoie { measure, created }
      const result = await measuresService.addMeasure(req.params.id, req.validated);
      // 201 si c'est une création, 200 si c'était un doublon (rejeu)
      res.status(result.created ? 201 : 200).json(result.measure);
    },

    // GET /api/hives/:id/inspections
    async listInspections(req, res) {
      const result = await inspectionsService.listInspections(req.params.id);
      res.json(result);
    },

    // POST /api/hives/:id/inspections
        async addInspection(req, res) {
      // Le service renvoie { inspection, created }
      const result = await inspectionsService.addInspection(req.params.id, req.validated);
      // 201 si créé, 200 si déjà existant
      res.status(result.created ? 201 : 200).json(result.inspection);
    },
  };
}