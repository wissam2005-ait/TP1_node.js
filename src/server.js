// Démarre le serveur. Lancement : npm run dev

import app from "./app.js";

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`API Queen Bee sur http://localhost:${PORT}`);
});
