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