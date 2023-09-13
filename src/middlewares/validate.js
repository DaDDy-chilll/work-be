const { ZodError } = require('zod');
const ApiError = require('../utils/apiError');

/**
 *
 * @param {import('zod').ZodSchema} schema - Must be a zod schema
 * @param {any} data - Data to be validated
 * @returns {import('express').RequestHandler}
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      const result = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.body = result.body;
      req.params = result.params || {};
      req.query = result.query || {};

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
