const { ZodSchema } = require('zod');
const { RequestHandler } = require('express');
const ApiError = require('../helpers/apiError');

/**
 *
 * @param {ZodSchema} schema - Must be a zod schema
 * @param {any} data - Data to be validate
 * @returns {RequestHandler}
 */
function validate(schema, data) {
  return (req, res, next) => {
    const result = schema.safeParse(data);

    if (!result.success) {
      return next(ApiError.badRequest('Validation Failed.', result.error));
    }

    next();
  };
}

module.exports = validate;
