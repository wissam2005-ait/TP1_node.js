import { ValidationError } from "../errors.js";
import { MESSAGES } from "../validators/messages.js";

export function validate(schema, source = "body") {
  return function validateRequest(req, res, next) {
    const { value, error } = schema.validate(req[source] ?? {}, {
      abortEarly: false,
      messages: MESSAGES,
      errors: { wrap: { label: false } },
    });
    if (error) {
      throw new ValidationError(error.details.map((d) => d.message).join(" "));
    }
    req.validated = value;
    next();
  };
}