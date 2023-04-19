const { z } = require('zod');
const xss = require('xss');

const {
  paymentType,
  documentStatus,
  documentSections,
} = require('../constants');
const { isObjectIdOrHexString } = require('mongoose');

const createDocumentSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must have at least 2 characters.')
      .max(50, 'Name must have at most 50 characters.'),
    paymentType: z
      .enum(Object.values(paymentType), {
        errorMap: (_issue, _ctx) => {
          return { message: 'Invalid document type.' };
        },
      })
      .default(paymentType.normal),
    amount: z.coerce.number().positive('Invalid amount'),
    description: z.string().transform(xss).optional(),
    state: z
      .object({
        status: z
          .enum(Object.values(documentStatus), {
            errorMap: (_issue, _ctx) => ({
              message: 'Invalid document status.',
            }),
          })
          .default(documentStatus.pending),
        section: z
          .enum(Object.values(documentSections), {
            errorMap: (_issue, _ctx) => ({ message: 'Invalid section.' }),
          })
          .default(documentSections.admin),
      })
      .optional(),
    assigneeGroupId: z
      .string()
      .refine(isObjectIdOrHexString, 'Invalid group id.'),
  }),
});

module.exports = createDocumentSchema;
