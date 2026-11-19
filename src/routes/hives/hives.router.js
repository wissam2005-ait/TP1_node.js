// Routeur des ruches. Sa question : quelle URL, quel verbe, quels intergiciels ?
// Il ne contient aucune logique : chaque route appelle une méthode du contrôleur.
// Il est monté sur /api/hives dans app.js : les chemins sont relatifs à /api/hives.

import express from "express";

export function createHivesRouter(controller) {
  const router = express.Router();

  router.get("/", controller.listHives);
  router.get("/:id", controller.getHive);

  router.get("/:id/measures", controller.listMeasures);
  router.post("/:id/measures", controller.addMeasure);

  router.get("/:id/inspections", controller.listInspections);
  router.post("/:id/inspections", controller.addInspection);

  return router;
}
