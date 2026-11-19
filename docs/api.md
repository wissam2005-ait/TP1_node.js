# Contrat de l'API Queen Bee — v0

Adresse de base en développement : `http://localhost:3000`

## Conventions communes

- Les corps de requête et de réponse sont en JSON. Une requête avec un corps doit envoyer l'en-tête `Content-Type: application/json`.
- Les dates sont au format ISO 8601, en UTC : `2026-10-31T10:00:00Z`.
- Les paramètres de requête (`?limit=…`) arrivent toujours en texte : `limit=10` est accepté, `limit=abc` ou `limit=1.5` sont refusés.
- Pour l'instant, les données sont gardées en mémoire : ce qui est ajouté est perdu au redémarrage du serveur.

### Format des erreurs (RFC 9457)

Toutes les erreurs ont le même format, avec l'en-tête `Content-Type: application/problem+json` :

```json
{
  "type": "about:blank",
  "title": "Ressource introuvable",
  "status": 404,
  "detail": "Aucune ruche ne porte l'identifiant SN-CASA-999."
}
```

- `title` est l'intitulé du code, le même pour toutes les erreurs de ce code.
- `detail` explique ce qui s'est passé pour cette requête.
- Une réponse d'erreur ne contient jamais de pile d'exécution ni de message SQL.

| Code | `title` |
| --- | --- |
| 400 | Requête invalide |
| 404 | Ressource introuvable |
| 409 | Conflit |
| 500 | Erreur interne |

### Erreurs communes à toutes les routes

- **400** : le corps de la requête n'est pas un JSON valide.
- **404** : aucune route ne correspond à la méthode et au chemin demandés.
- **500** : erreur interne du serveur. Le détail est écrit dans le journal du serveur, pas dans la réponse.

---

## GET /health

État du serveur.

**Paramètres** : aucun.

**200** : le serveur répond.

```json
{ "status": "ok" }
```

---

## GET /api/hives

Liste des ruches, éventuellement filtrée par site.

**Paramètres de requête**

- `site_id` : texte, facultatif. Exemple : `SN-CASA`. Absent ou vide (`?site_id=`) : pas de filtre.

**200** : la liste des ruches (une liste vide si aucune ruche ne correspond au site).

```json
[
  { "id": "SN-CASA-001", "site_id": "SN-CASA", "status": "active" },
  { "id": "SN-CASA-002", "site_id": "SN-CASA", "status": "active" }
]
```

Pas d'erreur propre à cette route.

---

## GET /api/hives/:id

Une ruche.

**Paramètres de chemin**

- `id` : identifiant métier de la ruche, texte. Exemple : `SN-CASA-001`.

**200** : la ruche.

```json
{ "id": "SN-CASA-001", "site_id": "SN-CASA", "status": "active" }
```

**404** : aucune ruche ne porte cet identifiant.

```json
{
  "type": "about:blank",
  "title": "Ressource introuvable",
  "status": 404,
  "detail": "Aucune ruche ne porte l'identifiant XX-NOPE-999."
}
```

---

## GET /api/hives/:id/measures

Historique des mesures d'une ruche, de la plus récente à la plus ancienne.

**Paramètres de chemin**

- `id` : identifiant de la ruche, texte.

**Paramètres de requête**

- `limit` : entier de 1 à 500, 50 par défaut. Nombre de mesures renvoyées.
- `offset` : entier positif ou nul, 0 par défaut. Nombre de mesures sautées depuis la plus récente.

Exemple : `?limit=50&offset=50` renvoie la 2ᵉ page de 50 mesures.

**200** : une page de mesures. `items` est vide si l'`offset` dépasse le nombre de mesures.

```json
{
  "items": [
    {
      "hive_id": "SN-CASA-001",
      "site_id": "SN-CASA",
      "timestamp": "2026-10-31T23:45:00Z",
      "position_lat": 12.574298,
      "position_lon": -16.28731,
      "weight_kg": 36.89,
      "temp_internal_c": 34.4,
      "temp_external_c": 24,
      "humidity_pct": 64,
      "acoustic_activity_score": 0.02,
      "battery_pct": 79
    }
  ],
  "limit": 50,
  "offset": 0
}
```

**400** : `limit` ou `offset` invalide (pas un entier, ou hors des bornes).

```json
{
  "type": "about:blank",
  "title": "Requête invalide",
  "status": 400,
  "detail": "Le paramètre limit doit être un entier compris entre 1 et 500."
}
```

**404** : aucune ruche ne porte cet identifiant.

Les paramètres sont vérifiés avant la ruche : `GET /api/hives/XX-NOPE-999/measures?limit=0` renvoie 400.

---

## POST /api/hives/:id/measures

Enregistre une mesure envoyée par la passerelle d'un site (format du § 6.5 du cahier des charges).

**Paramètres de chemin**

- `id` : identifiant de la ruche, texte.

**Corps**

| Champ | Type | Obligatoire | Remarque |
| --- | --- | --- | --- |
| `timestamp` | date ISO 8601 | oui | instant où le capteur a pris la mesure, conservé tel quel |
| `weight_kg` | nombre | oui | |
| `hive_id` | texte | non | s'il est présent, il doit être celui du chemin |
| `site_id` | texte | non | remplacé par le site de la ruche |
| `position_lat`, `position_lon` | nombre | non | |
| `temp_internal_c`, `temp_external_c` | nombre | non | |
| `humidity_pct` | nombre | non | |
| `acoustic_activity_score` | nombre | non | |
| `battery_pct` | nombre | non | |

```json
{
  "hive_id": "SN-CASA-001",
  "timestamp": "2026-10-31T10:00:00Z",
  "weight_kg": 36.84,
  "temp_internal_c": 34.4,
  "battery_pct": 88
}
```

**201** : la mesure enregistrée.

```json
{
  "hive_id": "SN-CASA-001",
  "site_id": "SN-CASA",
  "timestamp": "2026-10-31T10:00:00Z",
  "weight_kg": 36.84,
  "temp_internal_c": 34.4,
  "battery_pct": 88
}
```

**400** : `timestamp` ou `weight_kg` manque, ou le `hive_id` du corps n'est pas celui du chemin.

```json
{
  "type": "about:blank",
  "title": "Requête invalide",
  "status": 400,
  "detail": "Les champs timestamp et weight_kg sont obligatoires."
}
```

**404** : aucune ruche ne porte cet identifiant.

---

## GET /api/hives/:id/inspections

Inspections d'une ruche, de la plus récente à la plus ancienne.

**Paramètres de chemin**

- `id` : identifiant de la ruche, texte.

**200** : les inspections (`items` est vide si la ruche n'en a aucune).

```json
{
  "items": [
    {
      "id": "0b6c4a0e-6f1f-4d8e-9a3b-1c2d3e4f5a6b",
      "hive_id": "SN-CASA-001",
      "inspected_at": "2026-10-28T09:30:00Z",
      "colony_status": "forte",
      "queen_present": true,
      "observations": "Couvain compact, bonnes réserves de miel."
    }
  ]
}
```

**404** : aucune ruche ne porte cet identifiant.

---

## POST /api/hives/:id/inspections

Enregistre une inspection saisie sur le terrain. L'identifiant est un UUID choisi par l'application mobile, pas par le serveur : l'inspection peut être créée hors connexion.

**Paramètres de chemin**

- `id` : identifiant de la ruche, texte.

**Corps**

| Champ | Type | Obligatoire | Valeurs acceptées |
| --- | --- | --- | --- |
| `id` | texte | oui | un UUID, par exemple `3f2504e0-4f89-41d3-9a0c-0305e82c3301` |
| `inspected_at` | date ISO 8601 | oui | par exemple `2026-10-31T10:00:00Z` |
| `colony_status` | texte | oui | `forte`, `normale`, `faible` ou `morte` |
| `queen_present` | booléen | non | `true` ou `false` ; `null` s'il est absent |
| `observations` | texte | non | `null` s'il est absent |

```json
{
  "id": "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  "inspected_at": "2026-10-31T10:00:00Z",
  "colony_status": "normale",
  "queen_present": true,
  "observations": "RAS"
}
```

**201** : l'inspection créée.

```json
{
  "id": "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  "hive_id": "SN-CASA-001",
  "inspected_at": "2026-10-31T10:00:00Z",
  "colony_status": "normale",
  "queen_present": true,
  "observations": "RAS"
}
```

**400** : un champ obligatoire manque ou un champ a une valeur invalide. Le `detail` nomme le champ.

```json
{
  "type": "about:blank",
  "title": "Requête invalide",
  "status": 400,
  "detail": "Le champ colony_status est obligatoire et doit valoir forte, normale, faible, morte."
}
```

**404** : aucune ruche ne porte cet identifiant.

**409** : une inspection porte déjà cet identifiant.

```json
{
  "type": "about:blank",
  "title": "Conflit",
  "status": 409,
  "detail": "Une inspection porte déjà l'identifiant 3f2504e0-4f89-41d3-9a0c-0305e82c3301."
}
```
