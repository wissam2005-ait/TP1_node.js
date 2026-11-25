# Queen Bee — API backend (module Node.js, M1)

## TP 1 — Lire les mesures sans bloquer

Les deux routes de `tp/tp1-lecture/serveur-depart.js` font le même calcul :

- `POST /import/bloquant` lit tout le fichier avec `readFileSync`, puis analyse chaque ligne avec `JSON.parse`.
- `POST /import/flux` lit le fichier par morceaux avec `createReadStream` et `readline`.

Elles renvoient les mêmes valeurs :

- fichier de 30 jours : **144 000 mesures**, poids moyen **38,74 kg** ;
- fichier d'une journée : **4 800 mesures**, poids moyen **37,87 kg**.

### Mesures

Node.js v22, valeur médiane de trois essais par ligne.

| Fichier  | Lecture   | Durée de l'import (ms) | Pire temps de /ping (ms) |
|----------|-----------|------------------------|--------------------------|
| 1 jour   | bloquante | 211                   | 205                      |
| 1 jour   | en flux   | 251                    | 5                      |
| 30 jours | bloquante | 13                  | 4                     |
| 30 jours | en flux   | 16                   | 4                        |

### Questions

**1. Pourquoi /ping attend-il pendant l'import bloquant ?**
Node.js exécute tout le JavaScript sur un seul fil, celui de la boucle d'événements. `readFileSync` puis la boucle de `JSON.parse` occupent ce fil sans interruption pendant environ 200 ms. La requête /ping ne peut donc être traitée qu'à la fin de l'import : son pire temps de réponse est presque égal à la durée de l'import.

**2. La lecture en flux est-elle plus rapide ? Sinon, qu'apporte-t-elle ?**
Non, elle est même un peu plus lente (216 ms contre 213 ms), car elle découpe le travail en petits morceaux. Mais entre deux morceaux de 64 Ko, la boucle d'événements reprend la main et sert les autres requêtes : /ping répond en quelques millisecondes au lieu de 211. De plus, le fichier n'est jamais chargé entièrement en mémoire.

**3. Pourquoi l'effet est-il presque invisible avec le fichier d'une journée ?**
Le fichier d'une journée est 30 fois plus petit (4 800 lignes, 1,2 Mo) : l'import bloquant ne dure que quelques millisecondes. Une requête /ping arrivée pendant ce temps attend donc au pire quelques millisecondes, ce qui ne se voit pas. Le blocage ne devient gênant que lorsque la quantité de données grandit.
## Jour 1 — API v0

- Ruches, mesures et inspections en mémoire, organisées en couches : routeur → contrôleur → service → repository.
- Contrat de chaque route : `docs/api.md`.
- Collection de requêtes : `collections/queenbee.postman_collection.json`.
- Erreurs au format RFC 9457 (`application/problem+json`).
- Contrôle des plages physiques des mesures (UC-CY02) : une mesure hors plage est refusée (400).
- Test : `npm test` (refus d'un poids de 500 kg, enregistrement d'une mesure valide).

### Lancer le projet

    cp .env.example .env     # puis remplir les valeurs
    npm install
    npm run dev              # http://localhost:3000
    npm test

## TP 5 — Brancher PostgreSQL

L'API lit et écrit désormais dans la base de données PostgreSQL via le pool de connexions `pg`.

### Import en masse : réponses aux questions

**1. Quel temps obtenez-vous dans chaque mode ? D'où vient l'écart ?**
*   **Mode ligne** : ~X secondes (ex: 12s). Chaque insertion est une transaction individuelle, ce qui génère un aller-retour réseau et un commit disque pour chaque mesure.
*   **Mode lot** : ~Y secondes (ex: 1.5s). Les 1 000 lignes sont envoyées en une seule requête et une seule transaction. L'écart vient de la réduction drastique des allers-retours réseau et de l'écriture groupée sur le disque.

**2. Si la 2 001e mesure provoquait une erreur, que resterait-il en base dans chaque mode ?**
*   **Mode ligne** : Les 2 000 premières mesures restent en base, car chaque `INSERT` a été validé (commit) individuellement.
*   **Mode lot** : Rien ne reste. La transaction englobe tout le lot ; en cas d'erreur, un `ROLLBACK` annule l'intégralité des 2 000 insertions précédentes.

**3. Pourquoi la transaction emprunte-t-elle une connexion avec `pool.connect()` au lieu d'appeler `pool.query()` ?**
Car `pool.query()` peut piocher une connexion différente à chaque appel dans le pool. Pour garantir qu'un `BEGIN`, les `INSERT` et le `COMMIT` s'exécutent sur la même session (la même connexion), il faut la réserver manuellement avec `pool.connect()`.

**4. Que se passerait-il si `client.release()` n'était pas dans le `finally`, et qu'une erreur survenait dix fois de suite ?**
Le client ne serait jamais rendu au pool. Au bout de 10 erreurs, le pool (limité à `DB_POOL_MAX=10`) serait saturé. L'API ne pourrait plus obtenir de connexion et toutes les requêtes suivantes échoueraient par timeout.

## TP 6 — Validation et erreurs

Ce TP centralise la validation des entrées avec **Joi** et la gestion des erreurs via un intergiciel unique (`errorHandler`).

### Ce qui a été mis en place :
*   **Erreurs typées** : Utilisation de `ValidationError`, `NotFoundError` et `ConflictError` héritant de `AppError`.
*   **Validation Joi** : Les schémas `measureSchema`, `inspectionSchema`, `paginationSchema` et `hivesQuerySchema` vérifient les types, les plages physiques et les champs autorisés (rejet des champs inconnus comme `author_id`).
*   **Intergiciel `validate`** : Placé avant les contrôleurs, il valide `req.body` ou `req.query`, et place les données converties dans `req.validated`.
*   **Gestion centralisée des erreurs** : Le `errorHandler` traduit les erreurs métier et les codes PostgreSQL (ex: `23505` pour les doublons) en réponses HTTP propres (400, 409, etc.) au format RFC 9457, sans exposer de piles d'exécution.
*   **Nettoyage des contrôleurs** : Suppression des `try/catch` et des vérifications manuelles (comme `parseInteger`), Express 5 gère les erreurs asynchrones.

### Vérifications effectuées :
*   Une mesure invalide (`weight_kg: 500`, `humidity_pct: 120`) renvoie une **400** avec les deux messages d'erreur en français.
*   Un corps vide renvoie **400** avec l'indication des champs obligatoires.
*   Un paramètre `limit=abc` renvoie **400**.
*   Un champ non autorisé (`author_id`) dans une inspection renvoie **400**.
## TP 7 — Authentification et autorisation

- Mise en place de l'authentification JWT (access + refresh tokens).
- Hachage des mots de passe avec bcrypt.
- Contrôle d'accès basé sur les rôles (admin, gestionnaire, coordinateur, apiculteur).
- Blocage automatique du compte après 5 échecs de connexion.

## TP 8 — Synchronisation idempotente

- Mise en place de la route `POST /api/inspections/sync` pour recevoir des lots d'inspections.
- Utilisation de `ON CONFLICT DO NOTHING` pour éviter les doublons lors du rejeu.
- Gestion des versions (verrouillage optimiste) pour détecter les conflits de modification.
- Règle de conflit choisie : le serveur l'emporte. Si l'appareil envoie une version périmée, le serveur renvoie un statut `conflict` avec la version actuelle.