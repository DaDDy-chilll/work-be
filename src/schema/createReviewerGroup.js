const { isObjectIdOrHexString } = require('mongoose');
const { z } = require('zod');

module.exports = z.object({
  body: z.object({
    reviewers: z
      .object({
        order: z
          .number({ required_error: 'Order is required.' })
          .int()
          .nonnegative('Must be positive number'),
        user: z.string().refine(isObjectIdOrHexString),
      })
      .array(),
    groupName: z.string().optional(),
  }),
});
