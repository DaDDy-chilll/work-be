const { z } = require('zod');
const { paymentType, documentStatus } = require('../constants');

const createDocumentSchema = z.object({
  name: z.string().min(2).max(50),
  type: z
    .enum(Object.values(paymentType))
    .default(paymentType.normal)
    .optional(),
  amount: z.number().positive(),
  description: z.string().optional(),
  status: z
    .enum(Object.values(documentStatus))
    .default(documentStatus.pending)
    .optional(),
});

module.exports = createDocumentSchema;
