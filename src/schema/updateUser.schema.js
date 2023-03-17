const { isObjectIdOrHexString } = require('mongoose');
const { z } = require('zod');
const registerUserSchema = require('./registerUser.schema');
const registerUserBodySchema = require('./registerUserBody.schema');

const updateUserSchema = z.object({
  params: z.object({
    id: z.string().refine(isObjectIdOrHexString),
  }),
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
    .partial(),
});

module.exports = updateUserSchema;
