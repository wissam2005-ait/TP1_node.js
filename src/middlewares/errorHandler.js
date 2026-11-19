import { sendProblem } from "../utils/problem.js";

// Route inconnue : un 404 au format RFC 9457, au lieu de la page HTML d'Express.
export function notFoundHandler(req, res) {
  sendProblem(res, 404, `Aucune route ne correspond à ${req.method} ${req.originalUrl}.`);
}

// Filet de sécurité : toute erreur non traitée arrive ici. Les quatre paramètres sont
// obligatoires : c'est à eux qu'Express reconnaît un intergiciel d'erreur.
export function errorHandler(err, req, res, next) {
  if (err.type === "entity.parse.failed") {
    return sendProblem(res, 400, "Le corps de la requête n'est pas un JSON valide.");
  }
  console.error(err); // la pile va dans le journal du serveur, jamais dans la réponse
  sendProblem(res, 500, "Une erreur interne est survenue.");
}