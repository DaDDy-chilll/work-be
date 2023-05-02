const { isObjectIdOrHexString } = require('mongoose');
const { z, ZodIssueCode } = require('zod');
const _ = require('lodash');
const checkParamsId = require('./checkParamsId.schema');
const { AUTHORIZED_DEPARTMENTS: DEPARTMENTS } = require('../constants/user');

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
          department: z.enum(Object.values(DEPARTMENTS), {
            errorMap: (_issue, _ctx) => ({
              message: 'Invalid department.',
            }),
          }),
          canEdit: z
            .boolean({ invalid_type_error: '`canEdit` is invalid' })
            .optional()
            .default(false),
          canPrepare: z
            .boolean({ invalid_type_error: '`canPrepare` is invalid' })
            .optional()
            .default(false),
          canApprove: z
            .boolean({ invalid_type_error: '`canApprove` is invalid' })
            .optional()
            .default(false),
        })
      )
      // Validate uniqueness
      .refine((reviewers) => {
        const uniqueReviewers = _.uniqBy(reviewers, function (elem) {
          // `department + index` makes reviewers order unique in each dept
          return [elem.department, elem.index].join('_');
        });

        if (uniqueReviewers.length !== reviewers.length) {
          return false;
        }
        return true;
      }, 'Reviewers are duplicated.')
      // validate if reviewers are incrementally ordered (thus +1)
      // and transform the array to be sorted by index
      .transform((reviewers, ctx) => {
        const groupedReviewers = _.groupBy(reviewers, 'department');

        const finalReviewers = [];

        _.each(groupedReviewers, (reviewers, group) => {
          const sortedReviewers = _.sortBy(reviewers, ['index']);

          if (sortedReviewers[0]?.index !== 0) {
            ctx.addIssue({
              code: ZodIssueCode.custom,
              message: `${group} reviewers' orders should start from zero`,
            });
          }

          // sortedReviewers.length - 1 because we want
          // to avoid last element
          for (let i = 0; i < sortedReviewers.length - 1; i++) {
            const curr = sortedReviewers[i];
            const next = sortedReviewers[i + 1];

            const diff = next.index - curr.index;

            if (diff !== 1) {
              ctx.addIssue({
                code: ZodIssueCode.custom,
                message: 'Reviewers are not incrementally ordered.',
              });
              break;
            }
          }

          const [last, ...rest] = [...sortedReviewers].reverse();

          // Verbose `returns` for "readability"
          if (!last.canApprove) {
            return ctx.addIssue({
              code: ZodIssueCode.custom,
              message: `Last reviewer in ${last.department} must have approval privilege.`,
            });
          }

          if (rest.some(({ canApprove }) => canApprove)) {
            return ctx.addIssue({
              code: ZodIssueCode.custom,
              message: `More than one reviewr has approval privilege.`,
            });
          }

          // Ungroup the grouped arrays
          finalReviewers.push(...sortedReviewers);
        });

        return finalReviewers;
      }),
  }),
});

const CREATE_GROUP = z.object({
  body: BASE_GROUP.shape.body.strict(),
});

const UPDATE_GROUP = z
  .object({
    body: BASE_GROUP.shape.body.strict(),
  })
  .merge(checkParamsId);

module.exports = {
  CREATE_GROUP,
  UPDATE_GROUP,
};
