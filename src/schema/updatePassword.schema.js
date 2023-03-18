const { z } = require('zod');
const registerUserBodySchema = require('./registerUserBody.schema');
const { isObjectIdOrHexString } = require('mongoose');

const updatePasswordSchema = z.object({
  params: z.object({
    id: z.string().refine(isObjectIdOrHexString),
  }),
  body: registerUserBodySchema.pick({ password: true }),
});

module.exports = updatePasswordSchema;
