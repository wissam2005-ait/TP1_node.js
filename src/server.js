// server.js : crée les repositories, appelle createApp, puis démarre le serveur.
// Demain (jour 2), on remplacera les repositories en mémoire par ceux de PostgreSQL :
// ce sera le seul fichier à changer pour brancher la base.
// Lancement : npm run dev (= node --watch --env-file=.env src/server.js)

import { config } from "./config.js";
import { createApp } from "./app.js";
import { createMemoryHivesRepository } from "./repositories/memory/hives.repository.js";
import { createMemoryMeasuresRepository } from "./repositories/memory/measures.repository.js";
import { createMemoryInspectionsRepository } from "./repositories/memory/inspections.repository.js";
import { seedHives, loadSeedMeasures, seedInspections } from "./repositories/memory/seed.js";

const app = createApp({
  hivesRepository: createMemoryHivesRepository(seedHives),
  measuresRepository: createMemoryMeasuresRepository(loadSeedMeasures()),
  inspectionsRepository: createMemoryInspectionsRepository(seedInspections),
});

app.listen(config.port, () => {
  console.log(`API Queen Bee sur http://localhost:${config.port} (${config.env})`);
});