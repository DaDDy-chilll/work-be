const { ZodSchema, ZodError } = require('zod');
const { RequestHandler } = require('express');
const ApiError = require('../utils/apiError');

/**
 *
 * @param {ZodSchema} schema - Must be a zod schema
 * @param {any} data - Data to be validated
 * @returns {RequestHandler}
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      const result = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.body = { ...result.body };

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(ApiError.badRequest(error.issues[0].message, error.format()));
      } else {
        next(error);
      }
    }
  };
}

module.exports = validate;
