const { z } = require('zod');
const {
  DOCUMENT_STATUSES,
  DOCUMENT_SECTIONS,
} = require('../constants/document');
const { isObjectIdOrHexString } = require('mongoose');

const getDocuments = z.object({
  query: z
    .object({
      sort: z.string().default('-createdAt'),
      limit: z.coerce
        .number({ invalid_type_error: '`limit` must be number' })
        .int('`limit` must be positive integer.')
        .positive('`limit` must be positive integer.')
        .default(10),
      status: z
        .enum(Object.values(DOCUMENT_STATUSES))
        .or(z.array(z.enum(Object.values(DOCUMENT_STATUSES)))),
      section: z.enum(Object.values(DOCUMENT_SECTIONS)),
      amount: z.coerce.number().nonnegative(),
      amountMin: z.coerce.number().nonnegative(),
      amountMax: z.coerce.number().nonnegative(),
      requestedBy: z.string().refine(isObjectIdOrHexString),
      currentReviewer: z.string().refine(isObjectIdOrHexString),
    })
    .partial()
    .strict(),
});

module.exports = {
  getDocuments,
};
