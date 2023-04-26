const { z } = require('zod');
const xss = require('xss');
const {
  DOCUMENT_STATUSES,
  DOCUMENT_SECTIONS,
  PAYMENT_TYPES,
} = require('../constants/document');
const { isObjectIdOrHexString } = require('mongoose');
const checkParamsId = require('./checkParamsId.schema');

const GET_DOCUMENTS = z.object({
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
    .strict()
    .refine(({ amountMin, amountMax }) => {
      if (amountMin && amountMax) {
        return amountMin <= amountMax;
      }
      return true;
    }),
});

const CREATE_DOCUMENT = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must have at least 2 characters.')
      .max(50, 'Name must have at most 50 characters.'),
    paymentType: z
      .enum(Object.values(PAYMENT_TYPES), {
        errorMap: (_issue, _ctx) => {
          return { message: 'Invalid document type.' };
        },
      })
      .default(PAYMENT_TYPES.normal),
    amount: z.coerce.number().positive('Invalid amount'),
    description: z.string().transform(xss).optional(),
    state: z
      .object({
        status: z
          .enum(Object.values(DOCUMENT_STATUSES), {
            errorMap: (_issue, _ctx) => ({
              message: 'Invalid document status.',
            }),
          })
          .default(DOCUMENT_STATUSES.pending),
        section: z
          .enum(Object.values(DOCUMENT_SECTIONS), {
            errorMap: (_issue, _ctx) => ({ message: 'Invalid section.' }),
          })
          .default(DOCUMENT_SECTIONS.admin),
      })
      .optional(),
    adminReviewers: z
      .object({
        user: z.string().refine(isObjectIdOrHexString, 'Invalid user ID.'),
        order: z.coerce.number().int().nonnegative('Must be a positive order.'),
      })
      .array(),
  }),
});

const DELETE_DOCUMENT = checkParamsId;

const DOCUMENT_ACTION = z
  .object({
    body: z.object({
      remark: z.string().default('No remark'),
    }),
  })
  .merge(checkParamsId);

const SUBMIT_TO_FAD = z.object({
  body: CREATE_DOCUMENT.shape.body
    .pick({
      name: true,
      amount: true,
      description: true,
    })
    .merge(
      z.object({
        fadReviewers: z
          .object({
            user: z.string().refine(isObjectIdOrHexString, 'Invalid user ID.'),
            order: z.coerce
              .number()
              .int()
              .nonnegative('Must be a positive order.'),
          })
          .array(),
      })
    )
    .strict(),
});

const UPDATE_DOCUMENT = z
  .object({
    body: CREATE_DOCUMENT.shape.body
      .pick({
        name: true,
        description: true,
        amount: true,
      })
      .strict()
      .partial(),
  })
  .merge(checkParamsId);

module.exports = {
  GET_DOCUMENTS,
  CREATE_DOCUMENT,
  DELETE_DOCUMENT,
  DOCUMENT_ACTION,
  SUBMIT_TO_FAD,
  UPDATE_DOCUMENT,
};
