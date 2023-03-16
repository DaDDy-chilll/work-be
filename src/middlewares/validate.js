const { ZodSchema } = require('zod');
const { RequestHandler } = require('express');
const ApiError = require('../helpers/apiError');

/**
 *
 * @param {ZodSchema} schema - Must be a zod schema
 * @param {any} data - Data to be validated
 * @returns {RequestHandler}
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      return next(
        ApiError.badRequest('Validation Failed.', result.error.format())
      );
    }

    next();
  };
}

module.exports = validate;
