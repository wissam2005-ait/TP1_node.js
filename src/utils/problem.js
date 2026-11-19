// Format d'erreur unique de l'API : RFC 9457 (Problem Details for HTTP APIs).
//
//   HTTP/1.1 404 Not Found
//   Content-Type: application/problem+json
//   { "type": "about:blank", "title": "Ressource introuvable", "status": 404, "detail": "…" }
//
// title : l'intitulé du code, le même pour toutes les erreurs de ce code.
// detail : ce qui s'est passé pour CETTE requête.

const TITLES = {
  400: "Requête invalide",
  404: "Ressource introuvable",
  409: "Conflit",
  500: "Erreur interne",
};

export function sendProblem(res, status, detail) {
  res
    .status(status)
    .type("application/problem+json")
    .json({
      type: "about:blank",
      title: TITLES[status] ?? "Erreur",
      status,
      detail,
    });
}