const { isObjectIdOrHexString } = require('mongoose');
const { z } = require('zod');
const checkParamsId = require('./checkParamsId.schema');
const { REVIEWER_GROUP_TYPES } = require('../constants/reviewer-group');

const GET_WORKFLOWS = z.object({
  query: z.object({
    sort: z.string().default('-createdAt'),
    limit: z.coerce
      .number({ invalid_type_error: '`limit` must be number' })
      .int('`limit` must be positive integer.')
      .default(10),
    page: z.coerce.number().positive().default(1),
    search: z.string().optional(),
    type: z
      .enum([...Object.values(REVIEWER_GROUP_TYPES)], {
        errorMap: () => ({ message: 'Invalid reviewer group type' }),
      })
      .optional(),
    isDisabled: z
      .enum(['true', 'false'], {
        errorMap: () => ({ message: 'Invalid reviewer group status' }),
      })
      .optional(),
  }),
});

const BASE_GROUP = z.object({
  body: z.object({
    name: z.string({ required_error: 'Group name is required' }),
    description: z.string().optional(),
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
    type: z
      .enum([...Object.values(REVIEWER_GROUP_TYPES)], {
        errorMap: () => ({ message: 'Invalid reviewer group type' }),
      })
      .default(REVIEWER_GROUP_TYPES.NORMAL),
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
    body: BASE_GROUP.shape.body
      .merge(
        z.object({
          departmentOrders: z.array(
            z.object({
              department: z
                .string()
                .refine(isObjectIdOrHexString, 'Invalid ID'),
              index: z.number().nonnegative(),
            })
          ),
        })
      )
      .strict()
      .partial(),
  })
  .merge(checkParamsId);

module.exports = {
  CREATE_GROUP,
  UPDATE_GROUP,
  GET_WORKFLOWS,
};
