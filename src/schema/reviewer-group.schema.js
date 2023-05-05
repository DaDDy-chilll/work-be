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
    reviewers: z
      .array(
        z.object({
          index: z.coerce
            .number({ invalid_type_error: 'Order must start from zero.' })
            .int()
            .nonnegative('Order must not be negative.'),
          reviewer: z
            .string({ required_error: 'Reviewer ID is required.' })
            .refine(isObjectIdOrHexString),
          department: z.enum(Object.values(AUTHORIZED_DEPARTMENTS), {
            errorMap: (_issue, _ctx) => ({
              message: 'Invalid department.',
            }),
          }),
          canEdit: z
            .boolean({ invalid_type_error: '`canEdit` is invalid' })
            .optional()
            .default(true),
          canPrepare: z
            .boolean({ invalid_type_error: '`canPrepare` is invalid' })
            .optional()
            .default(true),
          canApprove: z
            .boolean({ invalid_type_error: '`canApprove` is invalid' })
            .optional()
            .default(false),
          canVerify: z
            .boolean({ invalid_type_error: '`canVerify` is invalid' })
            .optional()
            .default(true),
        })
      )
      // Validate uniqueness
      .superRefine((reviewers, ctx) => {
        const sortedReviewersByIdx = _.sortBy(reviewers, 'index');

        let departments = [];

        for (let i = 0; i < sortedReviewersByIdx.length; i++) {
          const curr = sortedReviewersByIdx[i];
          const next = sortedReviewersByIdx[i + 1];

          departments.push(curr.department);

          // index should start from zero
          // and be incrementally order
          // Checks by comparing with iterator
          if (i !== curr.index) {
            ctx.addIssue({
              code: ZodIssueCode.custom,
              message: 'Indexes must be incrementally ordered.',
            });
          }

          if (!next) {
            break;
          }

          if (curr.department !== next.department) {
            const diff =
              DEPARTMENT_LEVELS[next.department] -
              DEPARTMENT_LEVELS[curr.department];

            // Checks correct dept order
            if (diff !== 1) {
              ctx.addIssue({
                code: ZodIssueCode.custom,
                message: `Wrong department order: ${curr.department} & ${next.department}`,
              });
            }

            if (!curr.canApprove) {
              ctx.addIssue({
                code: ZodIssueCode.custom,
                message: `Last person in ${curr.department} must have approve privilege.`,
              });
            }
          } else {
            if (curr.canApprove) {
              ctx.addIssue({
                code: ZodIssueCode.custom,
                message: `Only last person in ${curr.department} can have approve privilege.`,
              });
            }
          }
        }

        departments = [...new Set([...departments])];

        if (departments.length !== AUTHORIZED_DEPARTMENTS.length) {
          ctx.addIssue({
            code: ZodIssueCode.custom,
            message: 'Missing department(s)',
          });
        }
      }),
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
