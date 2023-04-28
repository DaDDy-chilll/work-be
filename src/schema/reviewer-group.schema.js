const { isObjectIdOrHexString } = require('mongoose');
const { z, ZodIssueCode } = require('zod');
const _ = require('lodash');
const checkParamsId = require('./checkParamsId.schema');

const BASE_GROUP = z.object({
  body: z.object({
    name: z.string({ required_error: 'Group name is required' }),
    reviewers: z
      .array(
        z.object({
          order: z.coerce
            .number({ invalid_type_error: 'Order must start from zero.' })
            .int()
            .nonnegative('Order must not be negative.'),
          reviewer: z
            .string({ required_error: 'Reviewer ID is required.' })
            .refine(isObjectIdOrHexString),
        })
      )
      // Validate uniqueness
      .refine((reviewers) => {
        const uniqueReviewers = _.uniq(reviewers);

        if (uniqueReviewers.length !== reviewers.length) {
          return false;
        }
        return true;
      }, 'Orders cannot be duplicated.')
      // validate if reviewers are incrementally ordered (thus +1)
      // and transform the array to be sorted by order
      .transform((reviewers, ctx) => {
        const sortedReviewers = _.sortBy(reviewers, ['order']);

        if (sortedReviewers[0]?.order !== 0) {
          ctx.addIssue({
            code: ZodIssueCode.custom,
            message: "Reviewers' order should start from zero",
          });
        }

        // sortedReviewers.length - 1 because we want
        // to avoid last element
        for (let i = 0; i < sortedReviewers.length - 1; i++) {
          const curr = sortedReviewers[i];
          const next = sortedReviewers[i + 1];

          const diff = next.order - curr.order;

          if (diff !== 1) {
            ctx.addIssue({
              code: ZodIssueCode.custom,
              message: 'Reviewers are not incrementally ordered.',
            });
            break;
          }
        }

        return sortedReviewers;
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
