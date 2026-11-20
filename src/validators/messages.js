// Messages d'erreur de Joi, traduits en français.
// {{#label}} est remplacé par le nom du champ, {{#limit}} par la borne.

export const MESSAGES = {
  "any.required": "{{#label}} est obligatoire.",
  "any.only": "{{#label}} doit valoir l'une de ces valeurs : {{#valids}}.",
  "any.unknown": "{{#label}} n'est pas autorisé.",
  "object.unknown": "{{#label}} n'est pas un champ autorisé.",
  "object.base": "{{#label}} doit être un objet JSON.",
  "number.base": "{{#label}} doit être un nombre.",
  "number.integer": "{{#label}} doit être un entier.",
  "number.min": "{{#label}} doit être supérieur ou égal à {{#limit}}.",
  "number.max": "{{#label}} doit être inférieur ou égal à {{#limit}}.",
  "string.base": "{{#label}} doit être une chaîne de caractères.",
  "string.empty": "{{#label}} ne peut pas être vide.",
  "string.min": "{{#label}} doit contenir au moins {{#limit}} caractères.",
  "string.max": "{{#label}} doit contenir au plus {{#limit}} caractères.",
  "string.email": "{{#label}} doit être une adresse e-mail valide.",
  "string.guid": "{{#label}} doit être un UUID.",
  "boolean.base": "{{#label}} doit valoir true ou false.",
  "date.base": "{{#label}} doit être une date.",
  "date.format": "{{#label}} doit être une date ISO 8601.",
  "array.base": "{{#label}} doit être un tableau.",
  "array.min": "{{#label}} doit contenir au moins {{#limit}} élément(s).",
  "array.max": "{{#label}} doit contenir au plus {{#limit}} éléments.",
};
