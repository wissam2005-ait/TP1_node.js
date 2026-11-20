export class AppError extends Error {
  constructor(message, status) {
    super(message);
    this.name = this.constructor.name; // « NotFoundError », « ValidationError »…
    this.status = status;
  }
}

export class ValidationError extends AppError {
  constructor(message) { super(message, 400); }
}

export class NotFoundError extends AppError {
  constructor(message) { super(message, 404); }
}

export class ConflictError extends AppError {
  constructor(message) { super(message, 409); }
}