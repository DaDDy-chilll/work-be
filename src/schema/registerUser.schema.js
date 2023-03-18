const { z } = require('zod');
const registerUserBodySchema = require('./registerUserBody.schema');
const userSchemaRefine = require('../helpers/userSchemaRefine');

module.exports = z.object({
  body: registerUserBodySchema.superRefine(userSchemaRefine),
});
