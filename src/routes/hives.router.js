// Routes des ruches. Ce routeur est monté sur /api/hives dans app.js :
// les chemins écrits ici sont donc RELATIFS à /api/hives.
//   router.get("/")     répond à GET /api/hives
//   router.get("/:id")  répond à GET /api/hives/:id
//
// Toutes les erreurs passent par sendProblem : format RFC 9457.

import express from "express";
import { hives, measures, inspections } from "../data/hives.js";
import { sendProblem } from "../utils/problem.js";

const router = express.Router();

// ---------------------------------------------------------------------------
// Petites fonctions utilitaires
// ---------------------------------------------------------------------------

function findHive(id) {
  return hives.find((h) => h.id === id);
}

function hiveNotFound(res, id) {
  return sendProblem(res, 404, `Aucune ruche ne porte l'identifiant ${id}.`);
}

// Lit un paramètre de requête entier. Les paramètres arrivent toujours en chaîne :
// "10" est accepté, "abc", "1.5" ou "-1" ne le sont pas.
// Renvoie la valeur par défaut si le paramètre est absent, null s'il est invalide.
function parseInteger(value, defaultValue, min, max) {
  if (value === undefined) return defaultValue;
  if (!/^\d+$/.test(value)) return null;
  const n = Number(value);
  if (n < min || n > max) return null;
  return n;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Date ISO 8601 : 2026-10-31, 2026-10-31T10:00:00Z, 2026-10-31T10:00:00.000+01:00…
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?$/;
const COLONY_STATUSES = ["forte", "normale", "faible", "morte"];

// ---------------------------------------------------------------------------
// Ruches
// ---------------------------------------------------------------------------

// GET /api/hives — toutes les ruches, ou celles d'un site avec ?site_id=SN-CASA
router.get("/", (req, res) => {
  const { site_id } = req.query; // un filtre se lit dans req.query, jamais dans le chemin

  // Paramètre absent OU vide (?site_id=) : pas de filtre.
  if (site_id === undefined || site_id === "") {
    return res.json(hives);
  }

  // filter garde TOUTES les ruches du site (find ne garderait que la première).
  res.json(hives.filter((hive) => hive.site_id === site_id));
});

// GET /api/hives/:id — une ruche, ou 404
router.get("/:id", (req, res) => {
  const hive = findHive(req.params.id);
  if (!hive) return hiveNotFound(res, req.params.id);
  res.json(hive);
});

// ---------------------------------------------------------------------------
// Mesures
// ---------------------------------------------------------------------------

// GET /api/hives/:id/measures?limit=50&offset=0 — historique paginé, du plus récent au plus ancien
router.get("/:id/measures", (req, res) => {
  const limit = parseInteger(req.query.limit, 50, 1, 500);
  if (limit === null) {
    return sendProblem(res, 400, "Le paramètre limit doit être un entier compris entre 1 et 500.");
  }

  const offset = parseInteger(req.query.offset, 0, 0, Number.MAX_SAFE_INTEGER);
  if (offset === null) {
    return sendProblem(res, 400, "Le paramètre offset doit être un entier positif ou nul.");
  }

  const hive = findHive(req.params.id);
  if (!hive) return hiveNotFound(res, req.params.id);

  const items = measures
    .filter((m) => m.hive_id === hive.id)
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)) // plus récent d'abord
    .slice(offset, offset + limit);

  res.json({ items, limit, offset });
});

// POST /api/hives/:id/measures — enregistre une mesure envoyée par la passerelle
router.post("/:id/measures", (req, res) => {
  const hive = findHive(req.params.id);
  if (!hive) return hiveNotFound(res, req.params.id);

  const body = req.body ?? {}; // en Express 5, req.body vaut undefined s'il n'y a pas de corps

  // Seuls timestamp et weight_kg sont obligatoires.
  if (body.timestamp === undefined || body.weight_kg === undefined) {
    return sendProblem(res, 400, "Les champs timestamp et weight_kg sont obligatoires.");
  }

  // Si la trame contient un hive_id, ce doit être celui du chemin.
  if (body.hive_id !== undefined && body.hive_id !== hive.id) {
    return sendProblem(
      res,
      400,
      `Le hive_id du corps (${body.hive_id}) ne correspond pas à la ruche du chemin (${hive.id}).`
    );
  }

  // On garde le timestamp de la trame (l'instant de la mesure), pas new Date().
  const measure = { ...body, hive_id: hive.id, site_id: hive.site_id };
  measures.push(measure);

  res.status(201).json(measure); // 201 Created, pas 200
});

// ---------------------------------------------------------------------------
// Inspections
// ---------------------------------------------------------------------------

// GET /api/hives/:id/inspections — les inspections de la ruche, de la plus récente à la plus ancienne
router.get("/:id/inspections", (req, res) => {
  const hive = findHive(req.params.id);
  if (!hive) return hiveNotFound(res, req.params.id);

  const items = inspections
    .filter((i) => i.hive_id === hive.id)
    .sort((a, b) => Date.parse(b.inspected_at) - Date.parse(a.inspected_at));

  res.json({ items });
});

// POST /api/hives/:id/inspections — enregistre une inspection saisie sur le terrain
router.post("/:id/inspections", (req, res) => {
  const hive = findHive(req.params.id);
  if (!hive) return hiveNotFound(res, req.params.id);

  const body = req.body ?? {};
  const { id, inspected_at, colony_status, queen_present, observations } = body;

  // id : UUID choisi par l'application mobile, obligatoire
  if (typeof id !== "string" || !UUID_REGEX.test(id)) {
    return sendProblem(res, 400, "Le champ id est obligatoire et doit être un UUID.");
  }

  // inspected_at : date ISO 8601, obligatoire
  if (
    typeof inspected_at !== "string" ||
    !ISO_DATE_REGEX.test(inspected_at) ||
    Number.isNaN(Date.parse(inspected_at))
  ) {
    return sendProblem(
      res,
      400,
      "Le champ inspected_at est obligatoire et doit être une date ISO 8601, par exemple 2026-10-31T10:00:00Z."
    );
  }

  // colony_status : une valeur de la liste, obligatoire
  if (!COLONY_STATUSES.includes(colony_status)) {
    return sendProblem(
      res,
      400,
      `Le champ colony_status est obligatoire et doit valoir ${COLONY_STATUSES.join(", ")}.`
    );
  }

  // queen_present : booléen, facultatif
  if (queen_present !== undefined && typeof queen_present !== "boolean") {
    return sendProblem(res, 400, "Le champ queen_present doit être un booléen (true ou false).");
  }

  // observations : texte, facultatif
  if (observations !== undefined && observations !== null && typeof observations !== "string") {
    return sendProblem(res, 400, "Le champ observations doit être un texte.");
  }

  // Un même UUID ne peut pas désigner deux inspections.
  if (inspections.some((i) => i.id === id)) {
    return sendProblem(res, 409, `Une inspection porte déjà l'identifiant ${id}.`);
  }

  const inspection = {
    id,
    hive_id: hive.id,
    inspected_at,
    colony_status,
    queen_present: queen_present ?? null,
    observations: observations ?? null,
  };
  inspections.push(inspection);

  res.status(201).json(inspection);
});

export default router;