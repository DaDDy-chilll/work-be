const { isObjectIdOrHexString } = require('mongoose');
const { z } = require('zod');

const updateDocumentSchema = z.object({
  params: z.object({
    id: z.string().refine(isObjectIdOrHexString, 'Invalid document.'),
  }),
  body: z
    .object({
      name: z
        .string()
        .min(2, 'Name must have at least 2 characters.')
        .max(50, 'Name must have at most 50 characters.'),
      amount: z.number().positive('Invalid amount'),
      description: z.string().optional(),
      type: z.undefined({
        invalid_type_error: 'Forbidden key: `type`',
      }),
      status: z.undefined({
        invalid_type_error: 'Forbidden key: `status`',
      }),
    })
    .partial()
    .strict(),
});

module.exports = updateDocumentSchema;
