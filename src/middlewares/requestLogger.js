// Intergiciel de journalisation : une ligne par requête.
// Exemple : 2026-11-19T10:15:02.123Z GET /api/hives?site_id=SN-CASA 200 1.4 ms

export function requestLogger(req, res, next) {
  const debut = performance.now();

  // "finish" est émis quand la réponse est entièrement envoyée :
  // on connaît alors le code de statut et la durée.
  res.on("finish", () => {
    const duree = (performance.now() - debut).toFixed(1);
    console.log(
      `${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${duree} ms`
    );
  });

  next(); // passe la main à l'intergiciel suivant
}
