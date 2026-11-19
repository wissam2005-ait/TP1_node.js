// Routes des ruches. Ce routeur est monté sur /api/hives dans app.js :
// les chemins écrits ici sont donc RELATIFS à /api/hives.
//   router.get("/")     répond à GET /api/hives
//   router.get("/:id")  répond à GET /api/hives/:id

import express from "express";
import { hives, measures } from "../data/hives.js";

const router = express.Router();

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
  const hive = hives.find((h) => h.id === req.params.id);
  if (!hive) {
    return res.status(404).json({ error: `Aucune ruche ne porte l'identifiant ${req.params.id}.` });
  }
  res.json(hive);
});

// POST /api/hives/:id/measures — enregistre une mesure envoyée par la passerelle
router.post("/:id/measures", (req, res) => {
  const hive = hives.find((h) => h.id === req.params.id);
  if (!hive) {
    return res.status(404).json({ error: `Aucune ruche ne porte l'identifiant ${req.params.id}.` });
  }

  const body = req.body ?? {}; // en Express 5, req.body vaut undefined s'il n'y a pas de corps

  // Seuls timestamp et weight_kg sont obligatoires.
  if (body.timestamp === undefined || body.weight_kg === undefined) {
    return res.status(400).json({ error: "Les champs timestamp et weight_kg sont obligatoires." });
  }

  // Si la trame contient un hive_id, ce doit être celui du chemin.
  if (body.hive_id !== undefined && body.hive_id !== hive.id) {
    return res.status(400).json({
      error: `Le hive_id du corps (${body.hive_id}) ne correspond pas à la ruche du chemin (${hive.id}).`,
    });
  }

  // On garde le timestamp de la trame (l'instant de la mesure), pas new Date().
  const measure = { ...body, hive_id: hive.id, site_id: hive.site_id };
  measures.push(measure);

  res.status(201).json(measure); // 201 Created, pas 200
});

export default router;