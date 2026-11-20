// Configuration de l'application : lue dans l'environnement, à un seul endroit.
const ENVIRONMENTS = ["development", "production", "test"];
const STORAGES = ["postgres", "memory"];

export const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
  storage: process.env.STORAGE || "postgres",
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    poolMax: Number(process.env.DB_POOL_MAX || 10),
  },
  
  // --- AJOUT TP 7 ---
  auth: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTtl: process.env.JWT_ACCESS_TTL || "15m",
    refreshTtl: process.env.JWT_REFRESH_TTL || "7d",
    maxFailedLogins: 5,
    lockMinutes: 15,
  },
  // ------------------
};

// Vérifications existantes
if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
  throw new Error(`Configuration invalide : PORT doit être un entier entre 1 et 65535.`);
}
if (!ENVIRONMENTS.includes(config.env)) {
  throw new Error(`Configuration invalide : NODE_ENV doit valoir ${ENVIRONMENTS.join(", ")}.`);
}
if (!STORAGES.includes(config.storage)) {
  throw new Error(`Configuration invalide : STORAGE doit valoir "postgres" ou "memory".`);
}
if (config.storage === "postgres" && !config.db.password) {
  throw new Error(`Configuration invalide : DB_PASSWORD est obligatoire quand STORAGE="postgres".`);
}

// --- AJOUT TP 7 : Vérifications des secrets ---
if (!config.auth.accessSecret || !config.auth.refreshSecret) {
  throw new Error("Configuration invalide : JWT_ACCESS_SECRET et JWT_REFRESH_SECRET sont obligatoires.");
}
if (config.auth.accessSecret === config.auth.refreshSecret) {
  throw new Error("Configuration invalide : les deux secrets JWT doivent être différents.");
}