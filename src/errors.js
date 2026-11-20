export class AppError extends Error {
  constructor(message, status) {
    super(message);
    this.name = this.constructor.name;
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

export class UnauthorizedError extends AppError {
  constructor(message) { super(message, 401); }
}

export class ForbiddenError extends AppError {
  constructor(message) { super(message, 403); }
}