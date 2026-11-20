import { UnauthorizedError, ForbiddenError } from "../errors.js";

// Vérifie que l'en-tête Authorization contient un jeton valide
export function createRequireAuth(authService) {
  return function requireAuth(req, res, next) {
    const [scheme, token] = (req.get("Authorization") ?? "").split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedError("Jeton d'accès manquant : ajoutez l'en-tête Authorization: Bearer <jeton>.");
    }
    req.user = authService.verifyAccessToken(token);
    next();
  };
}

// Vérifie que l'utilisateur possède l'un des rôles autorisés
export function requireRole(...roles) {
  return function checkRole(req, res, next) {
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(`Action réservée aux rôles suivants : ${roles.join(", ")}.`);
    }
    next();
  };
}