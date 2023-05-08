const { isObjectIdOrHexString } = require('mongoose');
const { z, ZodIssueCode } = require('zod');
const _ = require('lodash');
const checkParamsId = require('./checkParamsId.schema');
const {
  DEPARTMENT_LEVELS,
  AUTHORIZED_DEPARTMENTS,
} = require('../constants/user');

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
        department: z.enum(
          Object.values(AUTHORIZED_DEPARTMENTS).filter(
            (d) => d !== 'OFFICE_ADMIN'
          ),
          {
            errorMap: (_issue, _ctx) => ({
              message: 'Invalid department.',
            }),
          }
        ),
      })
    ),
  }),
});

const CREATE_GROUP = z.object({
  body: BASE_GROUP.shape.body.strict(),
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
