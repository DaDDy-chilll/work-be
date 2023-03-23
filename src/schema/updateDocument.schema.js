const { z } = require('zod');
const checkParamsId = require('./checkParamsId.schema');

const updateDocumentSchema = z
  .object({
    body: z
      .object({
        name: z
          .string()
          .min(2, 'Name must have at least 2 characters.')
          .max(50, 'Name must have at most 50 characters.'),
        amount: z.number().positive('Invalid amount'),
        description: z.string().optional(),
        state: z.undefined({
          invalid_type_error: 'Forbidden key: `state`',
        }),
        paymentType: z.undefined({
          invalid_type_error: 'Forbidden key: `paymentType`',
        }),
      })
      .partial()
      .strict(),
  })
  .merge(checkParamsId);

module.exports = updateDocumentSchema;
