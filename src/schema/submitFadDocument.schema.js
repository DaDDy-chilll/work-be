const { z } = require('zod');
const { isObjectIdOrHexString } = require('mongoose');

const checkParamsId = require('./checkParamsId.schema');

const submitFadDocumentSchema = z
  .object({
    body: z.object({
      fadAssignees: z
        .object({
          userId: z.string().refine(isObjectIdOrHexString, 'Invalid user ID.'),
          order: z.coerce
            .number()
            .int()
            .nonnegative('Must be a positive order.'),
        })
        .array(),
    }),
  })
  .merge(checkParamsId);

module.exports = submitFadDocumentSchema;
