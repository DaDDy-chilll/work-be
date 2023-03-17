const { z } = require('zod');
const { paymentType, documentStatus } = require('../constants');

const createDocumentSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must have at least 2 characters.')
      .max(50, 'Name must have at most 50 characters.'),
    type: z
      .enum(Object.values(paymentType), {
        errorMap: (_issue, _ctx) => {
          return { message: 'Invalid document type.' };
        },
      })
      .default(paymentType.normal),
    amount: z.number().positive('Invalid amount'),
    description: z.string().optional(),
    status: z
      .enum(Object.values(documentStatus), {
        errorMap: (_issue, _ctx) => {
          return {
            message: 'Invalid document status.',
          };
        },
      })
      .default(documentStatus.pending),
  }),
});

module.exports = createDocumentSchema;
