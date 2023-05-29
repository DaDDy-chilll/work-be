const { isObjectIdOrHexString } = require('mongoose');
const { z } = require('zod');
const checkParamsId = require('./checkParamsId.schema');

const BASE_GROUP = z.object({
  body: z.object({
    name: z.string({ required_error: 'Group name is required' }),
    reviewers: z.array(
      z.object({
        index: z.coerce
          .number({ invalid_type_error: 'Order must start from zero.' })
          .int()
          .nonnegative('Order must not be negative.'),
        reviewer: z
          .string({ required_error: 'Reviewer ID is required.' })
          .refine(isObjectIdOrHexString),
        department: z.string().refine(isObjectIdOrHexString),
      })
    ),
  }),
});

const CREATE_GROUP = z.object({
  body: BASE_GROUP.shape.body
    .merge(
      z.object({
        departmentOrders: z.array(
          z.object({
            department: z.string().refine(isObjectIdOrHexString, 'Invalid ID'),
            index: z.number().nonnegative(),
          })
        ),
      })
    )
    .strict(),
});

const UPDATE_GROUP = z
  .object({
    body: BASE_GROUP.shape.body.strict().partial(),
  })
  .merge(checkParamsId);

module.exports = {
  CREATE_GROUP,
  UPDATE_GROUP,
};
