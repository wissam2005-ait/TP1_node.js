// server.js : crée les repositories PostgreSQL et démarre le serveur.
// Lancement : npm run dev (= node --watch --env-file=.env src/server.js)

import { config } from "./config.js";
import { createApp } from "./app.js";
import { createPostgresRepositories } from "./repositories/postgres/index.js";
import { createPool } from "./db.js";

const pool = createPool();

try {
  // Vérifie la connexion dès le démarrage
  await pool.query("SELECT 1"); 
} catch (err) {
  console.error(`Impossible de joindre PostgreSQL sur ${config.db.host}:${config.db.port} : ${err.message || err.code}`);
  process.exit(1);
}

const repositories = createPostgresRepositories(pool);
const app = createApp(repositories);

app.listen(config.port, () => {
  console.log(`API Queen Bee sur http://localhost:${config.port} (stockage : postgres)`);
});