// Routeur des ruches. Sa question : quelle URL, quel verbe, quels intergiciels ?
import express from "express";
import { validate } from "../../middlewares/validate.js";
import { 
  hivesQuerySchema, 
  measureSchema, 
  paginationSchema, 
  inspectionSchema 
} from "../../validators/schemas.js";

export function createHivesRouter({ controller, requireAuth }) { // <-- On récupère requireAuth
  const router = express.Router();

  // On applique requireAuth à toutes les routes de ce routeur
  router.use(requireAuth); 

  router.get("/", validate(hivesQuerySchema, "query"), controller.listHives);
  router.get("/:id", controller.getHive);

  router.get("/:id/measures", validate(paginationSchema, "query"), controller.listMeasures);
  router.post("/:id/measures", validate(measureSchema), controller.addMeasure);

  router.get("/:id/inspections", controller.listInspections);
  router.post("/:id/inspections", validate(inspectionSchema), controller.addInspection);

  return router;
}