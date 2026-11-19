// Routes des ruches. Ce routeur est monté sur /api/hives dans app.js :
// les chemins écrits ici sont donc RELATIFS à /api/hives.
//   router.get("/")     répond à GET /api/hives
//   router.get("/:id")  répond à GET /api/hives/:id

import express from "express";
import { hives, measures } from "../data/hives.js";

const router = express.Router();

export default router;