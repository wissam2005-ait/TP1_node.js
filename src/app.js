// Crée l'application Express et branche les intergiciels et les routes.
// L'ordre de déclaration est l'ordre d'exécution.

import express from "express";
import { requestLogger } from "./middlewares/requestLogger.js"; // en ESM, l'extension .js est obligatoire
import hivesRouter from "./routes/hives.router.js";
//import morgan from "morgan";

const app = express();

// 1. Journal : un seul des deux, sinon chaque requête apparaît deux fois.
 app.use(requestLogger);
//app.use(morgan("dev")); // pour comparer : commentez requestLogger et décommentez cette ligne

// 2. Lecture des corps JSON : AVANT les routes, sinon req.body vaut undefined.
app.use(express.json());

// 3. Routes
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/hives", hivesRouter);

export default app;