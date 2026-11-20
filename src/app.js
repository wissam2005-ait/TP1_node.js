import express from "express";
import { config } from "./config.js";
import { createRequireAuth } from "./middlewares/auth.js";
import { createAuthService } from "./services/auth.service.js";
import { createAuthController } from "./controllers/auth.controller.js";
import { createAuthRouter } from "./routes/auth/auth.router.js";

import { createHivesRouter } from "./routes/hives/hives.router.js";
import { createHivesController } from "./controllers/hives.controller.js";
import { createHivesService } from "./services/hives.service.js";
import { createMeasuresService } from "./services/measures.service.js";
import { createInspectionsService } from "./services/inspections.service.js";

export function createApp({ 
  hivesRepository, 
  measuresRepository, 
  inspectionsRepository, 
  usersRepository 
}) {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  // 1. Authentification
  const authService = createAuthService({ usersRepository, auth: config.auth });
  const requireAuth = createRequireAuth(authService);

  // 2. Services métier
  const hivesService = createHivesService({ hivesRepository });
  const measuresService = createMeasuresService({ hivesService, measuresRepository });
  const inspectionsService = createInspectionsService({ hivesService, inspectionsRepository });

  // 3. Branchement des routes
  app.use("/api/auth", createAuthRouter({ 
    controller: createAuthController({ authService }), 
    requireAuth 
  }));

  app.use("/api/hives", createHivesRouter({ 
    controller: createHivesController({ hivesService, measuresService, inspectionsService }), 
    requireAuth 
  }));

  // N'oublie pas d'appeler tes gestionnaires d'erreurs à la fin (notFoundHandler et errorHandler)
  // app.use(notFoundHandler);
  // app.use(errorHandler);

  return app;
}