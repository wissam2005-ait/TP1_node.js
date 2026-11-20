import pg from "pg";
import { config } from "./config.js";

// pg renvoie les colonnes NUMERIC en chaînes ("36.84") pour ne jamais perdre de précision.
// Nos mesures ont au plus deux décimales : on les convertit en nombres. 1700 = type NUMERIC.
pg.types.setTypeParser(1700, (value) => Number(value));

// Un pool garde quelques connexions ouvertes et les prête aux requêtes. Quand toutes sont
// prises, une requête attend ; au-delà de connectionTimeoutMillis, elle échoue.
export function createPool() {
  return new pg.Pool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    max: config.db.poolMax,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  });
}