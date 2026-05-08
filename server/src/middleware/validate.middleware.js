import { validationResult } from 'express-validator';

export function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const err = new Error('Request validation failed');
  err.statusCode = 400;
  err.details = result.array().map(({ path, msg }) => ({ field: path, message: msg }));
  next(err);
}
