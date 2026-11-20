// Configuration de l'application : lue dans l'environnement, à un seul endroit.
// Le reste du code importe config et ne lit jamais process.env directement.
// Lancement : node --env-file=.env src/server.js (fait par npm run dev)

const ENVIRONMENTS = ["development", "production", "test"];
const STORAGES = ["postgres", "memory"];

export const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),

  // --- AJOUT TP 5 ---
  storage: process.env.STORAGE || "postgres",
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    poolMax: Number(process.env.DB_POOL_MAX || 10),
  },
  // ------------------
};

// Une configuration invalide arrête le démarrage, avec un message clair.
if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
  throw new Error(
    `Configuration invalide : PORT doit être un entier entre 1 et 65535 (reçu : "${process.env.PORT}").`
  );
}

if (!ENVIRONMENTS.includes(config.env)) {
  throw new Error(
    `Configuration invalide : NODE_ENV doit valoir ${ENVIRONMENTS.join(", ")} (reçu : "${config.env}").`
  );
}

// --- AJOUT TP 5 : Vérifications liées au stockage ---
if (!STORAGES.includes(config.storage)) {
  throw new Error(
    `Configuration invalide : STORAGE doit valoir "postgres" ou "memory" (reçu : "${config.storage}").`
  );
}

if (config.storage === "postgres" && !config.db.password) {
  throw new Error(
    `Configuration invalide : DB_PASSWORD est obligatoire quand STORAGE="postgres".`
  );
}