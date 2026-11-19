// app.js : le SEUL endroit où tout se branche.
// createApp reçoit les repositories, crée les services, le contrôleur et le routeur,
// puis renvoie l'application. Il ne démarre pas le serveur : c'est le rôle de server.js.
// (Les tests peuvent donc créer une application sans ouvrir de port.)

import express from "express";
import { requestLogger } from "./middlewares/requestLogger.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";
import { createHivesService } from "./services/hives.service.js";
import { createMeasuresService } from "./services/measures.service.js";
import { createInspectionsService } from "./services/inspections.service.js";
import { createHivesController } from "./controllers/hives.controller.js";
import { createHivesRouter } from "./routes/hives/hives.router.js";

export function createApp({ hivesRepository, measuresRepository, inspectionsRepository }) {
  // Services : chacun reçoit ses dépendances.
  const hivesService = createHivesService({ hivesRepository });
  const measuresService = createMeasuresService({ hivesService, measuresRepository });
  const inspectionsService = createInspectionsService({ hivesService, inspectionsRepository });

  // Contrôleur : il ne connaît que les services.
  const controller = createHivesController({ hivesService, measuresService, inspectionsService });

  const app = express();

  // 1. Journal : une ligne par requête.
  app.use(requestLogger);

  // 2. Lecture des corps JSON : AVANT les routes, sinon req.body vaut undefined.
  app.use(express.json());

  // 3. Routes
  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/api/hives", createHivesRouter(controller));

  // 4. Erreurs : TOUJOURS en dernier, après toutes les routes.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}