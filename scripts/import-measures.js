// TP 5 — Insérer une journée de mesures : ligne à ligne, puis par lot.
//
// Le script lit un fichier de mesures (une trame JSON par ligne) et l'insère directement
// en base, de deux façons, pour comparer les temps :
//   ligne : une requête INSERT par mesure, chacune validée séparément (4 800 allers-retours
//           avec la base et 4 800 écritures sur disque) ;
//   lot   : des requêtes de 1 000 lignes, le tout dans une seule transaction.
//
// Lancement, depuis la racine du projet (la base doit tourner) :
//   node --env-file=.env scripts/import-measures.js ligne
//   node --env-file=.env scripts/import-measures.js lot --vider
//
// Le 31 octobre n'est pas dans le jeu de données : la première insertion réussit.
// Relancée sans --vider, elle échoue sur la clé primaire (hive_id, measured_at), car les
// mesures existent déjà. L'option --vider les supprime d'abord, pour refaire l'essai.

import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { createPool } from "../src/db.js";

const args = process.argv.slice(2);
const mode = args.find((a) => a === "ligne" || a === "lot");
const vider = args.includes("--vider");
const fichier = args.find((a) => a.endsWith(".ndjson")) ?? "data/mesures-SN-CASA-2026-10-31.ndjson";

if (!mode) {
  console.error("Usage : node --env-file=.env scripts/import-measures.js ligne|lot [--vider] [fichier]");
  process.exit(1);
}

const COLONNES = `hive_id, measured_at, weight_kg, temp_internal_c, temp_external_c,
                  humidity_pct, acoustic_activity_score, battery_pct, lat, lon`;
const NB_COLONNES = 10;
const TAILLE_LOT = 1000; // 1 000 lignes × 10 colonnes = 10 000 paramètres (maximum de PostgreSQL : 65 535)

// Les valeurs d'une trame, dans l'ordre des colonnes.
function valeurs(m) {
  return [
    m.hive_id, m.timestamp, m.weight_kg, m.temp_internal_c, m.temp_external_c,
    m.humidity_pct, m.acoustic_activity_score, m.battery_pct, m.position_lat, m.position_lon,
  ];
}

// Lit le fichier en flux, comme au TP 1.
async function lireMesures() {
  const mesures = [];
  const lignes = createInterface({ input: createReadStream(fichier), crlfDelay: Infinity });
  for await (const ligne of lignes) {
    if (ligne) mesures.push(JSON.parse(ligne));
  }
  return mesures;
}

// Supprime les mesures du fichier déjà présentes en base, pour pouvoir refaire l'essai.
async function viderMesures(pool, mesures) {
  const ruches = [...new Set(mesures.map((m) => m.hive_id))];
  const instants = mesures.map((m) => Date.parse(m.timestamp));
  const { rowCount } = await pool.query(
    `DELETE FROM measures WHERE hive_id = ANY($1) AND measured_at BETWEEN $2 AND $3`,
    [ruches, new Date(Math.min(...instants)), new Date(Math.max(...instants))],
  );
  console.log(`${rowCount} mesures supprimées avant l'essai`);
}

// Une requête par mesure. Sans transaction, chaque INSERT est validé, donc écrit sur
// disque, séparément.
async function insererLigneALigne(pool, mesures) {
  for (const m of mesures) {
    await pool.query(
      `INSERT INTO measures (${COLONNES}) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      valeurs(m),
    );
  }
}

// Des requêtes de TAILLE_LOT lignes, dans une seule transaction.
// On construit seulement la liste des paramètres ($1, $2, … $10), ($11, … $20)… :
// les valeurs, elles, restent des paramètres et ne sont jamais concaténées dans la requête.
async function insererParLot(pool, mesures) {
  // Une transaction a besoin d'une seule et même connexion du début à la fin :
  // on l'emprunte au pool, et on la rend dans le finally, quoi qu'il arrive.
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (let debut = 0; debut < mesures.length; debut += TAILLE_LOT) {
      const lot = mesures.slice(debut, debut + TAILLE_LOT);
      const parametres = [];
      const lignes = lot.map((m, i) => {
        parametres.push(...valeurs(m));
        const numeros = Array.from({ length: NB_COLONNES }, (_, k) => `$${i * NB_COLONNES + k + 1}`);
        return `(${numeros.join(", ")})`;
      });
      await client.query(`INSERT INTO measures (${COLONNES}) VALUES ${lignes.join(", ")}`, parametres);
    }

    await client.query("COMMIT"); // tout est validé d'un coup…
  } catch (err) {
    await client.query("ROLLBACK"); // … ou rien du tout : la base n'est jamais à moitié remplie
    throw err;
  } finally {
    client.release();
  }
}

const pool = createPool();
try {
  const mesures = await lireMesures();
  console.log(`${mesures.length} mesures lues dans ${fichier}`);

  if (vider) await viderMesures(pool, mesures);

  const debut = performance.now();
  if (mode === "ligne") {
    await insererLigneALigne(pool, mesures);
  } else {
    await insererParLot(pool, mesures);
  }
  const duree = performance.now() - debut;

  console.log(`Insertion ${mode === "ligne" ? "ligne à ligne" : "par lot"} : ${mesures.length} mesures en ${Math.round(duree)} ms`);
} catch (err) {
  if (err.code === "23505") {
    // 23505 : code PostgreSQL d'une violation de contrainte d'unicité (ici, la clé primaire)
    console.error("Ces mesures sont déjà en base (clé primaire hive_id + measured_at). Relancez avec --vider.");
  } else {
    console.error(`Erreur : ${err.message}`);
  }
  process.exitCode = 1;
} finally {
  await pool.end(); // ferme les connexions, sinon le script ne se termine pas
}
