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
        ApiError.badRequest(
          result.error.issues[0].message,
          result.error.format()
        )
      );
    }

    req.body = { ...result.data.body };

    next();
  };
}

module.exports = validate;
