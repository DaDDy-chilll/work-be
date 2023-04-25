const { z } = require('zod');
const registerUserBodySchema = require('./registerUserBody.schema');
const userSchemaRefine = require('../helpers/userSchemaRefine');
const checkParamsId = require('./checkParamsId.schema');

const updateUserSchema = z
  .object({
    body: registerUserBodySchema
      .pick({
        name: true,
        role: true,
        jobLabel: true,
        permissions: true,
        approvalAmount: true,
      })
      .merge(
        z.object({
          password: z.undefined({
            invalid_type_error: 'Invalid request to update credentials.',
          }),
          email: z.undefined({
            invalid_type_error: 'Invalid request to update credentials.',
          }),
        })
      )
      .strict()
      .partial()
      .superRefine(userSchemaRefine),
  })
  .merge(checkParamsId);

module.exports = updateUserSchema;
