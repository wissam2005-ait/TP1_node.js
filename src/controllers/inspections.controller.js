export function createInspectionsController({ inspectionsService }) {
  return {
    async sync(req, res) {
      // On renvoie toujours 200 si le lot est bien formé
      res.json(await inspectionsService.syncInspections(req.user, req.validated.inspections));
    },
  };
}