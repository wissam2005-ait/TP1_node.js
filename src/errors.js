// Erreurs métier. Les services les lèvent ; l'intergiciel d'erreur les traduit en code HTTP.
// Un service ne connaît pas HTTP : il dit « introuvable » ou « invalide », pas « 404 » ou « 400 ».

export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConflictError";
  }
}