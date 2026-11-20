import { sendProblem } from "../utils/problem.js";
import { AppError, ValidationError, NotFoundError, ConflictError } from "../errors.js";

// Route inconnue : un 404 au format RFC 9457.
export function notFoundHandler(req, res) {
  sendProblem(res, 404, `Aucune route ne correspond à ${req.method} ${req.originalUrl}.`);
}

// Toute erreur levée dans une route arrive ici.
export function errorHandler(err, req, res, next) {
  // 1. Erreurs de notre application (AppError et ses sous-classes)
  if (err instanceof AppError) {
    return sendProblem(res, err.status, err.message);
  }

  // 2. JSON mal formé (Express)
  if (err.type === "entity.parse.failed") {
    return sendProblem(res, 400, "Le corps de la requête n'est pas un JSON valide.");
  }

  // 3. Corps trop volumineux (Express)
  if (err.type === "entity.too.large") {
    return sendProblem(res, 413, "Le corps de la requête est trop volumineux.");
  }

  // 4. Erreurs PostgreSQL
  if (err.code === "23505") { // Violation de contrainte d'unicité (doublon)
    return sendProblem(res, 409, "Cette ressource existe déjà.");
  }
  if (["23503", "23514", "22P02"].includes(err.code)) { // Clé étrangère, contrainte de vérification, format invalide
    return sendProblem(res, 400, "Les données fournies sont invalides.");
  }

  // 5. Tout le reste (erreur 500)
  console.error(err); // La pile va dans le journal du serveur, jamais dans la réponse
  sendProblem(res, 500, "Une erreur interne est survenue.");
}